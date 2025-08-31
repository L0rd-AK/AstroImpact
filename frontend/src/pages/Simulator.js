import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import { AuthContext } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix missing leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom impact icon
const impactIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="12" fill="#ff4444" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="8" fill="#ff6666" opacity="0.7"/>
      <circle cx="16" cy="16" r="4" fill="#ffaaaa" opacity="0.5"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map click handler component
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const Simulator = () => {
  const { user } = useContext(AuthContext);
  
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [asteroids, setAsteroids] = useState([]);
  const [impactLocation, setImpactLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  const [impactAngle, setImpactAngle] = useState(45);
  const [impactVelocity, setImpactVelocity] = useState(20);
  const [simulationResults, setSimulationResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadAsteroids();
  }, []);

  const loadAsteroids = async () => {
    try {
      const response = await fetch('/api/asteroids');
      if (response.ok) {
        const data = await response.json();
        setAsteroids(data.asteroids || []);
        if (data.asteroids && data.asteroids.length > 0) {
          setSelectedAsteroid(data.asteroids[0]);
        }
      }
    } catch (error) {
      console.error('Error loading asteroids:', error);
      toast.error('Failed to load asteroid data');
    }
  };

  const handleLocationSelect = (latlng) => {
    setImpactLocation(latlng);
    toast.success(`Impact location set: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
  };

  const runImpactSimulation = async () => {
    if (!selectedAsteroid) {
      toast.error('Please select an asteroid');
      return;
    }

    if (!user) {
      toast.error('Please log in to run simulations');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('User:', user);
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');

    setLoading(true);
    try {
      const simulationData = {
        asteroidId: selectedAsteroid.id,
        impactLocation,
        impactAngle,
        impactVelocity,
        asteroidData: selectedAsteroid
      };

      console.log('Sending simulation data:', simulationData);

      const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(simulationData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const results = await response.json();
        console.log('Simulation results:', results);
        setSimulationResults(results);
        setShowResults(true);
        toast.success('Simulation completed successfully!');
      } else {
        const errorData = await response.json();
        console.error('Simulation failed with error:', errorData);
        throw new Error(errorData.error || 'Simulation failed');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      toast.error(`Failed to run simulation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'catastrophic': return 'danger';
      case 'severe': return 'warning';
      case 'moderate': return 'info';
      default: return 'success';
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <h1>
            <i className="bi bi-cpu me-2"></i>
            Impact Simulator
          </h1>
          <p className="text-white mb-4">
            Model asteroid impact scenarios with real NASA data
          </p>
        </Col>
      </Row>

      <Row>
        {/* Controls Panel */}
        <Col lg={4}>
          <Card className="glass-effect mb-4">
            <Card.Header>
              <h5><i className="bi bi-sliders text-white me-2"></i>Simulation Parameters</h5>
            </Card.Header>
            <Card.Body>
              {/* Asteroid Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Select Asteroid</Form.Label>
                <Form.Select 
                  value={selectedAsteroid?.id || ''} 
                  onChange={(e) => {
                    const asteroid = asteroids.find(a => a.id === e.target.value);
                    setSelectedAsteroid(asteroid);
                  }}
                >
                  <option value="">Choose an asteroid...</option>
                  {asteroids.map((asteroid) => (
                    <option key={asteroid.id} value={asteroid.id}>
                      {asteroid.name} ({asteroid.estimatedDiameter?.kilometers?.estimated_diameter_max?.toFixed(2) || '?'} km)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedAsteroid && (
                <Card className="mb-3 bg-dark border-secondary">
                  <Card.Body className="p-3">
                    <h6 className="text-primary">{selectedAsteroid.name}</h6>
                    <small className="text-muted text-white d-block">
                      <strong>Diameter:</strong> {selectedAsteroid.estimatedDiameter?.kilometers?.estimated_diameter_max?.toFixed(2) || 'Unknown'} km
                    </small>
                    <small className="text-muted text-white d-block">
                      <strong>Hazardous:</strong> {selectedAsteroid.isPotentiallyHazardousAsteroid ? 'Yes' : 'No'}
                    </small>
                    {selectedAsteroid.closeApproachData?.[0] && (
                      <small className="text-muted text-white d-block">
                        <strong>Velocity:</strong> {parseFloat(selectedAsteroid.closeApproachData[0].relativeVelocity?.kilometersPerSecond || 0).toFixed(1)} km/s
                      </small>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Impact Parameters */}
              <Form.Group className="mb-3">
                <Form.Label>Impact Angle (degrees)</Form.Label>
                <Form.Range
                  min="15"
                  max="90"
                  value={impactAngle}
                  onChange={(e) => setImpactAngle(e.target.value)}
                />
                <small className="text-muted text-white">{impactAngle}° from horizontal</small>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Impact Velocity (km/s)</Form.Label>
                <Form.Range
                  min="11"
                  max="72"
                  value={impactVelocity}
                  onChange={(e) => setImpactVelocity(e.target.value)}
                />
                <small className="text-muted text-white">{impactVelocity} km/s</small>
              </Form.Group>

              {/* Location Display */}
              <Form.Group className="mb-3">
                <Form.Label>Impact Coordinates</Form.Label>
                <Form.Control
                  type="text"
                  value={`${impactLocation.lat.toFixed(4)}, ${impactLocation.lng.toFixed(4)}`}
                  readOnly
                />
                <small className="text-muted text-white">Click on the map to select location</small>
              </Form.Group>

              <Button 
                variant="danger" 
                size="lg" 
                className="w-100"
                onClick={runImpactSimulation}
                disabled={loading || !selectedAsteroid || !user}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-fill me-2"></i>
                    Run Impact Simulation
                  </>
                )}
              </Button>

              {!user && (
                <Alert variant="warning" className="mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Please{' '}
                  <a href="/login" className="alert-link">log in</a>{' '}
                  or{' '}
                  <a href="/register" className="alert-link">create an account</a>{' '}
                  to run simulations
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Map Panel */}
        <Col lg={8}>
          <Card className="glass-effect">
            <Card.Header>
              <h5><i className="bi bi-geo-alt me-2"></i>Impact Location</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ height: '500px', width: '100%' }}>
                <MapContainer
                  center={[impactLocation.lat, impactLocation.lng]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onLocationSelect={handleLocationSelect} />
                  <Marker 
                    position={[impactLocation.lat, impactLocation.lng]} 
                    icon={impactIcon}
                  />
                </MapContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results Modal */}
      <Modal 
        show={showResults} 
        onHide={() => setShowResults(false)} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Impact Simulation Results
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          {simulationResults && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-dark border-secondary">
                    <Card.Body>
                      <h6 className="text-primary">Impact Energy</h6>
                      <h4>{formatNumber(simulationResults.results.energy)} Joules</h4>
                      <small className="text-muted text-white">
                        TNT Equivalent: {formatNumber(simulationResults.results.tntEquivalent)} tons
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-dark border-secondary">
                    <Card.Body>
                      <h6 className="text-warning">Crater Diameter</h6>
                      <h4>{simulationResults.results.craterDiameter.toFixed(1)} km</h4>
                      <small className="text-muted text-white">
                        Depth: {simulationResults.results.craterDepth.toFixed(1)} km
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <h6>Impact Severity</h6>
                  <Badge bg={getSeverityColor(simulationResults.results.severity)} className="fs-6 p-2">
                    {simulationResults.results.severity.toUpperCase()}
                  </Badge>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={4}>
                  <Card className="bg-dark border-secondary">
                    <Card.Body className="text-center">
                      <h6 className="text-danger">Affected Area</h6>
                      <h5>{formatNumber(simulationResults.results.affectedArea)} km²</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-dark border-secondary">
                    <Card.Body className="text-center">
                      <h6 className="text-warning">Estimated Casualties</h6>
                      <h5>{formatNumber(simulationResults.results.estimatedCasualties)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-dark border-secondary">
                    <Card.Body className="text-center">
                      <h6 className="text-info">Economic Impact</h6>
                      <h5>${formatNumber(simulationResults.results.economicImpact)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {simulationResults.results.mitigationStrategies && (
                <div className="mt-4">
                  <h6>Recommended Mitigation Strategies</h6>
                  <ul className="list-unstyled">
                    {simulationResults.results.mitigationStrategies.map((strategy, index) => (
                      <li key={index} className="mb-2">
                        <Badge bg="info" className="me-2">{index + 1}</Badge>
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="outline-light" onClick={() => setShowResults(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            toast.success('Results saved to your profile!');
            setShowResults(false);
          }}>
            Save Results
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Simulator;
