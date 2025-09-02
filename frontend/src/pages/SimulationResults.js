import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Alert, Badge, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { SafeEnhancedImpact3D } from '../components/3D';

const formatNumber = (num) => {
  if (num == null || isNaN(num)) return 'N/A';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Number(num).toFixed(0);
};

const SimulationResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSimulationById, loading } = useSimulation();
  const [sim, setSim] = useState(null);
  const [error, setError] = useState('');
  const [animate3D, setAnimate3D] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSimulationById(id);
        setSim(data);
      } catch (e) {
        setError('Failed to load simulation.');
      }
    };
    if (id) load();
  }, [id, getSimulationById]);

  const impact = sim?.results || sim?.impact || {};
  const asteroid = sim?.asteroid || sim?.asteroidData || {};
  const impactLocation = sim?.impactLocation || sim?.location || null;

  const summary = useMemo(() => ({
    energyJ: impact.energy,
    tntTons: impact.tntEquivalent,
    craterDiameterKm: impact.craterDiameter,
    craterDepthKm: impact.craterDepth,
    affectedAreaKm2: impact.affectedArea,
    estimatedCasualties: impact.estimatedCasualties,
    economicImpactUSD: impact.economicImpact,
    severity: impact.severity
  }), [impact]);

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className="mb-1">
                <i className="bi bi-graph-up me-2"></i>
                Simulation Results
              </h1>
              <div className="text-muted">
                {sim?._id && <small>ID: {sim._id}</small>}
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-1"></i>Back
              </Button>
              <Button variant="primary" onClick={() => setAnimate3D(true)} disabled={!impactLocation}>
                <i className="bi bi-play-fill me-1"></i>Replay Impact
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" className="mb-0">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Overview cards */}
      <Row className="g-3 mb-3">
        <Col md={3}>
          <Card className="bg-dark border-secondary h-100">
            <Card.Body>
              <div className="text-muted">Impact Energy</div>
              <div className="fs-4">{formatNumber(summary.energyJ)} J</div>
              <small className="text-muted">TNT: {formatNumber(summary.tntTons)} tons</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-dark border-secondary h-100">
            <Card.Body>
              <div className="text-muted">Crater Diameter</div>
              <div className="fs-4">{summary.craterDiameterKm?.toFixed ? summary.craterDiameterKm.toFixed(1) : 'N/A'} km</div>
              <small className="text-muted">Depth: {summary.craterDepthKm?.toFixed ? summary.craterDepthKm.toFixed(1) : 'N/A'} km</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-dark border-secondary h-100">
            <Card.Body>
              <div className="text-muted">Affected Area</div>
              <div className="fs-4">{formatNumber(summary.affectedAreaKm2)} km²</div>
              <small className="text-muted">Casualties: {formatNumber(summary.estimatedCasualties)}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-dark border-secondary h-100">
            <Card.Body>
              <div className="text-muted">Severity</div>
              <div className="fs-5">
                <Badge bg={summary.severity === 'catastrophic' ? 'danger' : summary.severity === 'severe' ? 'warning' : summary.severity === 'moderate' ? 'info' : 'success'}>
                  {summary.severity ? String(summary.severity).toUpperCase() : 'N/A'}
                </Badge>
              </div>
              <small className="text-muted">Economic: ${formatNumber(summary.economicImpactUSD)}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Asteroid info */}
      <Row className="mb-3">
        <Col md={4}>
          <Card className="bg-dark border-secondary h-100">
            <Card.Header>
              <h6 className="mb-0"><i className="bi bi-asterisk me-2"></i>Asteroid</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-1"><strong>Name:</strong> {asteroid.name || 'N/A'}</div>
              <div className="mb-1"><strong>ID:</strong> {asteroid.neo_reference_id || asteroid._id || 'N/A'}</div>
              <div className="mb-1"><strong>Diameter:</strong> {(asteroid?.estimatedDiameter?.kilometers?.estimated_diameter_max)?.toFixed ? asteroid.estimatedDiameter.kilometers.estimated_diameter_max.toFixed(2) : 'N/A'} km</div>
              <div className="mb-1"><strong>Hazard:</strong> {asteroid.isPotentiallyHazardousAsteroid ? 'Hazardous' : 'Not Hazardous'}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="glass-effect">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><i className="bi bi-exclamation-triangle me-2"></i>Impact Visualization</h6>
              <div>
                <Button size="sm" variant={animate3D ? 'danger' : 'outline-primary'} onClick={() => setAnimate3D(!animate3D)} disabled={!impactLocation}>
                  <i className={`bi bi-${animate3D ? 'stop' : 'play'}-circle me-1`}></i>
                  {animate3D ? 'Stop' : 'Play'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0" style={{ height: 400, background: '#000' }}>
              <SafeEnhancedImpact3D
                simulationData={{
                  impactData: impact,
                  asteroidData: asteroid,
                  impactLocation,
                  impactAngle: sim?.impactAngle || 45,
                  impactVelocity: sim?.impactVelocity || 20,
                  animate: animate3D
                }}
                onAnimationComplete={() => setAnimate3D(false)}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {!sim && !loading && !error && (
        <Row>
          <Col>
            <Alert variant="info">No simulation data found.</Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default SimulationResults;
