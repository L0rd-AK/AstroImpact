import React from 'react';
import { Navbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Navbar expand="lg" variant="dark" fixed="top" className="navbar-custom">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <i className="bi bi-rocket-takeoff me-2"></i>
            AstroImpact
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/asteroids">
              <Nav.Link>
                <i className="bi bi-search me-1"></i>
                Explore Asteroids
              </Nav.Link>
            </LinkContainer>
            
            {/* Temporarily disabled simulator link */}
            {/*
            {isAuthenticated && (
              <LinkContainer to="/simulator">
                <Nav.Link>
                  <i className="bi bi-geo-alt me-1"></i>
                  Simulator
                </Nav.Link>
              </LinkContainer>
            )}
            */}
            
            <LinkContainer to="/community">
              <Nav.Link>
                <i className="bi bi-people me-1"></i>
                Community
              </Nav.Link>
            </LinkContainer>
            
            <LinkContainer to="/leaderboard">
              <Nav.Link>
                <i className="bi bi-trophy me-1"></i>
                Leaderboard
              </Nav.Link>
            </LinkContainer>
            
            <LinkContainer to="/orbits">
              <Nav.Link>
                <i className="bi bi-globe me-1"></i>
                Orbits
                <Badge bg="info" className="ms-1">3D</Badge>
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/3d-test">
              <Nav.Link>
                <i className="bi bi-cpu me-1"></i>
                3D Test
                <Badge bg="success" className="ms-1">NEW</Badge>
              </Nav.Link>
            </LinkContainer>
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link>
                    <i className="bi bi-speedometer2 me-1"></i>
                    Dashboard
                  </Nav.Link>
                </LinkContainer>
                
                <Dropdown align="end">
                  <Dropdown.Toggle as={Nav.Link} className="d-flex align-items-center">
                    <i className="bi bi-person-circle me-2"></i>
                    {user?.username}
                    {user?.stats?.points > 0 && (
                      <Badge bg="primary" className="ms-2">
                        {user.stats.points}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  
                  <Dropdown.Menu className="dropdown-menu-dark">
                    <LinkContainer to="/profile">
                      <Dropdown.Item>
                        <i className="bi bi-person me-2"></i>
                        Profile
                      </Dropdown.Item>
                    </LinkContainer>
                    
                    <Dropdown.Divider />
                    
                    <Dropdown.Item onClick={logout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Login
                  </Nav.Link>
                </LinkContainer>
                
                <LinkContainer to="/register">
                  <Nav.Link>
                    <i className="bi bi-person-plus me-1"></i>
                    Register
                  </Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
