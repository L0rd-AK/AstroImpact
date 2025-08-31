import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Import our enhanced systems
import { ImpactAnimationController, CameraAnimationController } from './engine/AnimationController';
import { 
  PlasmaTrailSystem, 
  ImpactExplosionSystem, 
  DebrisCloudSystem, 
  DustPlumeSystem, 
  ShockwaveSystem 
} from './effects/ParticleSystems';
import { EarthMaterial, AsteroidMaterial } from './materials/AdvancedMaterials';
import { PerformanceManager } from './engine/PerformanceOptimizer';
import { AnimationControls, CinematicControls, AnimationSettings } from './ui/AnimationControls';

/**
 * Enhanced Earth Component with Realistic Materials and Effects
 */
const EnhancedEarth = React.memo(({ 
  impactLocation, 
  showImpact = false, 
  animationController,
  materialSettings = {}
}) => {
  const earthRef = useRef();
  const atmosphereRef = useRef();
  const cloudsRef = useRef();
  const impactMarkerRef = useRef();
  
  // Enhanced Earth material
  const earthMaterial = useMemo(() => {
    return new EarthMaterial({
      radius: 2,
      atmosphereThickness: 0.05,
      ...materialSettings
    });
  }, [materialSettings]);
  
  // Convert lat/lng to 3D coordinates
  const latLngTo3D = useCallback((lat, lng, radius = 2) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, []);
  
  const impactPosition = useMemo(() => {
    return impactLocation ? latLngTo3D(impactLocation.lat, impactLocation.lng) : new THREE.Vector3();
  }, [impactLocation, latLngTo3D]);
  
  // Animation frame updates
  useFrame((state) => {
    // Update Earth material
    earthMaterial.update(state.clock.elapsedTime);
    
    // Rotate Earth slowly
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
    
    // Rotate clouds slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0015;
    }
    
    // Pulse impact marker
    if (impactMarkerRef.current && showImpact) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 1;
      impactMarkerRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <group>
      {/* Main Earth Body */}
      <mesh ref={earthRef} receiveShadow castShadow>
        <sphereGeometry args={[2, 128, 64]} />
        <primitive object={earthMaterial.surfaceMaterial} />
      </mesh>
      
      {/* Earth Atmosphere */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[2.05, 64, 32]} />
        <primitive object={earthMaterial.atmosphereMaterial} />
      </mesh>
      
      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.02, 64, 32]} />
        <primitive object={earthMaterial.cloudsMaterial} />
      </mesh>
      
      {/* Impact Location Marker */}
      {showImpact && impactLocation && (
        <group position={impactPosition}>
          <mesh ref={impactMarkerRef}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial
              color="#ff4444"
              emissive="#ff2222"
              emissiveIntensity={1}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Impact Crater (if impact has occurred) */}
          {animationController?.getCurrentPhaseName() === 'crater_formation' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.05, 0.02, 32]} />
              <meshStandardMaterial
                color="#444444"
                roughness={0.9}
              />
            </mesh>
          )}
          
          {/* Shockwave Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 32]} />
            <meshStandardMaterial
              color="#ff6666"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
});

/**
 * Enhanced Asteroid Component with Advanced Materials
 */
const EnhancedAsteroid = React.memo(({ 
  asteroidData, 
  position = [8, 4, 6], 
  isAnimating = false,
  animationController 
}) => {
  const asteroidRef = useRef();
  const trailRef = useRef();
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isVisible, setIsVisible] = useState(true);
  
  // Enhanced asteroid material
  const asteroidMaterial = useMemo(() => {
    const type = asteroidData?.type || 'rocky';
    const size = asteroidData?.diameter || 1000;
    
    return new AsteroidMaterial({
      type: type,
      size: size / 1000,
      weathering: 0.3
    });
  }, [asteroidData]);
  
  // Create irregular asteroid geometry
  const asteroidGeometry = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const vertices = geometry.attributes.position.array;
    
    // Add noise for irregular shape
    for (let i = 0; i < vertices.length; i += 3) {
      const vertex = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
      const noise = 0.8 + Math.random() * 0.4;
      vertex.multiplyScalar(noise);
      vertices[i] = vertex.x;
      vertices[i + 1] = vertex.y;
      vertices[i + 2] = vertex.z;
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  
  const asteroidSize = useMemo(() => {
    return asteroidData?.diameter ? 
      Math.max(0.05, Math.min(0.3, asteroidData.diameter / 10000)) : 0.1;
  }, [asteroidData]);
  
  useFrame((state, deltaTime) => {
    if (!asteroidRef.current) return;
    
    // Update material
    asteroidMaterial.update(state.clock.elapsedTime);
    
    // Animation logic
    if (isAnimating && animationController) {
      const phase = animationController.getCurrentPhaseName();
      
      switch (phase) {
        case 'approach': {
          // Move from deep space toward Earth
          const progress = animationController.getPhaseProgress();
          const startPos = new THREE.Vector3(8, 4, 6);
          const endPos = new THREE.Vector3(3, 2, 3);
          const newPos = startPos.clone().lerp(endPos, progress);
          setCurrentPosition([newPos.x, newPos.y, newPos.z]);
          asteroidRef.current.position.copy(newPos);
          break;
        }
        case 'atmospheric_entry': {
          // Rapid descent with heating effects
          const progress = animationController.getPhaseProgress();
          const startPos = new THREE.Vector3(3, 2, 3);
          const endPos = new THREE.Vector3(0, 0.5, 0);
          const newPos = startPos.clone().lerp(endPos, progress);
          setCurrentPosition([newPos.x, newPos.y, newPos.z]);
          asteroidRef.current.position.copy(newPos);
          
          // Scale reduction due to ablation
          const scale = 1 - progress * 0.3;
          asteroidRef.current.scale.setScalar(scale);
          break;
        }
        case 'impact': {
          // Hide asteroid after impact
          setIsVisible(false);
          break;
        }
        default:
          break;
      }
    }
    
    // Continuous rotation
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.02;
      asteroidRef.current.rotation.z += 0.005;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <group position={currentPosition}>
      <mesh 
        ref={asteroidRef}
        geometry={asteroidGeometry}
        scale={asteroidSize}
        castShadow
        receiveShadow
      >
        <primitive object={asteroidMaterial.material} />
      </mesh>
      
      {/* Plasma Trail for Atmospheric Entry */}
      {isAnimating && animationController?.getCurrentPhaseName() === 'atmospheric_entry' && (
        <mesh ref={trailRef}>
          <cylinderGeometry args={[0.002, 0.01, 2, 8]} />
          <meshStandardMaterial
            color="#ffaa00"
            transparent
            opacity={0.6}
            emissive="#ff6600"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
});

/**
 * Enhanced Particle Effects System
 */
const ParticleEffects = React.memo(({ 
  animationController, 
  impactData,
  enabled = true 
}) => {
  const particleSystemsRef = useRef({});
  const [activeEffects, setActiveEffects] = useState([]);
  
  // Initialize particle systems
  useEffect(() => {
    if (!enabled) return;
    
    particleSystemsRef.current = {
      plasmaTrail: new PlasmaTrailSystem({ maxParticles: 500 }),
      impactExplosion: new ImpactExplosionSystem({ maxParticles: 2000 }),
      debrisCloud: new DebrisCloudSystem({ maxParticles: 1500 }),
      dustPlume: new DustPlumeSystem({ maxParticles: 3000 }),
      shockwave: new ShockwaveSystem({ maxParticles: 100 })
    };
    
    return () => {
      Object.values(particleSystemsRef.current).forEach(system => {
        if (system.dispose) system.dispose();
      });
    };
  }, [enabled]);
  
  // Listen to animation events
  useEffect(() => {
    if (!animationController || !enabled) return;
    
    const handlePhaseStart = (event) => {
      const { phase } = event;
      const systems = particleSystemsRef.current;
      
      switch (phase) {
        case 'atmospheric_entry':
          if (systems.plasmaTrail) {
            systems.plasmaTrail.start();
            setActiveEffects(prev => [...prev, 'plasmaTrail']);
          }
          break;
        case 'impact':
          if (systems.impactExplosion && impactData) {
            systems.impactExplosion.explode(
              new THREE.Vector3(0, 0, 0), 
              impactData.kineticEnergy || 1e15
            );
            setActiveEffects(prev => [...prev, 'impactExplosion']);
          }
          break;
        case 'crater_formation':
          if (systems.debrisCloud) {
            systems.debrisCloud.start();
            setActiveEffects(prev => [...prev, 'debrisCloud']);
          }
          if (systems.shockwave && impactData) {
            systems.shockwave.createShockwave(
              new THREE.Vector3(0, 0, 0),
              impactData.kineticEnergy || 1e15
            );
            setActiveEffects(prev => [...prev, 'shockwave']);
          }
          break;
        case 'aftermath':
          if (systems.dustPlume) {
            systems.dustPlume.start();
            setActiveEffects(prev => [...prev, 'dustPlume']);
          }
          break;
        default:
          break;
      }
    };
    
    animationController.addEventListener('phaseStart', handlePhaseStart);
    
    return () => {
      animationController.removeEventListener('phaseStart', handlePhaseStart);
    };
  }, [animationController, impactData, enabled]);
  
  useFrame((state, deltaTime) => {
    if (!enabled) return;
    
    // Update all active particle systems
    Object.values(particleSystemsRef.current).forEach(system => {
      if (system.update) {
        system.update(deltaTime);
      }
    });
  });
  
  return (
    <group>
      {activeEffects.map(effectName => {
        const system = particleSystemsRef.current[effectName];
        return system?.mesh ? (
          <primitive key={effectName} object={system.mesh} />
        ) : null;
      })}
    </group>
  );
});

/**
 * Enhanced Impact Scene with Complete Animation System
 */
const EnhancedImpactScene = ({ 
  impactData,
  asteroidData,
  impactLocation,
  animateImpact = false,
  onAnimationComplete,
  settings = {}
}) => {
  const sceneRef = useRef();
  const animationControllerRef = useRef();
  const cameraControllerRef = useRef();
  const performanceManagerRef = useRef();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showControls] = useState(true);
  
  // Initialize animation systems
  const { camera, gl, scene } = useThree();
  
  useEffect(() => {
    if (!scene || !camera || !gl) return;
    
    // Initialize performance manager
    performanceManagerRef.current = new PerformanceManager(gl, camera, scene);
    window.performanceManager = performanceManagerRef.current;
    
    // Initialize animation controller
    animationControllerRef.current = new ImpactAnimationController(
      scene,
      null, // Will be set when asteroid is created
      null, // Will be set when earth is created
      impactData
    );
    
    // Initialize camera controller
    cameraControllerRef.current = new CameraAnimationController();
    cameraControllerRef.current.setCamera(camera, null); // OrbitControls will be set later
    
    return () => {
      if (animationControllerRef.current) {
        animationControllerRef.current.dispose();
      }
      if (performanceManagerRef.current) {
        performanceManagerRef.current.dispose();
      }
    };
  }, [scene, camera, gl, impactData]);
  
  // Handle animation trigger
  useEffect(() => {
    if (animateImpact && animationControllerRef.current && !isAnimating) {
      setIsAnimating(true);
      animationControllerRef.current.play();
    }
  }, [animateImpact, isAnimating]);
  
  // Animation frame updates
  useFrame((state, deltaTime) => {
    if (animationControllerRef.current) {
      animationControllerRef.current.update(deltaTime);
    }
    if (cameraControllerRef.current) {
      cameraControllerRef.current.update(deltaTime);
    }
    if (performanceManagerRef.current) {
      performanceManagerRef.current.update();
    }
  });
  
  const handleAnimationStateChange = useCallback((state) => {
    if (state === 'completed' && onAnimationComplete) {
      onAnimationComplete();
      setIsAnimating(false);
    }
  }, [onAnimationComplete]);
  
  const handleSettingsChange = useCallback((newSettings) => {
    // Apply settings to various systems
    console.log('Applying settings:', newSettings);
  }, []);
  
  return (
    <>
      {/* 3D Scene */}
      <group ref={sceneRef}>
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff6600" />
        <hemisphereLight 
          skyColor="#87CEEB" 
          groundColor="#654321" 
          intensity={0.4} 
        />
        
        {/* Enhanced Earth */}
        <EnhancedEarth
          impactLocation={impactLocation}
          showImpact={!!impactData}
          animationController={animationControllerRef.current}
          materialSettings={settings.earthMaterial}
        />
        
        {/* Enhanced Asteroid */}
        {asteroidData && (
          <EnhancedAsteroid
            asteroidData={asteroidData}
            isAnimating={isAnimating}
            animationController={animationControllerRef.current}
          />
        )}
        
        {/* Particle Effects */}
        <ParticleEffects
          animationController={animationControllerRef.current}
          impactData={impactData}
          enabled={settings.enableParticles !== false}
        />
        
        {/* Environment */}
        <mesh position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#2d5016" />
        </mesh>
        
        {/* Stars Background */}
        <mesh>
          <sphereGeometry args={[80, 32, 32]} />
          <meshBasicMaterial 
            color="#000011" 
            side={THREE.BackSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
      
      {/* UI Overlays */}
      {showControls && (
        <Html
          position={[0, 0, 0]}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '320px',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimationControls
              animationController={animationControllerRef.current}
              onAnimationStateChange={handleAnimationStateChange}
              disabled={!animationControllerRef.current}
            />
            
            <CinematicControls
              cameraController={cameraControllerRef.current}
              disabled={!cameraControllerRef.current}
            />
            
            <AnimationSettings
              onSettingsChange={handleSettingsChange}
              disabled={false}
            />
          </div>
        </Html>
      )}
      
      {/* Impact Statistics */}
      {impactData && (
        <Html position={[3, 2, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '13px',
            minWidth: '280px',
            border: '2px solid #ff4400',
            boxShadow: '0 0 20px rgba(255, 68, 0, 0.3)',
            pointerEvents: 'none'
          }}>
            <h6 style={{ 
              margin: '0 0 12px 0', 
              color: '#ff6600',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              🔥 IMPACT ANALYSIS 🔥
            </h6>
            
            <div style={{ display: 'grid', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>⚡ Kinetic Energy:</span>
                <span style={{ color: '#ffaa00' }}>
                  {((impactData.kineticEnergy || 0) / 1e15).toFixed(2)} PJ
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🕳️ Crater Diameter:</span>
                <span style={{ color: '#ffaa00' }}>
                  {((impactData.craterDiameter || 0) / 1000).toFixed(2)} km
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>🌍 Earthquake:</span>
                <span style={{ color: '#ffaa00' }}>
                  Magnitude {(impactData.earthquakeMagnitude || 0).toFixed(1)}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>💰 Economic Damage:</span>
                <span style={{ color: '#ff4444' }}>
                  ${((impactData.economicDamage || 0) / 1e9).toFixed(1)}B
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </>
  );
};

/**
 * Main Enhanced Impact 3D Component
 */
const EnhancedImpact3D = ({ 
  impactData, 
  asteroidData, 
  impactLocation,
  animate = false,
  onAnimationComplete,
  height = '600px',
  settings = {}
}) => {
  const [error] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time for initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (error) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#ff6600' }}></i>
          <h5 style={{ margin: '1rem 0' }}>3D Visualization Error</h5>
          <p style={{ color: '#ccc' }}>{error}</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div style={{ 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '1rem', color: '#ccc' }}>
            Initializing 3D Engine...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      width: '100%', 
      height, 
      borderRadius: '12px', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #2d1810 100%)',
      position: 'relative'
    }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.outputEncoding = THREE.sRGBEncoding;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <EnhancedImpactScene
          impactData={impactData}
          asteroidData={asteroidData}
          impactLocation={impactLocation}
          animateImpact={animate}
          onAnimationComplete={onAnimationComplete}
          settings={settings}
        />
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.05}
        />
        
        <PerspectiveCamera makeDefault />
      </Canvas>
    </div>
  );
};

export default EnhancedImpact3D;
