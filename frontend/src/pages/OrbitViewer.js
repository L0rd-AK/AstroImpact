import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import OrbitView from '../components/3D/OrbitView';
import api from '../utils/api';

const OrbitViewer = () => {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAsteroids = async () => {
    try {
      setLoading(true);
      setError('');
      // Pull a reasonable number to keep render light
      const { data } = await api.get('/api/asteroids?limit=99&sortBy=close_approach_data.0.epoch_date_close_approach&sortOrder=asc');
      setAsteroids(data.asteroids || []);
    } catch (e) {
      console.error('Failed to load asteroids', e);
      setError(e?.response?.data?.error || 'Failed to load asteroids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAsteroids();
  }, []);

  return (
    <div className="py-4">
      <Container>
        <Row className="mb-3 align-items-center">
          <Col>
            <h2 className="mb-0">Earth Orbit Viewer</h2>
            <small className="text-muted">Animated orbits derived from close approach data</small>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={loadAsteroids} disabled={loading}>
              {loading ? (
                <><Spinner size="sm" className="me-2" />Refreshing...</>
              ) : (
                <>Refresh</>
              )}
            </Button>
          </Col>
        </Row>

        <Card className="mb-3">
          <Card.Body>
            {error && (
              <div className="alert alert-warning py-2 mb-3">{error}</div>
            )}
            <OrbitView asteroids={asteroids} />
          </Card.Body>
        </Card>

        <div className="text-muted" style={{ fontSize: 12 }}>
          Note: Orbits are simplified for visualization and do not represent exact trajectories.
        </div>
      </Container>
    </div>
  );
};

export default OrbitViewer;


