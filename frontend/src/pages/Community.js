import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { useSimulation } from '../context/SimulationContext';
import { LinkContainer } from 'react-router-bootstrap';

const Community = () => {
  const { fetchPublicSimulations, loading } = useSimulation();
  const [simulations, setSimulations] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: 'votes.likes',
    featured: false
  });

  useEffect(() => {
    loadSimulations();
  }, [filters]);

  const loadSimulations = async () => {
    try {
      const data = await fetchPublicSimulations(filters);
      setSimulations(data.simulations || []);
    } catch (error) {
      console.error('Failed to load community simulations:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>
                <i className="bi bi-people me-2"></i>
                Community Simulations
              </h1>
              <p className="text-muted">Explore and vote on simulations shared by the community</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card className="glass-effect">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    className='text-white bg-dark'
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  >
                    <option value="votes.likes">Most Liked</option>
                    <option value="createdAt">Most Recent</option>
                    <option value="results.craterDiameter">Largest Impact</option>
                    <option value="results.populationEffects.estimatedCasualties">Most Casualties</option>
                  </Form.Select>
                </Col>
                <Col md={6} className="d-flex align-items-end">
                  <Form.Check
                    type="checkbox"
                    label="Featured Only"
                    checked={filters.featured}
                    onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Simulations Grid */}
      <Row>
        {loading ? (
          <Col className="text-center py-5">
            <div className="loading-spinner"></div>
            <p className="mt-3">Loading community simulations...</p>
          </Col>
        ) : simulations.length > 0 ? (
          simulations.map((simulation) => (
            <Col lg={6} key={simulation._id} className="mb-4">
              <Card className="glass-effect h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0 text-truncate" title={simulation.asteroid?.name}>
                      {simulation.asteroid?.name}
                    </h6>
                    <small className="text-muted">
                      by {simulation.user?.username} • {formatDate(simulation.createdAt)}
                    </small>
                  </div>
                  {simulation.isFeatured && (
                    <Badge bg="warning" text="dark">
                      <i className="bi bi-star-fill me-1"></i>
                      Featured
                    </Badge>
                  )}
                </Card.Header>

                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between text-sm">
                      <span>Impact Location:</span>
                      <strong>
                        {simulation.impactLocation?.city || 'Unknown'}, {simulation.impactLocation?.country || 'Unknown'}
                      </strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between text-sm">
                      <span>Crater Diameter:</span>
                      <strong>
                        {simulation.results?.craterDiameter 
                          ? `${(simulation.results.craterDiameter / 1000).toFixed(2)} km`
                          : 'Unknown'
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between text-sm">
                      <span>Estimated Casualties:</span>
                      <strong className="text-danger">
                        {simulation.results?.populationEffects?.estimatedCasualties 
                          ? simulation.results.populationEffects.estimatedCasualties.toLocaleString()
                          : 'Unknown'
                        }
                      </strong>
                    </div>
                  </div>

                  {simulation.mitigationStrategy?.method !== 'none' && (
                    <div className="mb-3">
                      <Badge bg="info">
                        <i className="bi bi-shield-check me-1"></i>
                        {simulation.mitigationStrategy.method.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </Card.Body>

                <Card.Footer>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <span>
                        <i className="bi bi-heart text-success me-1"></i>
                        {simulation.votes?.likes || 0}
                      </span>
                      <span>
                        <i className="bi bi-chat text-info me-1"></i>
                        {simulation.comments?.length || 0}
                      </span>
                    </div>
                    <LinkContainer to={`/simulation/${simulation._id}`}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </LinkContainer>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))
        ) : (
          <Col className="text-center py-5">
            <i className="bi bi-people display-1 text-muted"></i>
            <h4 className="mt-3">No simulations found</h4>
            <p className="text-muted">
              Be the first to share a simulation with the community!
            </p>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Community;
