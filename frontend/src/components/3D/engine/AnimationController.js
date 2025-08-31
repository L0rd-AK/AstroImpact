import * as THREE from 'three';
import { 
  PlasmaTrailSystem, 
  ImpactExplosionSystem, 
  DebrisCloudSystem, 
  DustPlumeSystem, 
  ShockwaveSystem 
} from '../effects/ParticleSystems';
import { EventDispatcher } from 'three';

/**
 * Advanced Animation Controller for Asteroid Impact Simulations
 * Manages complex multi-phase animations with physics-based timing
 */
export class ImpactAnimationController extends EventDispatcher {
  constructor(scene, asteroid, earth, impactData) {
    super();
    
    this.scene = scene;
    this.asteroid = asteroid;
    this.earth = earth;
    this.impactData = impactData;
    
    // Animation phases with scientific timing
    this.phases = [
      {
        name: 'approach',
        duration: 8000, // 8 seconds
        description: 'Asteroid approaching Earth from deep space'
      },
      {
        name: 'atmospheric_entry',
        duration: 3000, // 3 seconds
        description: 'Atmospheric entry with plasma trail formation'
      },
      {
        name: 'impact',
        duration: 2000, // 2 seconds
        description: 'Ground impact and initial explosion'
      },
      {
        name: 'crater_formation',
        duration: 4000, // 4 seconds
        description: 'Crater formation and material excavation'
      },
      {
        name: 'aftermath',
        duration: 6000, // 6 seconds
        description: 'Shockwave propagation and debris settling'
      }
    ];
    
    this.currentPhase = 0;
    this.phaseStartTime = 0;
    this.totalElapsedTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.speed = 1.0;
    
    // Animation mixer for keyframe animations
    this.mixer = new THREE.AnimationMixer(scene);
    this.clock = new THREE.Clock();
    
    // Animation clips storage
    this.clips = new Map();
    this.activeActions = new Map();
    
    // Physics simulation parameters
    this.physics = {
      gravity: 9.81, // m/s²
      atmosphereHeight: 100000, // 100km in meters
      earthRadius: 6371000, // Earth radius in meters
      asteroidVelocity: 20000, // 20 km/s in m/s
      impactAngle: Math.PI / 4 // 45 degrees
    };
    
    // Camera animation system
    this.cameraController = new CameraAnimationController();
    this.originalCameraPosition = new THREE.Vector3();
    this.originalCameraTarget = new THREE.Vector3();
    
    // Event callbacks
    this.callbacks = new Map();
    
    this.initialize();
  }
  
  initialize() {
    // Create animation clips for each phase
    this.createPhaseAnimations();
    
    // Setup physics calculations
    this.calculateTrajectory();
    
    // Initialize particle systems
    this.initializeParticleSystems();
    
    console.log('ImpactAnimationController initialized with', this.phases.length, 'phases');
  }
  
  createPhaseAnimations() {
    this.phases.forEach((phase, index) => {
      const clip = this.createPhaseClip(phase, index);
      if (clip) {
        this.clips.set(phase.name, clip);
      }
    });
  }
  
  createPhaseClip(phase, phaseIndex) {
    const tracks = [];
    const duration = phase.duration / 1000; // Convert to seconds
    
    switch (phase.name) {
      case 'approach':
        tracks.push(...this.createApproachTracks(duration));
        break;
      case 'atmospheric_entry':
        tracks.push(...this.createAtmosphericEntryTracks(duration));
        break;
      case 'impact':
        tracks.push(...this.createImpactTracks(duration));
        break;
      case 'crater_formation':
        tracks.push(...this.createCraterFormationTracks(duration));
        break;
      case 'aftermath':
        tracks.push(...this.createAftermathTracks(duration));
        break;
      default:
        console.warn('Unknown animation phase:', phase.name);
        break;
    }
    
    if (tracks.length > 0) {
      return new THREE.AnimationClip(phase.name, duration, tracks);
    }
    
    return null;
  }
  
  createApproachTracks(duration) {
    const tracks = [];
    
    if (this.asteroid) {
      // Asteroid position animation from deep space to atmosphere
      const startPos = this.calculateStartPosition();
      const endPos = this.calculateAtmosphereEntry();
      
      const times = [0, duration];
      const positions = [
        startPos.x, startPos.y, startPos.z,
        endPos.x, endPos.y, endPos.z
      ];
      
      tracks.push(new THREE.VectorKeyframeTrack(
        this.asteroid.name + '.position',
        times,
        positions
      ));
      
      // Asteroid rotation for tumbling effect
      const rotations = [0, 0, 0, 1, Math.PI * 4, Math.PI * 6, Math.PI * 2, 1];
      tracks.push(new THREE.QuaternionKeyframeTrack(
        this.asteroid.name + '.quaternion',
        times,
        rotations
      ));
    }
    
    return tracks;
  }
  
  createAtmosphericEntryTracks(duration) {
    const tracks = [];
    
    if (this.asteroid) {
      // Rapid position change during atmospheric entry
      const startPos = this.calculateAtmosphereEntry();
      const impactPos = this.calculateImpactPosition();
      
      const times = [0, duration * 0.7, duration];
      const positions = [
        startPos.x, startPos.y, startPos.z,
        // Deceleration point
        startPos.x + (impactPos.x - startPos.x) * 0.8,
        startPos.y + (impactPos.y - startPos.y) * 0.8,
        startPos.z + (impactPos.z - startPos.z) * 0.8,
        // Final impact position
        impactPos.x, impactPos.y, impactPos.z
      ];
      
      tracks.push(new THREE.VectorKeyframeTrack(
        this.asteroid.name + '.position',
        times,
        positions
      ));
      
      // Scale reduction due to ablation
      const scales = [1, 1, 1, 0.8, 0.8, 0.8, 0.6, 0.6, 0.6];
      tracks.push(new THREE.VectorKeyframeTrack(
        this.asteroid.name + '.scale',
        times,
        scales
      ));
    }
    
    return tracks;
  }
  
  createImpactTracks(duration) {
    const tracks = [];
    
    // Impact flash and explosion scaling
    const times = [0, duration * 0.2, duration * 0.5, duration];
    const scales = [0, 0, 0, 2, 2, 2, 5, 5, 5, 3, 3, 3];
    
    tracks.push(new THREE.VectorKeyframeTrack(
      'impact_flash.scale',
      times,
      scales
    ));
    
    return tracks;
  }
  
  createCraterFormationTracks(duration) {
    const tracks = [];
    
    // Crater growth animation
    const times = [0, duration * 0.3, duration * 0.8, duration];
    const scales = [0, 0, 0, 0.5, 0.5, 0.5, 1, 1, 1, 1, 1, 1];
    
    tracks.push(new THREE.VectorKeyframeTrack(
      'crater.scale',
      times,
      scales
    ));
    
    return tracks;
  }
  
  createAftermathTracks(duration) {
    const tracks = [];
    
    // Debris settling and dust cloud dissipation
    const times = [0, duration * 0.5, duration];
    const opacities = [1, 0.5, 0];
    
    tracks.push(new THREE.NumberKeyframeTrack(
      'debris_cloud.material.opacity',
      times,
      opacities
    ));
    
    return tracks;
  }
  
  calculateStartPosition() {
    // Position asteroid at 10 Earth radii distance
    const distance = 10;
    const angle = this.physics.impactAngle;
    
    return new THREE.Vector3(
      distance * Math.cos(angle),
      distance * Math.sin(angle),
      distance * 0.5
    );
  }
  
  calculateAtmosphereEntry() {
    // Position at atmospheric boundary (100km altitude)
    const atmosphereRadius = 1 + (this.physics.atmosphereHeight / this.physics.earthRadius);
    const angle = this.physics.impactAngle;
    
    return new THREE.Vector3(
      atmosphereRadius * Math.cos(angle),
      atmosphereRadius * Math.sin(angle),
      0
    );
  }
  
  calculateImpactPosition() {
    // Surface impact position
    return new THREE.Vector3(0, 1, 0); // Normalized Earth surface
  }
  
  calculateTrajectory() {
    // Calculate realistic trajectory based on orbital mechanics
    const points = [];
    const segments = 100;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const position = this.interpolateTrajectory(t);
      points.push(position);
    }
    
    this.trajectoryPoints = points;
    return points;
  }
  
  interpolateTrajectory(t) {
    // Use physics-based trajectory calculation
    const start = this.calculateStartPosition();
    const end = this.calculateImpactPosition();
    
    // Apply gravitational acceleration
    const gravity = new THREE.Vector3(0, -1, 0);
    const time = t * this.getTotalDuration() / 1000;
    
    // Kinematic equation: s = ut + 0.5at²
    const position = start.clone().lerp(end, t);
    const gravityEffect = gravity.clone().multiplyScalar(0.5 * time * time);
    
    return position.add(gravityEffect);
  }
  
  initializeParticleSystems() {
    // Initialize particle systems for each phase
    this.particleSystems = {
      plasma_trail: new PlasmaTrailSystem(),
      impact_explosion: new ImpactExplosionSystem(),
      debris_cloud: new DebrisCloudSystem(),
      dust_plume: new DustPlumeSystem(),
      shockwave: new ShockwaveSystem()
    };
  }
  
  play(fromPhase = 0) {
    if (this.isPlaying && !this.isPaused) return;
    
    this.currentPhase = fromPhase;
    this.phaseStartTime = this.clock.getElapsedTime();
    this.isPlaying = true;
    this.isPaused = false;
    
    this.playCurrentPhase();
    this.dispatchEvent({ type: 'play', phase: this.getCurrentPhaseName() });
    
    console.log('Animation started from phase:', this.getCurrentPhaseName());
  }
  
  pause() {
    if (!this.isPlaying || this.isPaused) return;
    
    this.isPaused = true;
    this.mixer.timeScale = 0;
    this.dispatchEvent({ type: 'pause', phase: this.getCurrentPhaseName() });
    
    console.log('Animation paused at phase:', this.getCurrentPhaseName());
  }
  
  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    
    this.isPaused = false;
    this.mixer.timeScale = this.speed;
    this.dispatchEvent({ type: 'resume', phase: this.getCurrentPhaseName() });
    
    console.log('Animation resumed at phase:', this.getCurrentPhaseName());
  }
  
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPhase = 0;
    this.mixer.stopAllAction();
    this.dispatchEvent({ type: 'stop' });
    
    console.log('Animation stopped');
  }
  
  reset() {
    this.stop();
    this.currentPhase = 0;
    this.phaseStartTime = 0;
    this.totalElapsedTime = 0;
    this.mixer.setTime(0);
    this.dispatchEvent({ type: 'reset' });
    
    console.log('Animation reset');
  }
  
  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(5.0, speed));
    if (!this.isPaused) {
      this.mixer.timeScale = this.speed;
    }
    this.dispatchEvent({ type: 'speedChange', speed: this.speed });
  }
  
  playCurrentPhase() {
    const phase = this.phases[this.currentPhase];
    if (!phase) return;
    
    const clip = this.clips.get(phase.name);
    if (clip) {
      const action = this.mixer.clipAction(clip);
      action.reset().play();
      this.activeActions.set(phase.name, action);
    }
    
    // Trigger phase-specific effects
    this.triggerPhaseEffects(phase.name);
    
    this.dispatchEvent({ 
      type: 'phaseStart', 
      phase: phase.name, 
      index: this.currentPhase 
    });
  }
  
  triggerPhaseEffects(phaseName) {
    const system = this.particleSystems[phaseName];
    if (system && system.start) {
      system.start();
    }
    
    // Camera movements for each phase
    this.cameraController.playPhaseMovement(phaseName);
  }
  
  update(deltaTime) {
    if (!this.isPlaying || this.isPaused) return;
    
    // Update animation mixer
    this.mixer.update(deltaTime * this.speed);
    
    // Update total elapsed time
    this.totalElapsedTime += deltaTime * this.speed * 1000;
    
    // Check phase transitions
    const currentPhase = this.phases[this.currentPhase];
    const phaseElapsedTime = this.totalElapsedTime - this.phaseStartTime * 1000;
    
    if (phaseElapsedTime >= currentPhase.duration) {
      this.nextPhase();
    }
    
    // Update particle systems
    Object.values(this.particleSystems).forEach(system => {
      if (system.update) {
        system.update(deltaTime);
      }
    });
    
    // Update camera animations
    this.cameraController.update(deltaTime);
    
    this.dispatchEvent({ 
      type: 'update', 
      phase: this.getCurrentPhaseName(),
      progress: this.getPhaseProgress(),
      totalProgress: this.getTotalProgress()
    });
  }
  
  nextPhase() {
    // End current phase
    this.dispatchEvent({ 
      type: 'phaseEnd', 
      phase: this.getCurrentPhaseName(),
      index: this.currentPhase 
    });
    
    this.currentPhase++;
    
    if (this.currentPhase >= this.phases.length) {
      // Animation complete
      this.complete();
      return;
    }
    
    // Start next phase
    this.phaseStartTime = this.clock.getElapsedTime();
    this.playCurrentPhase();
  }
  
  complete() {
    this.isPlaying = false;
    this.dispatchEvent({ type: 'complete' });
    console.log('Animation sequence completed');
  }
  
  // Getters
  getCurrentPhaseName() {
    return this.phases[this.currentPhase]?.name || 'unknown';
  }
  
  getCurrentPhaseDescription() {
    return this.phases[this.currentPhase]?.description || '';
  }
  
  getPhaseProgress() {
    if (!this.isPlaying) return 0;
    
    const currentPhase = this.phases[this.currentPhase];
    const phaseElapsedTime = this.totalElapsedTime - this.phaseStartTime * 1000;
    
    return Math.min(1, phaseElapsedTime / currentPhase.duration);
  }
  
  getTotalProgress() {
    const completedDuration = this.phases
      .slice(0, this.currentPhase)
      .reduce((sum, phase) => sum + phase.duration, 0);
    
    const currentPhaseDuration = this.phases[this.currentPhase]?.duration || 0;
    const currentPhaseProgress = this.getPhaseProgress() * currentPhaseDuration;
    
    return (completedDuration + currentPhaseProgress) / this.getTotalDuration();
  }
  
  getTotalDuration() {
    return this.phases.reduce((sum, phase) => sum + phase.duration, 0);
  }
  
  // Event handling
  addEventListener(type, callback) {
    super.addEventListener(type, callback);
    this.callbacks.set(type, callback);
  }
  
  removeEventListener(type, callback) {
    super.removeEventListener(type, callback);
    this.callbacks.delete(type);
  }
  
  // Public API for external control
  jumpToPhase(phaseIndex) {
    if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
      this.currentPhase = phaseIndex;
      this.phaseStartTime = this.clock.getElapsedTime();
      this.playCurrentPhase();
    }
  }
  
  getPhaseNames() {
    return this.phases.map(phase => phase.name);
  }
  
  getPhaseInfo(index) {
    return this.phases[index] || null;
  }
  
  // Cleanup
  dispose() {
    this.stop();
    this.mixer.uncacheRoot(this.scene);
    
    Object.values(this.particleSystems).forEach(system => {
      if (system.dispose) {
        system.dispose();
      }
    });
    
    this.callbacks.clear();
    
    console.log('ImpactAnimationController disposed');
  }
}

/**
 * Camera Animation Controller for cinematic shots
 */
class CameraAnimationController {
  constructor() {
    this.camera = null;
    this.controls = null;
    this.shots = new Map();
    this.currentShot = null;
    this.isAnimating = false;
    
    this.setupCinematicShots();
  }
  
  setupCinematicShots() {
    this.shots.set('approach', {
      position: new THREE.Vector3(8, 4, 6),
      target: new THREE.Vector3(0, 0, 0),
      duration: 3000,
      easing: 'easeInOut'
    });
    
    this.shots.set('atmospheric_entry', {
      position: new THREE.Vector3(3, 2, 3),
      target: new THREE.Vector3(0, 1, 0),
      duration: 2000,
      easing: 'easeOut'
    });
    
    this.shots.set('impact', {
      position: new THREE.Vector3(1, 0.5, 1),
      target: new THREE.Vector3(0, 0, 0),
      duration: 1000,
      easing: 'easeIn'
    });
    
    this.shots.set('crater_formation', {
      position: new THREE.Vector3(2, 3, 2),
      target: new THREE.Vector3(0, 0, 0),
      duration: 2000,
      easing: 'easeInOut'
    });
    
    this.shots.set('aftermath', {
      position: new THREE.Vector3(5, 8, 5),
      target: new THREE.Vector3(0, 0, 0),
      duration: 3000,
      easing: 'easeOut'
    });
  }
  
  setCamera(camera, controls) {
    this.camera = camera;
    this.controls = controls;
  }
  
  playPhaseMovement(phaseName) {
    const shot = this.shots.get(phaseName);
    if (!shot || !this.camera) return;
    
    this.currentShot = {
      ...shot,
      startPosition: this.camera.position.clone(),
      startTarget: this.controls ? this.controls.target.clone() : new THREE.Vector3(),
      startTime: Date.now()
    };
    
    this.isAnimating = true;
  }
  
  update(deltaTime) {
    if (!this.isAnimating || !this.currentShot || !this.camera) return;
    
    const elapsed = Date.now() - this.currentShot.startTime;
    const progress = Math.min(1, elapsed / this.currentShot.duration);
    
    // Apply easing
    const easedProgress = this.applyEasing(progress, this.currentShot.easing);
    
    // Interpolate camera position
    this.camera.position.lerpVectors(
      this.currentShot.startPosition,
      this.currentShot.position,
      easedProgress
    );
    
    // Interpolate camera target
    if (this.controls) {
      this.controls.target.lerpVectors(
        this.currentShot.startTarget,
        this.currentShot.target,
        easedProgress
      );
      this.controls.update();
    }
    
    if (progress >= 1) {
      this.isAnimating = false;
      this.currentShot = null;
    }
  }
  
  applyEasing(t, easingType) {
    switch (easingType) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - Math.pow(1 - t, 2);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }
}

export { CameraAnimationController };
