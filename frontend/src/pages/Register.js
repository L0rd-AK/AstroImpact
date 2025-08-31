import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile: {
      firstName: '',
      lastName: '',
      country: '',
      city: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          [profileField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear errors when user starts typing
    setError('');
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      
      if (result.success) {
        navigate('/dashboard');
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
        <Col md={8} lg={6}>
          <Card className="glass-effect">
            <Card.Header className="text-center">
              <h3 className="mb-0">
                <i className="bi bi-person-plus me-2"></i>
                Join AstroImpact
              </h3>
              <p className="text-muted mt-2">Create your account to start simulating asteroid impacts</p>
            </Card.Header>
            
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-person me-2"></i>
                        Username *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        isInvalid={!!validationErrors.username}
                        required
                        autoFocus
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.username}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-envelope me-2"></i>
                        Email Address *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        isInvalid={!!validationErrors.email}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-lock me-2"></i>
                        Password *
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        isInvalid={!!validationErrors.password}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="bi bi-lock-fill me-2"></i>
                        Confirm Password *
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        isInvalid={!!validationErrors.confirmPassword}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />
                
                <h6 className="text-muted mb-3">Profile Information (Optional)</h6>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="profile.firstName"
                        value={formData.profile.firstName}
                        onChange={handleChange}
                        placeholder="Your first name"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="profile.lastName"
                        value={formData.profile.lastName}
                        onChange={handleChange}
                        placeholder="Your last name"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        name="profile.country"
                        value={formData.profile.country}
                        onChange={handleChange}
                        placeholder="Your country"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="profile.city"
                        value={formData.profile.city}
                        onChange={handleChange}
                        placeholder="Your city"
                      />
                    </Form.Group>
                  </Col>
                </Row>

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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-check me-2"></i>
                      Create Account
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
            
            <Card.Footer className="text-center">
              <p className="mb-0">
                Already have an account?{' '}
                <Link to="/login" className="text-decoration-none">
                  <strong>Sign in here</strong>
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
