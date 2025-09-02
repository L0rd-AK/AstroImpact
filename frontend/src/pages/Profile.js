import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Alert, Form, Button, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useSimulation } from '../context/SimulationContext';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { fetchUserSimulations } = useSimulation();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    city: user?.profile?.city || '',
    country: user?.profile?.country || ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [simRows, setSimRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchUserSimulations({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      setSimRows(data.simulations || []);
    };
    load();
  }, [fetchUserSimulations]);

  useEffect(() => {
    setProfileForm({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      city: user?.profile?.city || '',
      country: user?.profile?.country || ''
    });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ profile: { ...profileForm } });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setChangingPassword(false);
    }
  };

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
          <Row className="g-3">
            <Col md={12}>
              <Card className="glass-effect">
                <Card.Header>
                  <h5 className="mb-0"><i className="bi bi-pencil-square me-2"></i>Edit Profile</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleProfileSave}>
                    <Row className="g-2">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Country</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            value={profileForm.country}
                            onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="mt-3 d-flex justify-content-end">
                      <Button type="submit" variant="primary" disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col md={12}>
              <Card className="glass-effect">
                <Card.Header>
                  <h5 className="mb-0"><i className="bi bi-shield-lock me-2"></i>Change Password</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handlePasswordChange}>
                    <Row className="g-2">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Current Password</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Confirm Password</Form.Label>
                          <Form.Control
                            className="text-white bg-dark"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="mt-3 d-flex justify-content-end">
                      <Button type="submit" variant="warning" disabled={changingPassword || passwordForm.newPassword !== passwordForm.confirmPassword}>
                        {changingPassword ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col md={12}>
              <Card className="glass-effect">
                <Card.Header>
                  <h5 className="mb-0"><i className="bi bi-clock-history me-2"></i>Recent Simulations</h5>
                </Card.Header>
                <Card.Body>
                  {simRows.length === 0 ? (
                    <div className="text-muted">No simulations yet.</div>
                  ) : (
                    <Table responsive size="sm" className="mb-0 text-white">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Asteroid</th>
                          <th>Energy</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simRows.map((s) => (
                          <tr key={s._id}>
                            <td>{new Date(s.createdAt).toLocaleString()}</td>
                            <td>{s.asteroid?.name || s.asteroidData?.name || s.asteroidId || 'N/A'}</td>
                            <td>{s.results?.energy ? s.results.energy.toExponential(2) + ' J' : 'N/A'}</td>
                            <td>
                              <Badge bg={s.results?.severity === 'catastrophic' ? 'danger' : s.results?.severity === 'severe' ? 'warning' : s.results?.severity === 'moderate' ? 'info' : 'success'}>
                                {s.results?.severity ? String(s.results.severity).toUpperCase() : 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
