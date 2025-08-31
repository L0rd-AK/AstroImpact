import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <h1>
            <i className="bi bi-person-circle me-2"></i>
            User Profile
          </h1>
          <p className="text-muted mb-4">
            Manage your account and view your achievements
          </p>
        </Col>
      </Row>

      <Row>
        <Col md={4} className="mb-4">
          <Card className="glass-effect">
            <Card.Body className="text-center">
              <i className="bi bi-person-circle display-1 text-primary mb-3"></i>
              <h4>{user?.username}</h4>
              <p className="text-muted">{user?.email}</p>
              {user?.profile?.firstName && (
                <p className="mb-0">
                  {user.profile.firstName} {user.profile.lastName}
                </p>
              )}
              {user?.profile?.city && (
                <p className="text-muted">
                  {user.profile.city}, {user.profile.country}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="glass-effect">
            <Card.Body className="text-center py-5">
              <i className="bi bi-gear display-1 text-muted mb-3"></i>
              <h3>Profile Management Under Development</h3>
              <p className="text-muted">
                The complete profile interface will include:
              </p>
              <ul className="list-unstyled text-start mt-4">
                <li><i className="bi bi-check-circle text-success me-2"></i>Profile information editing</li>
                <li><i className="bi bi-check-circle text-success me-2"></i>Password change functionality</li>
                <li><i className="bi bi-check-circle text-success me-2"></i>Achievement badges and statistics</li>
                <li><i className="bi bi-check-circle text-success me-2"></i>Simulation history and analytics</li>
                <li><i className="bi bi-check-circle text-success me-2"></i>Account preferences and settings</li>
              </ul>
              <Alert variant="info" className="mt-4">
                <i className="bi bi-info-circle me-2"></i>
                Your current stats: {user?.stats?.points || 0} points, {user?.stats?.simulationsRun || 0} simulations run
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
