import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { SafeEnhancedImpact3D, is3DSupported } from '../components/3D';

const Enhanced3DTest = () => {
  const [webGL3DSupported, setWebGL3DSupported] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [testScenario, setTestScenario] = useState('small');
  
  useEffect(() => {
    setWebGL3DSupported(is3DSupported());
  }, []);

  // Test data scenarios
  const testScenarios = {
    small: {
      name: "Small Asteroid (Chelyabinsk-like)",
      asteroidData: {
        id: "test-small",
        name: "Test Small Asteroid",
        estimatedDiameter: {
          kilometers: {
            estimated_diameter_max: 0.02 // 20 meters
          }
        },
        isPotentiallyHazardousAsteroid: false,
        closeApproachData: [{
          relativeVelocity: {
            kilometersPerSecond: "18.5"
          }
        }]
      },
      simulationResults: {
        energy: 5.4e14,
        tntEquivalent: 440000,
        craterDiameter: 0.15,
        craterDepth: 0.03,
        severity: 'moderate',
        affectedArea: 1500,
        estimatedCasualties: 1500,
        economicImpact: 33000000
      },
      impactLocation: { lat: 55.1544, lng: 61.4292 }, // Chelyabinsk
      impactAngle: 18,
      impactVelocity: 18.5
    },
    medium: {
      name: "Medium Asteroid (Tunguska-like)",
      asteroidData: {
        id: "test-medium",
        name: "Test Medium Asteroid",
        estimatedDiameter: {
          kilometers: {
            estimated_diameter_max: 0.06 // 60 meters
          }
        },
        isPotentiallyHazardousAsteroid: true,
        closeApproachData: [{
          relativeVelocity: {
            kilometersPerSecond: "27.0"
          }
        }]
      },
      simulationResults: {
        energy: 1.5e16,
        tntEquivalent: 12000000,
        craterDiameter: 1.2,
        craterDepth: 0.2,
        severity: 'severe',
        affectedArea: 2150,
        estimatedCasualties: 0, // Remote area
        economicImpact: 0
      },
      impactLocation: { lat: 60.8858, lng: 101.8917 }, // Tunguska
      impactAngle: 30,
      impactVelocity: 27.0
    },
    large: {
      name: "Large Asteroid (Chicxulub-like)",
      asteroidData: {
        id: "test-large",
        name: "Test Large Asteroid",
        estimatedDiameter: {
          kilometers: {
            estimated_diameter_max: 10 // 10 km
          }
        },
        isPotentiallyHazardousAsteroid: true,
        closeApproachData: [{
          relativeVelocity: {
            kilometersPerSecond: "30.0"
          }
        }]
      },
      simulationResults: {
        energy: 4.2e23,
        tntEquivalent: 100000000000000, // 100 trillion tons
        craterDiameter: 150,
        craterDepth: 20,
        severity: 'catastrophic',
        affectedArea: 70000000, // Global
        estimatedCasualties: 6000000000,
        economicImpact: 100000000000000 // 100 trillion
      },
      impactLocation: { lat: 21.4, lng: -89.5 }, // Chicxulub
      impactAngle: 60,
      impactVelocity: 30.0
    }
  };

  const currentScenario = testScenarios[testScenario];

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

  if (!webGL3DSupported) {
    return (
      <Container className="py-5" style={{ marginTop: '100px' }}>
        <Alert variant="danger">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            WebGL Not Supported
          </Alert.Heading>
          <p>
            Your browser doesn't support WebGL, which is required for the Enhanced 3D visualization.
            Please try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <h1>
            <i className="bi bi-cpu-fill me-2"></i>
            Enhanced 3D Animation Test
          </h1>
          <p className="text-white mb-4">
            Test the new enhanced 3D asteroid impact animation system with realistic scenarios
          </p>
        </Col>
      </Row>

      <Row>
        {/* Test Controls */}
        <Col lg={4}>
          <Card className="glass-effect mb-4">
            <Card.Header>
              <h5><i className="bi bi-sliders text-white me-2"></i>Test Controls</h5>
            </Card.Header>
            <Card.Body>
              {/* Scenario Selection */}
              <Form.Group className="mb-3">
                <Form.Label>Test Scenario</Form.Label>
                <Form.Select
                  className='text-white bg-dark'
                  value={testScenario}
                  onChange={(e) => {
                    setTestScenario(e.target.value);
                    setAnimate(false); // Reset animation
                  }}
                >
                  <option value="small">Small Asteroid (Chelyabinsk-like)</option>
                  <option value="medium">Medium Asteroid (Tunguska-like)</option>
                  <option value="large">Large Asteroid (Chicxulub-like)</option>
                </Form.Select>
              </Form.Group>

              {/* Scenario Info */}
              <Card className="mb-3 bg-dark border-secondary">
                <Card.Body className="p-3">
                  <h6 className="text-primary">{currentScenario.asteroidData.name}</h6>
                  <small className="text-muted text-white d-block">
                    <strong>Diameter:</strong> {currentScenario.asteroidData.estimatedDiameter.kilometers.estimated_diameter_max} km
                  </small>
                  <small className="text-muted text-white d-block">
                    <strong>Velocity:</strong> {currentScenario.asteroidData.closeApproachData[0].relativeVelocity.kilometersPerSecond} km/s
                  </small>
                  <small className="text-muted text-white d-block">
                    <strong>Impact Angle:</strong> {currentScenario.impactAngle}°
                  </small>
                  <small className="text-muted text-white d-block">
                    <strong>Severity:</strong>{' '}
                    <Badge bg={getSeverityColor(currentScenario.simulationResults.severity)}>
                      {currentScenario.simulationResults.severity.toUpperCase()}
                    </Badge>
                  </small>
                </Card.Body>
              </Card>

              {/* Animation Controls */}
              <div className="d-grid gap-2">
                <Button
                  variant={animate ? 'danger' : 'success'}
                  size="lg"
                  onClick={() => setAnimate(!animate)}
                >
                  <i className={`bi bi-${animate ? 'stop' : 'play'}-circle me-2`}></i>
                  {animate ? 'Stop Animation' : 'Start Animation'}
                </Button>
              </div>

              {/* Performance Info */}
              <Alert variant="info" className="mt-3 mb-0">
                <h6><i className="bi bi-info-circle me-2"></i>Enhanced Features</h6>
                <ul className="mb-0 small">
                  <li>Physics-based trajectory simulation</li>
                  <li>Advanced particle systems (plasma, explosion, debris)</li>
                  <li>Realistic material shaders</li>
                  <li>Performance optimization (LOD, pooling)</li>
                  <li>Interactive camera controls</li>
                  <li>Real-time animation timeline</li>
                </ul>
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        {/* 3D Visualization */}
        <Col lg={8}>
          <Card className="glass-effect">
            <Card.Header>
              <h5>
                <i className="bi bi-cpu me-2"></i>
                Enhanced 3D Impact Simulation
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ height: '600px', width: '100%', background: '#000' }}>
                <SafeEnhancedImpact3D
                  simulationData={{
                    impactData: currentScenario.simulationResults,
                    asteroidData: currentScenario.asteroidData,
                    impactLocation: currentScenario.impactLocation,
                    impactAngle: currentScenario.impactAngle,
                    impactVelocity: currentScenario.impactVelocity,
                    animate: animate
                  }}
                  onAnimationComplete={() => setAnimate(false)}
                />
                
                {/* Instructions */}
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
                  <i className="bi bi-mouse me-1"></i>
                  Drag to rotate • Scroll to zoom • Click UI controls for settings
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Results Preview */}
          <Card className="glass-effect mt-4">
            <Card.Header>
              <h6><i className="bi bi-bar-chart me-2"></i>Impact Results Preview</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-primary">Energy</h6>
                    <div>{formatNumber(currentScenario.simulationResults.energy)} J</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-warning">Crater</h6>
                    <div>{currentScenario.simulationResults.craterDiameter} km</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-danger">Affected Area</h6>
                    <div>{formatNumber(currentScenario.simulationResults.affectedArea)} km²</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h6 className="text-info">TNT Equivalent</h6>
                    <div>{formatNumber(currentScenario.simulationResults.tntEquivalent)} tons</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Enhanced3DTest;
