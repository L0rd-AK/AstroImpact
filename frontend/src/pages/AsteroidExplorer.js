import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';

const AsteroidExplorer = () => {
  const { fetchAsteroids, searchAsteroids, loading } = useSimulation();
  const navigate = useNavigate();
  const [asteroids, setAsteroids] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    hazardous: '',
    minSize: '',
    maxSize: '',
    sortBy: 'calculatedProperties.averageDiameter',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    loadAsteroids();
  }, [filters, pagination.currentPage]);

  const loadAsteroids = async () => {
    try {
      const params = {
        page: pagination.currentPage,
        limit: 20,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const data = await fetchAsteroids(params);
      setAsteroids(data.asteroids || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Failed to load asteroids:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const results = await searchAsteroids(searchQuery.trim(), 20);
        setAsteroids(results);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: results.length });
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      loadAsteroids();
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const formatDiameter = (asteroid) => {
    const diameter = asteroid.calculatedProperties?.averageDiameter;
    if (!diameter) return 'Unknown';
    
    if (diameter >= 1000) {
      return `${(diameter / 1000).toFixed(2)} km`;
    } else {
      return `${diameter.toFixed(0)} m`;
    }
  };

  const formatVelocity = (asteroid) => {
    const velocity = asteroid.calculatedProperties?.averageVelocity;
    return velocity ? `${velocity.toFixed(2)} km/s` : 'Unknown';
  };

  const formatEnergy = (asteroid) => {
    const energy = asteroid.calculatedProperties?.kineticEnergy;
    if (!energy) return 'Unknown';
    
    if (energy >= 1e15) {
      return `${(energy / 1e15).toExponential(2)} PJ`;
    } else if (energy >= 1e12) {
      return `${(energy / 1e12).toFixed(2)} TJ`;
    } else {
      return `${(energy / 1e9).toFixed(2)} GJ`;
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>
                <i className="bi bi-search me-2"></i>
                Asteroid Explorer
              </h1>
              <p className="text-muted">Browse NASA's near-Earth asteroid database</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col>
          <Card className="glass-effect">
            <Card.Body>
              {/* Search Bar */}
              <Form onSubmit={handleSearch} className="mb-3">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search asteroids by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" variant="primary" disabled={loading}>
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Form>

              {/* Filters */}
              <Row>
                <Col md={6} lg={3} className="mb-3">
                  <Form.Label>Hazard Level</Form.Label>
                  <Form.Select
                    className='text-white bg-dark'
                    value={filters.hazardous}
                    onChange={(e) => handleFilterChange('hazardous', e.target.value)}
                  >
                    <option value="">All Asteroids</option>
                    <option value="true">Potentially Hazardous</option>
                    <option value="false">Non-Hazardous</option>
                  </Form.Select>
                </Col>

                <Col md={6} lg={3} className="mb-3">
                  <Form.Label>Min Size (meters)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Min diameter"
                    value={filters.minSize}
                    onChange={(e) => handleFilterChange('minSize', e.target.value)}
                  />
                </Col>

                <Col md={6} lg={3} className="mb-3">
                  <Form.Label>Max Size (meters)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Max diameter"
                    value={filters.maxSize}
                    onChange={(e) => handleFilterChange('maxSize', e.target.value)}
                  />
                </Col>

                <Col md={6} lg={3} className="mb-3">
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    className='text-white bg-dark'
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange('sortBy', sortBy);
                      handleFilterChange('sortOrder', sortOrder);
                    }}
                  >
                    <option value="calculatedProperties.averageDiameter-desc">Size (Largest First)</option>
                    <option value="calculatedProperties.averageDiameter-asc">Size (Smallest First)</option>
                    <option value="calculatedProperties.kineticEnergy-desc">Energy (Highest First)</option>
                    <option value="calculatedProperties.averageVelocity-desc">Velocity (Fastest First)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="lastUpdated-desc">Recently Updated</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results */}
      <Row>
        <Col>
          <Card className="glass-effect">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list me-2"></i>
                Asteroids ({pagination.totalItems || 0})
              </h5>
              {loading && <div className="loading-spinner"></div>}
            </Card.Header>

            <Card.Body className="p-0">
              {asteroids.length > 0 ? (
                <Table responsive variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Diameter</th>
                      <th>Velocity</th>
                      <th>Kinetic Energy</th>
                      <th>Hazard Level</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asteroids.map((asteroid) => (
                      <tr key={asteroid._id}>
                        <td>
                          <div>
                            <strong className="text-truncate d-block" style={{ maxWidth: '200px' }}>
                              {asteroid.name}
                            </strong>
                            <small className="text-muted">
                              ID: {asteroid.neo_reference_id}
                            </small>
                          </div>
                        </td>
                        <td>
                          <strong>{formatDiameter(asteroid)}</strong>
                        </td>
                        <td>
                          {formatVelocity(asteroid)}
                        </td>
                        <td>
                          {formatEnergy(asteroid)}
                        </td>
                        <td>
                          {asteroid.is_potentially_hazardous_asteroid ? (
                            <Badge bg="warning" text="dark">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Hazardous
                            </Badge>
                          ) : (
                            <Badge bg="success">
                              <i className="bi bi-check-circle me-1"></i>
                              Safe
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => window.open(asteroid.nasa_jpl_url, '_blank')}
                              disabled={!asteroid.nasa_jpl_url}
                            >
                              <i className="bi bi-info-circle"></i>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate('/simulator', { 
                                state: { asteroidId: asteroid._id }
                              })}
                            >
                              <i className="bi bi-play-circle"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-search display-1 text-muted"></i>
                  <h4 className="mt-3">No asteroids found</h4>
                  <p className="text-muted">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              )}
            </Card.Body>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Card.Footer>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={pagination.currentPage >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AsteroidExplorer;
