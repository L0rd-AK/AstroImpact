import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import Community from './pages/Community';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AsteroidExplorer from './pages/AsteroidExplorer';
import SimulationResults from './pages/SimulationResults';
import Enhanced3DTest from './pages/Enhanced3DTest';
import OrbitViewer from './pages/OrbitViewer';
import ProtectedRoute from './components/ProtectedRoute';

import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navigation />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/asteroids" element={<AsteroidExplorer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/simulation/:id" element={<SimulationResults />} />
          {/* Temporarily disabled 3D routes */}
          <Route path="/3d-test" element={<Enhanced3DTest />} />
          <Route path="/orbits" element={<OrbitViewer />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/simulator" 
            element={
              <ProtectedRoute>
                <Simulator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <Container className="py-5 text-center">
                <h1>404 - Page Not Found</h1>
                <p className="text-muted">The page you're looking for doesn't exist.</p>
              </Container>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
