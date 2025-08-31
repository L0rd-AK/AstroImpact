import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="glass-effect">
            <Card.Header className="text-center">
              <h3 className="mb-0">
                <i className="bi bi-rocket-takeoff me-2"></i>
                Welcome Back
              </h3>
              <p className="text-muted mt-2">Sign in to continue your asteroid research</p>
            </Card.Header>
            
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-envelope me-2"></i>
                    Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    <i className="bi bi-lock me-2"></i>
                    Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
            
            <Card.Footer className="text-center">
              <p className="mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="text-decoration-none">
                  <strong>Sign up now</strong>
                </Link>
              </p>
            </Card.Footer>
          </Card>
          
          {/* Demo Credentials */}
          <Card className="glass-effect mt-3">
            <Card.Body className="text-center">
              <h6 className="text-muted mb-2">
                <i className="bi bi-info-circle me-2"></i>
                Demo Credentials
              </h6>
              <p className="mb-1"><strong>Email:</strong> demo@astroimpact.com</p>
              <p className="mb-0"><strong>Password:</strong> demo123</p>
              <small className="text-muted">Use these credentials to test the application</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
