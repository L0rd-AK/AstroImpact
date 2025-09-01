import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import { AuthContext } from '../context/AuthContext';
import { SafeEarth3D, SafeAsteroid3D, SafeImpact3D, SafeEnhancedImpact3D, is3DSupported } from '../components/3D';
import api from '../utils/api';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [asteroids, setAsteroids] = useState([]);
  const [impactLocation, setImpactLocation] = useState({ lat: 23.8785, lng: 90.3217 }); // Default to DIU 23.8785, 90.3217
  const [impactAngle, setImpactAngle] = useState(45);
  const [impactVelocity, setImpactVelocity] = useState(20);
  const [simulationResults, setSimulationResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('2d'); // '2d', '3d-earth', '3d-asteroid', '3d-impact'
  const [animate3D, setAnimate3D] = useState(false);
  const [webGL3DSupported, setWebGL3DSupported] = useState(true);
  const [useEnhanced3D, setUseEnhanced3D] = useState(true); // Toggle for enhanced vs basic 3D
  
  useEffect(() => {
    loadAsteroids();
    // Check 3D support
    setWebGL3DSupported(is3DSupported());
  }, []);

  useEffect(() => {
    // Handle pre-selected asteroid from navigation state or URL params
    const asteroidId = location.state?.asteroidId || searchParams.get('asteroid');
    if (asteroidId && asteroids.length > 0) {
      const preSelectedAsteroid = asteroids.find(ast => ast._id === asteroidId);
      if (preSelectedAsteroid) {
        setSelectedAsteroid(preSelectedAsteroid);
        toast.success(`Selected asteroid: ${preSelectedAsteroid.name}`);
      }
    }
  }, [asteroids, location.state, searchParams]);

  const loadAsteroids = async () => {
    try {
      const response = await api.get('/api/asteroids');
      const data = response.data;
      setAsteroids(data.asteroids || []);
      
      // Check for pre-selected asteroid
      const asteroidId = location.state?.asteroidId || searchParams.get('asteroid');
      if (asteroidId && data.asteroids) {
        const preSelectedAsteroid = data.asteroids.find(ast => ast._id === asteroidId);
        if (preSelectedAsteroid) {
          setSelectedAsteroid(preSelectedAsteroid);
        } else if (data.asteroids.length > 0) {
          setSelectedAsteroid(data.asteroids[0]);
        }
      } else if (data.asteroids && data.asteroids.length > 0) {
        setSelectedAsteroid(data.asteroids[0]);
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

  const response = await api.post('/api/simulations', simulationData);

      console.log('Response status:', response.status);
      console.log('Simulation results:', response.data);
      setSimulationResults(response.data);
      setShowResults(true);
      toast.success('Simulation completed successfully!');
    } catch (error) {
      console.error('Simulation failed with error:', error);
      const message = error.response?.data?.error || 'Simulation failed';
      toast.error(message);
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
      {/* 3D Support Warning */}
      {!webGL3DSupported && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Limited 3D Support
          </Alert.Heading>
          <p>
            Your browser doesn't support WebGL, so 3D visualizations are disabled. 
            You can still use the full-featured 2D map simulator.
          </p>
          <hr />
          <p className="mb-0">
            For the best experience, try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </Alert>
      )}
      
      <Row>
        <Col>
          <h1>
            <i className="bi bi-cpu me-2"></i>
            Impact Simulator
          </h1>
          <p className="text-white mb-4">
            Model asteroid impact scenarios with real NASA data
            {webGL3DSupported && <span className="text-success ms-2">
              <i className="bi bi-check-circle me-1"></i>3D Ready
            </span>}
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
                  className='text-white bg-dark'
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

        {/* Visualization Panel */}
        <Col lg={8}>
          <Card className="glass-effect">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5><i className="bi bi-geo-alt me-2"></i>Impact Visualization</h5>
              
              {/* View Mode Buttons */}
              <div className="btn-group" role="group">
                <Button
                  variant={viewMode === '2d' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('2d')}
                >
                  <i className="bi bi-map me-1"></i>2D Map
                </Button>
                <Button
                  variant={viewMode === '3d-earth' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('3d-earth')}
                  disabled={!webGL3DSupported}
                  title={!webGL3DSupported ? 'WebGL not supported' : ''}
                >
                  <i className="bi bi-globe me-1"></i>3D Earth
                </Button>
                <Button
                  variant={viewMode === '3d-asteroid' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('3d-asteroid')}
                  disabled={!webGL3DSupported || !selectedAsteroid}
                  title={!webGL3DSupported ? 'WebGL not supported' : !selectedAsteroid ? 'Select an asteroid first' : ''}
                >
                  <i className="bi bi-asterisk me-1"></i>3D Asteroid
                </Button>
                <Button
                  variant={viewMode === '3d-impact' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('3d-impact')}
                  disabled={!webGL3DSupported}
                  title={!webGL3DSupported ? 'WebGL not supported' : ''}
                >
                  <i className="bi bi-exclamation-triangle me-1"></i>3D Impact
                </Button>
              </div>
            </Card.Header>
            
            <Card.Body className="p-0">
              <div style={{ height: '500px', width: '100%' }}>
                {/* 2D Map View */}
                {viewMode === '2d' && (
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
                )}
                
                {/* 3D Earth View */}
                {viewMode === '3d-earth' && (
                  <div style={{ height: '100%', background: '#000' }}>
                    <SafeEarth3D
                      impactLocation={impactLocation}
                      asteroidData={selectedAsteroid}
                      showImpact={!!simulationResults}
                      animateImpact={animate3D}
                      onAnimationComplete={() => setAnimate3D(false)}
                    />
                  </div>
                )}
                
                {/* 3D Asteroid View */}
                {viewMode === '3d-asteroid' && selectedAsteroid && (
                  <div style={{ height: '100%', background: '#000' }}>
                    <SafeAsteroid3D
                      asteroidData={selectedAsteroid}
                      showComparison={true}
                      showTrajectory={animate3D}
                    />
                  </div>
                )}
                
                {/* 3D Impact Simulation */}
                {viewMode === '3d-impact' && (
                  <div style={{ height: '100%', background: '#000' }}>
                    {useEnhanced3D ? (
                      <SafeEnhancedImpact3D
                        simulationData={{
                          impactData: simulationResults?.results,
                          asteroidData: selectedAsteroid,
                          impactLocation,
                          impactAngle,
                          impactVelocity,
                          animate: animate3D
                        }}
                        onAnimationComplete={() => setAnimate3D(false)}
                      />
                    ) : (
                      <SafeImpact3D
                        impactData={simulationResults?.results}
                        asteroidData={selectedAsteroid}
                        animate={animate3D}
                        onAnimationComplete={() => setAnimate3D(false)}
                      />
                    )}
                  </div>
                )}
                
                {/* View Instructions */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  zIndex: 1000
                }}>
                  {viewMode === '2d' && (
                    <>
                      <i className="bi bi-info-circle me-1"></i>
                      Click on map to set impact location
                    </>
                  )}
                  {viewMode.startsWith('3d') && (
                    <>
                      <i className="bi bi-mouse me-1"></i>
                      Drag to rotate • Scroll to zoom • Click objects for details
                    </>
                  )}
                </div>
                
                {/* 3D Animation Controls */}
                {viewMode.startsWith('3d') && simulationResults && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000
                  }}>
                    <div className="d-flex flex-column gap-2">
                      <Button
                        variant={animate3D ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => setAnimate3D(!animate3D)}
                        disabled={loading}
                      >
                        <i className={`bi bi-${animate3D ? 'stop' : 'play'}-circle me-1`}></i>
                        {animate3D ? 'Stop' : 'Animate'} Impact
                      </Button>
                      
                      {/* Enhanced 3D Toggle (only for impact view) */}
                      {viewMode === '3d-impact' && (
                        <Button
                          variant={useEnhanced3D ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => setUseEnhanced3D(!useEnhanced3D)}
                          title={useEnhanced3D ? 'Switch to Basic 3D' : 'Switch to Enhanced 3D'}
                        >
                          <i className={`bi bi-${useEnhanced3D ? 'cpu' : 'cpu-fill'} me-1`}></i>
                          {useEnhanced3D ? 'Enhanced' : 'Basic'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
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
