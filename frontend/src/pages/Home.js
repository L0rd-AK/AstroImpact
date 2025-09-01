import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useSimulation } from '../context/SimulationContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { fetchFeaturedAsteroids, getAsteroidStats, getSimulationStats } = useSimulation();
  const [featuredAsteroids, setFeaturedAsteroids] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [asteroids, asteroidStats, simulationStats] = await Promise.all([
        fetchFeaturedAsteroids(6),
        getAsteroidStats(),
        getSimulationStats()
      ]);
      
      setFeaturedAsteroids(asteroids);
      setStats({ ...asteroidStats, ...simulationStats });
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section py-5 mt-5">
        <Container>
          <div className="fade-in-animation">
            <Row className="align-items-center min-vh-100">
              <Col lg={6}>
                <h1 className="display-4 fw-bold mb-4 text-glow">
                  AstroImpact Simulator
                </h1>
                <p className="lead mb-4 text-secondary">
                  Explore asteroid impact scenarios using real NASA data. Model devastating 
                  collisions, predict consequences, and develop mitigation strategies to 
                  protect our planet.
                </p>
                <p className="mb-4">
                  Built for the <strong>2025 NASA Space Apps Challenge</strong> - 
                  addressing the "Meteor Madness" challenge with cutting-edge simulation 
                  technology and real-time collaboration.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  {isAuthenticated ? (
                    <LinkContainer to="/simulator">
                      <Button variant="primary" size="lg" className="hover-scale">
                        <i className="bi bi-rocket-takeoff me-2"></i>
                        Start Simulation
                      </Button>
                    </LinkContainer>
                  ) : (
                    <LinkContainer to="/register">
                      <Button variant="primary" size="lg" className="hover-scale">
                        <i className="bi bi-person-plus me-2"></i>
                        Get Started
                      </Button>
                    </LinkContainer>
                  )}
                  
                  <LinkContainer to="/asteroids">
                    <Button variant="outline-primary" size="lg" className="hover-scale">
                      <i className="bi bi-search me-2"></i>
                      Explore Asteroids
                    </Button>
                  </LinkContainer>
                </div>
              </Col>
              
              <Col lg={6} className="text-center">
                <div className="hero-animation">
                  <div className="planet-earth">
                    <div className="asteroid-approaching"></div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* Statistics Section */}
      <section className="stats-section py-5 bg-dark">
        <Container>
          <div className="slide-in-animation">
            <Row className="text-center">
              <Col md={3} className="mb-4">
                <Card className="glass-effect h-100">
                  <Card.Body>
                    <i className="bi bi-asterisk display-4 text-primary mb-3"></i>
                    <h3 className="fw-bold">{stats.totalAsteroids || 0}</h3>
                    <p className="text-muted">Asteroids Tracked</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={3} className="mb-4">
                <Card className="glass-effect h-100">
                  <Card.Body>
                    <i className="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
                    <h3 className="fw-bold">{stats.hazardousAsteroids || 0}</h3>
                    <p className="text-muted">Potentially Hazardous</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={3} className="mb-4">
                <Card className="glass-effect h-100">
                  <Card.Body>
                    <i className="bi bi-cpu display-4 text-success mb-3"></i>
                    <h3 className="fw-bold">{stats.totalSimulations || 0}</h3>
                    <p className="text-muted">Simulations Run</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={3} className="mb-4">
                <Card className="glass-effect h-100">
                  <Card.Body>
                    <i className="bi bi-people display-4 text-info mb-3"></i>
                    <h3 className="fw-bold">{stats.publicSimulations || 0}</h3>
                    <p className="text-muted">Community Shares</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* Featured Asteroids Section */}
      <section className="featured-section py-5">
        <Container>
          <Row>
            <Col>
              <h2 className="text-center mb-5">Featured Near-Earth Asteroids</h2>
              <Row>
                {featuredAsteroids?.map((asteroid, index) => (
                  <Col md={6} lg={4} key={asteroid._id} className="mb-4">
                    <Card className="h-100 hover-scale">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-truncate" title={asteroid.name}>
                          {asteroid.name}
                        </h6>
                        {asteroid.is_potentially_hazardous_asteroid && (
                          <Badge bg="warning" text="dark">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Hazardous
                          </Badge>
                        )}
                      </Card.Header>
                      
                      <Card.Body>
                        <div className="mb-3">
                          <small className="text-muted">Diameter</small>
                          <div className="fw-bold">
                            {asteroid.calculatedProperties?.averageDiameter 
                              ? `${(asteroid.calculatedProperties.averageDiameter / 1000).toFixed(2)} km`
                              : 'Unknown'
                            }
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <small className="text-muted">Velocity</small>
                          <div className="fw-bold">
                            {asteroid.calculatedProperties?.averageVelocity 
                              ? `${asteroid.calculatedProperties.averageVelocity.toFixed(2)} km/s`
                              : 'Unknown'
                            }
                          </div>
                        </div>
                        
                        {asteroid.calculatedProperties?.kineticEnergy && (
                          <div className="mb-3">
                            <small className="text-muted">Kinetic Energy</small>
                            <div className="fw-bold">
                              {(asteroid.calculatedProperties.kineticEnergy / 1e15).toExponential(2)} PJ
                            </div>
                          </div>
                        )}
                      </Card.Body>
                      
                      <Card.Footer>
                        {isAuthenticated ? (
                          <LinkContainer to={{
                            pathname: '/simulator',
                            search: `?asteroid=${asteroid._id}`
                          }}>
                            <Button variant="primary" size="sm" className="w-100">
                              <i className="bi bi-play-circle me-1"></i>
                              Simulate Impact
                            </Button>
                          </LinkContainer>
                        ) : (
                          <LinkContainer to="/register">
                            <Button variant="outline-primary" size="sm" className="w-100">
                              <i className="bi bi-person-plus me-1"></i>
                              Register to Simulate
                            </Button>
                          </LinkContainer>
                        )}
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
              
              <div className="text-center mt-4">
                <LinkContainer to="/asteroids">
                  <Button variant="outline-primary">
                    <i className="bi bi-arrow-right me-2"></i>
                    View All Asteroids
                  </Button>
                </LinkContainer>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-dark">
        <Container>
          <Row>
            <Col>
              <h2 className="text-center mb-5">Key Features</h2>
              <Row>
                <Col md={6} lg={3} className="mb-4">
                  <Card className="glass-effect h-100 text-center">
                    <Card.Body>
                      <i className="bi bi-database display-4 text-primary mb-3"></i>
                      <h5>Real NASA Data</h5>
                      <p className="text-muted">
                        Live asteroid data from NASA's NeoWs API with accurate orbital parameters.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} lg={3} className="mb-4">
                  <Card className="glass-effect h-100 text-center">
                    <Card.Body>
                      <i className="bi bi-geo-alt display-4 text-success mb-3"></i>
                      <h5>Interactive Maps</h5>
                      <p className="text-muted">
                        Select impact locations worldwide with detailed consequence visualization.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} lg={3} className="mb-4">
                  <Card className="glass-effect h-100 text-center">
                    <Card.Body>
                      <i className="bi bi-shield-check display-4 text-warning mb-3"></i>
                      <h5>Mitigation Planning</h5>
                      <p className="text-muted">
                        Design and test asteroid deflection strategies with effectiveness modeling.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} lg={3} className="mb-4">
                  <Card className="glass-effect h-100 text-center">
                    <Card.Body>
                      <i className="bi bi-people display-4 text-info mb-3"></i>
                      <h5>Community Sharing</h5>
                      <p className="text-muted">
                        Share simulations, vote on strategies, and collaborate with other users.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
