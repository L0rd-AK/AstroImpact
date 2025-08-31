import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useSimulation } from '../context/SimulationContext';
import { LinkContainer } from 'react-router-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const { fetchUserSimulations, getSimulationStats, getAsteroidStats } = useSimulation();
  const [userSimulations, setUserSimulations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [simulationsData, simStats, asteroidStats] = await Promise.all([
        fetchUserSimulations({ limit: 5 }),
        getSimulationStats(),
        getAsteroidStats()
      ]);
      
      setUserSimulations(simulationsData.simulations || []);
      setStats({ ...simStats, ...asteroidStats });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Simulations Run', 'Mitigations Proposed', 'Votes Received', 'Points Earned'],
    datasets: [
      {
        label: 'Your Stats',
        data: [
          user?.stats?.simulationsRun || 0,
          user?.stats?.mitigationsProposed || 0,
          user?.stats?.votesReceived || 0,
          user?.stats?.points || 0
        ],
        backgroundColor: [
          'rgba(0, 102, 204, 0.6)',
          'rgba(255, 107, 53, 0.6)',
          'rgba(0, 212, 255, 0.6)',
          'rgba(40, 167, 69, 0.6)'
        ],
        borderColor: [
          'rgba(0, 102, 204, 1)',
          'rgba(255, 107, 53, 1)',
          'rgba(0, 212, 255, 1)',
          'rgba(40, 167, 69, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Your Activity Overview',
        color: '#ffffff'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  if (loading) {
    return (
      <Container className="py-5 mt-5">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="mt-3">Loading your dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>Welcome back, {user?.username}!</h1>
              <p className="text-muted">Here's your asteroid impact simulation overview</p>
            </div>
            <LinkContainer to="/simulator">
              <Button variant="primary">
                <i className="bi bi-plus-circle me-2"></i>
                New Simulation
              </Button>
            </LinkContainer>
          </div>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="glass-effect h-100">
            <Card.Body className="text-center">
              <i className="bi bi-cpu display-6 text-primary mb-2"></i>
              <h4>{user?.stats?.simulationsRun || 0}</h4>
              <p className="text-muted mb-0">Simulations Run</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="glass-effect h-100">
            <Card.Body className="text-center">
              <i className="bi bi-shield-check display-6 text-success mb-2"></i>
              <h4>{user?.stats?.mitigationsProposed || 0}</h4>
              <p className="text-muted mb-0">Mitigations Proposed</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="glass-effect h-100">
            <Card.Body className="text-center">
              <i className="bi bi-heart display-6 text-danger mb-2"></i>
              <h4>{user?.stats?.votesReceived || 0}</h4>
              <p className="text-muted mb-0">Votes Received</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="glass-effect h-100">
            <Card.Body className="text-center">
              <i className="bi bi-star display-6 text-warning mb-2"></i>
              <h4>{user?.stats?.points || 0}</h4>
              <p className="text-muted mb-0">Points Earned</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Recent Simulations */}
        <Col lg={8} className="mb-4">
          <Card className="glass-effect">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Simulations
              </h5>
              <LinkContainer to="/simulations">
                <Button variant="outline-primary" size="sm">
                  View All
                </Button>
              </LinkContainer>
            </Card.Header>
            
            <Card.Body>
              {userSimulations.length > 0 ? (
                <Table responsive variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      <th>Asteroid</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSimulations.map((simulation) => (
                      <tr key={simulation._id}>
                        <td>
                          <div>
                            <strong>{simulation.asteroid?.name}</strong>
                            {simulation.asteroid?.is_potentially_hazardous_asteroid && (
                              <Badge bg="warning" text="dark" className="ms-2">
                                Hazardous
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          {simulation.impactLocation?.city || 'Unknown'}, {simulation.impactLocation?.country || 'Unknown'}
                        </td>
                        <td>
                          {new Date(simulation.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <LinkContainer to={`/simulation/${simulation._id}`}>
                            <Button variant="outline-primary" size="sm">
                              View
                            </Button>
                          </LinkContainer>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  You haven't run any simulations yet. 
                  <LinkContainer to="/simulator">
                    <Button variant="link" className="p-0 ms-1">
                      Start your first simulation
                    </Button>
                  </LinkContainer>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Activity Chart */}
        <Col lg={4} className="mb-4">
          <Card className="glass-effect">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Activity Overview
              </h5>
            </Card.Header>
            
            <Card.Body>
              <Bar data={chartData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Global Stats */}
      <Row>
        <Col>
          <Card className="glass-effect">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-globe me-2"></i>
                Global Statistics
              </h5>
            </Card.Header>
            
            <Card.Body>
              <Row>
                <Col md={3} className="text-center mb-3">
                  <h4 className="text-primary">{stats.totalAsteroids || 0}</h4>
                  <p className="text-muted mb-0">Total Asteroids</p>
                </Col>
                
                <Col md={3} className="text-center mb-3">
                  <h4 className="text-warning">{stats.hazardousAsteroids || 0}</h4>
                  <p className="text-muted mb-0">Potentially Hazardous</p>
                </Col>
                
                <Col md={3} className="text-center mb-3">
                  <h4 className="text-success">{stats.totalSimulations || 0}</h4>
                  <p className="text-muted mb-0">Global Simulations</p>
                </Col>
                
                <Col md={3} className="text-center mb-3">
                  <h4 className="text-info">{stats.publicSimulations || 0}</h4>
                  <p className="text-muted mb-0">Shared Simulations</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
