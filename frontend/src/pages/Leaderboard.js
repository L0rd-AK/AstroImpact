import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import api from '../utils/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/leaderboard?timeframe=${timeframe}&limit=50`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <i className="bi bi-trophy-fill text-warning me-2"></i>;
      case 2:
        return <i className="bi bi-award-fill text-light me-2"></i>;
      case 3:
        return <i className="bi bi-award-fill text-warning me-2"></i>;
      default:
        return <span className="me-4 text-white">{rank}</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const variant = rank === 1 ? 'warning' : rank === 2 ? 'light' : 'dark';
      return (
        <Badge bg={variant} text={rank === 2 ? 'dark' : 'light'}>
          #{rank}
        </Badge>
      );
    }
    return <Badge bg="secondary">#{rank}</Badge>;
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <Container className="py-5" style={{ marginTop: '100px' }}>
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="text-white">
                  <i className="bi bi-trophy me-2 text-warning"></i>
                  Leaderboard
                </h1>
                <p className="text-light">Top contributors to the AstroImpact community</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Timeframe Filter */}
        <Row className="mb-4">
          <Col md={6} lg={4}>
            <Card bg="dark" border="secondary">
              <Card.Body>
                <Form.Label className="text-white">Timeframe</Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </Form.Select>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top 3 */}
        {leaderboard.length >= 3 && (
          <Row className="mb-4">
            <Col>
              <Card bg="dark" border="secondary">
                <Card.Header className="bg-dark border-secondary">
                  <h5 className="mb-0 text-white">
                    <i className="bi bi-award me-2 text-warning"></i>
                    Top Contributors
                  </h5>
                </Card.Header>
                <Card.Body className="bg-dark">
                  <Row className="text-center">
                    {/* 2nd Place */}
                    <Col md={4} className="mb-3">
                      <div className="h-100 d-flex flex-column justify-content-end">
                        <div className="bg-secondary p-3 rounded border border-light">
                          <i className="bi bi-person-circle display-4 text-light"></i>
                          <h5 className="mt-2 text-light">{leaderboard[1]?.username}</h5>
                          <Badge bg="light" text="dark">2nd Place</Badge>
                          <div className="mt-2 text-light">
                            <strong>{leaderboard[1]?.stats?.points || 0}</strong> points
                          </div>
                        </div>
                      </div>
                    </Col>
                    
                    {/* 1st Place */}
                    <Col md={4} className="mb-3">
                      <div className="h-100 d-flex flex-column justify-content-end">
                        <div className="bg-warning p-4 rounded border border-warning">
                          <i className="bi bi-trophy-fill display-3 text-dark"></i>
                          <i className="bi bi-person-circle display-4 text-dark"></i>
                          <h4 className="mt-2 fw-bold text-dark">{leaderboard[0]?.username}</h4>
                          <Badge bg="dark" text="light">1st Place</Badge>
                          <div className="mt-2 text-dark">
                            <strong>{leaderboard[0]?.stats?.points || 0}</strong> points
                          </div>
                        </div>
                      </div>
                    </Col>
                    
                    {/* 3rd Place */}
                    <Col md={4} className="mb-3">
                      <div className="h-100 d-flex flex-column justify-content-end">
                        <div className="bg-dark p-3 rounded border border-warning">
                          <i className="bi bi-person-circle display-4 text-warning"></i>
                          <h5 className="mt-2 text-light">{leaderboard[2]?.username}</h5>
                          <Badge bg="warning" text="dark">3rd Place</Badge>
                          <div className="mt-2 text-light">
                            <strong>{leaderboard[2]?.stats?.points || 0}</strong> points
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Full Leaderboard */}
        <Row>
          <Col>
            <Card bg="dark" border="secondary">
              <Card.Header className="bg-dark border-secondary">
                <h5 className="mb-0 text-white">
                  <i className="bi bi-list-ol me-2 text-warning"></i>
                  Full Rankings
                </h5>
              </Card.Header>
              <Card.Body className="p-0 bg-dark">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-white">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <Table responsive variant="dark" className="mb-0">
                    <thead>
                      <tr>
                        <th className="text-white">Rank</th>
                        <th className="text-white">User</th>
                        <th className="text-white">Points</th>
                        <th className="text-white">Simulations</th>
                        <th className="text-white">Mitigations</th>
                        <th className="text-white">Votes Received</th>
                        <th className="text-white">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((user, index) => (
                        <tr key={user._id} className="bg-dark">
                          <td>
                            <div className="d-flex align-items-center">
                              {getRankIcon(index + 1)}
                              {getRankBadge(index + 1)}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-person-circle me-2 text-primary"></i>
                              <div>
                                <strong className="text-white">{user.username}</strong>
                                {user.profile?.firstName && (
                                  <div className="small text-muted">
                                    {user.profile.firstName} {user.profile.lastName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong className="text-warning">
                              {user.stats?.points || 0}
                            </strong>
                          </td>
                          <td className="text-white">{user.stats?.simulationsRun || 0}</td>
                          <td className="text-white">{user.stats?.mitigationsProposed || 0}</td>
                          <td className="text-white">{user.stats?.votesReceived || 0}</td>
                          <td className="text-muted">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-trophy display-1 text-muted"></i>
                    <h4 className="mt-3 text-white">No rankings available</h4>
                    <p className="text-muted">
                      Start running simulations to appear on the leaderboard!
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Leaderboard;
