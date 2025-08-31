import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import axios from 'axios';

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
      const response = await axios.get(`/api/users/leaderboard?timeframe=${timeframe}&limit=50`);
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
        return <i className="bi bi-award-fill text-secondary me-2"></i>;
      case 3:
        return <i className="bi bi-award-fill text-warning me-2"></i>;
      default:
        return <span className="me-4">{rank}</span>;
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
    <Container className="py-5" style={{ marginTop: '100px' }}>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1>
                <i className="bi bi-trophy me-2"></i>
                Leaderboard
              </h1>
              <p className="text-muted">Top contributors to the AstroImpact community</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Timeframe Filter */}
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <Card className="glass-effect">
            <Card.Body>
              <Form.Label>Timeframe</Form.Label>
              <Form.Select
                className='text-white bg-dark'
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
            <Card className="glass-effect">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-award me-2"></i>
                  Top Contributors
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="text-center">
                  {/* 2nd Place */}
                  <Col md={4} className="mb-3">
                    <div className="h-100 d-flex flex-column justify-content-end">
                      <div className="bg-secondary p-3 rounded">
                        <i className="bi bi-person-circle display-4 text-light"></i>
                        <h5 className="mt-2">{leaderboard[1]?.username}</h5>
                        <Badge bg="light" text="dark">2nd Place</Badge>
                        <div className="mt-2">
                          <strong>{leaderboard[1]?.stats?.points || 0}</strong> points
                        </div>
                      </div>
                    </div>
                  </Col>
                  
                  {/* 1st Place */}
                  <Col md={4} className="mb-3">
                    <div className="h-100 d-flex flex-column justify-content-end">
                      <div className="bg-warning p-4 rounded text-dark">
                        <i className="bi bi-trophy-fill display-3"></i>
                        <i className="bi bi-person-circle display-4"></i>
                        <h4 className="mt-2 fw-bold">{leaderboard[0]?.username}</h4>
                        <Badge bg="dark">1st Place</Badge>
                        <div className="mt-2">
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
                        <h5 className="mt-2">{leaderboard[2]?.username}</h5>
                        <Badge bg="warning" text="dark">3rd Place</Badge>
                        <div className="mt-2">
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
          <Card className="glass-effect">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-list-ol me-2"></i>
                Full Rankings
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="loading-spinner"></div>
                  <p className="mt-3">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <Table responsive variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th>Points</th>
                      <th>Simulations</th>
                      <th>Mitigations</th>
                      <th>Votes Received</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user, index) => (
                      <tr key={user._id} className={index < 3 ? 'table-warning' : ''}>
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
                              <strong>{user.username}</strong>
                              {user.profile?.firstName && (
                                <div className="text-muted small">
                                  {user.profile.firstName} {user.profile.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="text-primary">
                            {user.stats?.points || 0}
                          </strong>
                        </td>
                        <td>{user.stats?.simulationsRun || 0}</td>
                        <td>{user.stats?.mitigationsProposed || 0}</td>
                        <td>{user.stats?.votesReceived || 0}</td>
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
                  <h4 className="mt-3">No rankings available</h4>
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
  );
};

export default Leaderboard;
