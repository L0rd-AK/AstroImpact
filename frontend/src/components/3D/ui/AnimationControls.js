import React, { useState, useEffect, useCallback } from 'react';
import { Button, ButtonGroup, Card, Row, Col, ProgressBar, Alert, Tooltip, OverlayTrigger } from 'react-bootstrap';
import './AnimationControls.css';

/**
 * Advanced Animation Control Interface
 * Provides comprehensive control over asteroid impact animations
 */
const AnimationControls = ({ 
  animationController, 
  onAnimationStateChange,
  disabled = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [phases, setPhases] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [qualityLevel, setQualityLevel] = useState('high');

  // Initialize animation controller events
  useEffect(() => {
    if (!animationController) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsPaused(false);
      if (onAnimationStateChange) onAnimationStateChange('playing');
    };

    const handlePause = () => {
      setIsPaused(true);
      if (onAnimationStateChange) onAnimationStateChange('paused');
    };

    const handleStop = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPhase(0);
      setPhaseProgress(0);
      setTotalProgress(0);
      if (onAnimationStateChange) onAnimationStateChange('stopped');
    };

    const handlePhaseStart = (event) => {
      setCurrentPhase(event.index);
    };

    const handleUpdate = (event) => {
      setPhaseProgress(event.progress);
      setTotalProgress(event.totalProgress);
    };

    const handleComplete = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (onAnimationStateChange) onAnimationStateChange('completed');
    };

    // Register event listeners
    animationController.addEventListener('play', handlePlay);
    animationController.addEventListener('pause', handlePause);
    animationController.addEventListener('stop', handleStop);
    animationController.addEventListener('phaseStart', handlePhaseStart);
    animationController.addEventListener('update', handleUpdate);
    animationController.addEventListener('complete', handleComplete);

    // Get phases info
    const phaseNames = animationController.getPhaseNames();
    const phaseData = phaseNames.map((name, index) => 
      animationController.getPhaseInfo(index)
    );
    setPhases(phaseData);

    return () => {
      // Cleanup listeners
      animationController.removeEventListener('play', handlePlay);
      animationController.removeEventListener('pause', handlePause);
      animationController.removeEventListener('stop', handleStop);
      animationController.removeEventListener('phaseStart', handlePhaseStart);
      animationController.removeEventListener('update', handleUpdate);
      animationController.removeEventListener('complete', handleComplete);
    };
  }, [animationController, onAnimationStateChange]);

  // Performance monitoring
  useEffect(() => {
    const updatePerformance = () => {
      if (window.performanceManager) {
        const stats = window.performanceManager.getStats();
        setPerformanceStats(stats);
        setQualityLevel(stats.lod.quality);
      }
    };

    const interval = setInterval(updatePerformance, 1000);
    updatePerformance(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Control functions
  const handlePlay = useCallback(() => {
    if (!animationController || disabled) return;
    
    if (isPaused) {
      animationController.resume();
    } else {
      animationController.play();
    }
  }, [animationController, isPaused, disabled]);

  const handlePause = useCallback(() => {
    if (!animationController || disabled) return;
    animationController.pause();
  }, [animationController, disabled]);

  const handleStop = useCallback(() => {
    if (!animationController || disabled) return;
    animationController.stop();
  }, [animationController, disabled]);

  const handleReset = useCallback(() => {
    if (!animationController || disabled) return;
    animationController.reset();
  }, [animationController, disabled]);

  const handleSpeedChange = useCallback((newSpeed) => {
    if (!animationController || disabled) return;
    setAnimationSpeed(newSpeed);
    animationController.setSpeed(newSpeed);
  }, [animationController, disabled]);

  const handlePhaseJump = useCallback((phaseIndex) => {
    if (!animationController || disabled) return;
    animationController.jumpToPhase(phaseIndex);
  }, [animationController, disabled]);

  const formatTime = (progress, totalDuration) => {
    const currentTime = progress * totalDuration / 1000;
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalDuration = animationController?.getTotalDuration() || 0;

  return (
    <Card className="animation-controls-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <i className="bi bi-play-circle me-2"></i>
          Animation Controls
        </h6>
        <div className="performance-indicator">
          <span className={`badge bg-${getPerformanceBadgeColor(qualityLevel)}`}>
            {qualityLevel.toUpperCase()}
          </span>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Main Controls */}
        <Row className="mb-3">
          <Col>
            <ButtonGroup className="w-100" size="sm">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Play/Resume Animation</Tooltip>}
              >
                <Button
                  variant={isPlaying && !isPaused ? "success" : "outline-success"}
                  onClick={handlePlay}
                  disabled={disabled || (isPlaying && !isPaused)}
                >
                  <i className={`bi bi-${isPaused ? 'play' : 'play-fill'}`}></i>
                  {isPaused ? ' Resume' : ' Play'}
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Pause Animation</Tooltip>}
              >
                <Button
                  variant="outline-warning"
                  onClick={handlePause}
                  disabled={disabled || !isPlaying || isPaused}
                >
                  <i className="bi bi-pause-fill"></i>
                  Pause
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Stop Animation</Tooltip>}
              >
                <Button
                  variant="outline-danger"
                  onClick={handleStop}
                  disabled={disabled || !isPlaying}
                >
                  <i className="bi bi-stop-fill"></i>
                  Stop
                </Button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Reset to Beginning</Tooltip>}
              >
                <Button
                  variant="outline-secondary"
                  onClick={handleReset}
                  disabled={disabled}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  Reset
                </Button>
              </OverlayTrigger>
            </ButtonGroup>
          </Col>
        </Row>

        {/* Progress Display */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">Overall Progress</small>
              <small className="text-muted">
                {formatTime(totalProgress, totalDuration)} / {formatTime(1, totalDuration)}
              </small>
            </div>
            <ProgressBar 
              now={totalProgress * 100} 
              variant="primary"
              style={{ height: '8px' }}
              className="mb-2"
            />
            
            {phases[currentPhase] && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">
                    Phase: {phases[currentPhase].name.replace('_', ' ').toUpperCase()}
                  </small>
                  <small className="text-muted">
                    {Math.round(phaseProgress * 100)}%
                  </small>
                </div>
                <ProgressBar 
                  now={phaseProgress * 100} 
                  variant="info"
                  style={{ height: '6px' }}
                />
                <small className="text-muted d-block mt-1">
                  {phases[currentPhase].description}
                </small>
              </>
            )}
          </Col>
        </Row>

        {/* Speed Controls */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">Animation Speed</small>
              <span className="badge bg-secondary">{animationSpeed}x</span>
            </div>
            <ButtonGroup size="sm" className="w-100">
              {[0.25, 0.5, 1.0, 1.5, 2.0].map(speed => (
                <Button
                  key={speed}
                  variant={animationSpeed === speed ? "primary" : "outline-primary"}
                  onClick={() => handleSpeedChange(speed)}
                  disabled={disabled}
                  style={{ fontSize: '0.8rem' }}
                >
                  {speed}x
                </Button>
              ))}
            </ButtonGroup>
          </Col>
        </Row>

        {/* Phase Navigation */}
        <Row className="mb-3">
          <Col>
            <small className="text-muted d-block mb-2">Jump to Phase</small>
            <div className="phase-buttons">
              {phases.map((phase, index) => (
                <OverlayTrigger
                  key={index}
                  placement="top"
                  overlay={<Tooltip>{phase.description}</Tooltip>}
                >
                  <Button
                    size="sm"
                    variant={currentPhase === index ? "primary" : "outline-primary"}
                    onClick={() => handlePhaseJump(index)}
                    disabled={disabled}
                    className="me-1 mb-1"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {index + 1}. {phase.name.split('_')[0]}
                  </Button>
                </OverlayTrigger>
              ))}
            </div>
          </Col>
        </Row>

        {/* Performance Stats */}
        {performanceStats && (
          <Row>
            <Col>
              <Card size="sm" className="bg-light">
                <Card.Body className="p-2">
                  <Row className="text-center">
                    <Col xs={3}>
                      <div className="performance-stat">
                        <div className="stat-value">
                          {Math.round(performanceStats.performance.averageFPS)}
                        </div>
                        <div className="stat-label">FPS</div>
                      </div>
                    </Col>
                    <Col xs={3}>
                      <div className="performance-stat">
                        <div className="stat-value">
                          {performanceStats.lod.objectCount}
                        </div>
                        <div className="stat-label">Objects</div>
                      </div>
                    </Col>
                    <Col xs={3}>
                      <div className="performance-stat">
                        <div className="stat-value">
                          {performanceStats.frustumCulling.visibleObjects}
                        </div>
                        <div className="stat-label">Visible</div>
                      </div>
                    </Col>
                    <Col xs={3}>
                      <div className="performance-stat">
                        <div className="stat-value">
                          {Math.round(performanceStats.memory.totalMemoryMB)}MB
                        </div>
                        <div className="stat-label">Memory</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Status Alert */}
        {disabled && (
          <Alert variant="warning" className="mt-3 mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Animation controls are disabled. Ensure simulation is loaded and 3D view is active.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

// Helper function to get performance badge color
const getPerformanceBadgeColor = (level) => {
  switch (level) {
    case 'high': return 'success';
    case 'medium': return 'warning';
    case 'low': return 'danger';
    default: return 'secondary';
  }
};

/**
 * Cinematic Camera Controls
 * Provides preset camera angles and smooth transitions
 */
const CinematicControls = ({ cameraController, disabled = false }) => {
  const [currentShot, setCurrentShot] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const cinematicShots = [
    { name: 'Wide View', id: 'wide', icon: 'globe', description: 'Full Earth view showing impact scale' },
    { name: 'Approach', id: 'approach', icon: 'arrow-down-right', description: 'Asteroid approaching Earth' },
    { name: 'Entry', id: 'atmospheric_entry', icon: 'fire', description: 'Atmospheric entry sequence' },
    { name: 'Impact', id: 'impact', icon: 'bullseye', description: 'Ground impact close-up' },
    { name: 'Crater', id: 'crater_formation', icon: 'circle', description: 'Crater formation overview' },
    { name: 'Aftermath', id: 'aftermath', icon: 'clouds', description: 'Post-impact wide view' }
  ];

  const handleShotChange = useCallback((shotId) => {
    if (!cameraController || disabled || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentShot(shotId);
    
    cameraController.playPhaseMovement(shotId);
    
    // Reset transition state after movement duration
    setTimeout(() => {
      setIsTransitioning(false);
    }, 3000);
  }, [cameraController, disabled, isTransitioning]);

  return (
    <Card className="cinematic-controls-card">
      <Card.Header>
        <h6 className="mb-0">
          <i className="bi bi-camera-video me-2"></i>
          Cinematic Views
        </h6>
      </Card.Header>
      
      <Card.Body>
        <Row>
          {cinematicShots.map((shot, index) => (
            <Col xs={6} md={4} key={shot.id} className="mb-2">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{shot.description}</Tooltip>}
              >
                <Button
                  size="sm"
                  variant={currentShot === shot.id ? "primary" : "outline-primary"}
                  onClick={() => handleShotChange(shot.id)}
                  disabled={disabled || isTransitioning}
                  className="w-100"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className={`bi bi-${shot.icon} me-1`}></i>
                  {shot.name}
                </Button>
              </OverlayTrigger>
            </Col>
          ))}
        </Row>
        
        {isTransitioning && (
          <Alert variant="info" className="mt-2 mb-0">
            <i className="bi bi-camera me-2"></i>
            Camera transitioning to new view...
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

/**
 * Settings Panel for 3D Animation
 */
const AnimationSettings = ({ onSettingsChange, disabled = false }) => {
  const [settings, setSettings] = useState({
    enableParticles: true,
    enableLighting: true,
    enableShadows: true,
    particleCount: 'medium',
    qualityLevel: 'auto',
    enablePhysics: true,
    showTrajectory: true,
    showStatistics: true
  });

  const handleSettingChange = useCallback((key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (onSettingsChange) onSettingsChange(newSettings);
  }, [settings, onSettingsChange]);

  return (
    <Card className="animation-settings-card">
      <Card.Header>
        <h6 className="mb-0">
          <i className="bi bi-gear me-2"></i>
          Animation Settings
        </h6>
      </Card.Header>
      
      <Card.Body>
        <Row>
          <Col xs={12} md={6}>
            <div className="mb-3">
              <label className="form-label small">Quality Level</label>
              <select
                className="form-select form-select-sm"
                value={settings.qualityLevel}
                onChange={(e) => handleSettingChange('qualityLevel', e.target.value)}
                disabled={disabled}
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </Col>
          
          <Col xs={12} md={6}>
            <div className="mb-3">
              <label className="form-label small">Particle Count</label>
              <select
                className="form-select form-select-sm"
                value={settings.particleCount}
                onChange={(e) => handleSettingChange('particleCount', e.target.value)}
                disabled={disabled}
              >
                <option value="low">Low (Performance)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Quality)</option>
                <option value="ultra">Ultra (Powerful GPU)</option>
              </select>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col>
            {[
              { key: 'enableParticles', label: 'Particle Effects', icon: 'stars' },
              { key: 'enableLighting', label: 'Dynamic Lighting', icon: 'sun' },
              { key: 'enableShadows', label: 'Shadows', icon: 'moon' },
              { key: 'enablePhysics', label: 'Physics Simulation', icon: 'globe' },
              { key: 'showTrajectory', label: 'Asteroid Trajectory', icon: 'arrow-down' },
              { key: 'showStatistics', label: 'Performance Stats', icon: 'graph-up' }
            ].map((setting) => (
              <div key={setting.key} className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={setting.key}
                  checked={settings[setting.key]}
                  onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                  disabled={disabled}
                />
                <label className="form-check-label small" htmlFor={setting.key}>
                  <i className={`bi bi-${setting.icon} me-2`}></i>
                  {setting.label}
                </label>
              </div>
            ))}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export { AnimationControls, CinematicControls, AnimationSettings };
export default AnimationControls;
