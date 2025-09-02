import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced Earth Component with Realistic Materials and Effects
 */
const EnhancedEarth = React.memo(({ 
  impactLocation, 
  showImpact = false, 
  animationPhase = 'idle',
  materialSettings = {}
}) => {
  const earthRef = useRef();
  const atmosphereRef = useRef();
  const impactMarkerRef = useRef();
  const cloudsRef = useRef();

  // Load textures
  const [earthColorMap, earthNormalMap, earthClouds] = useTexture([
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'
  ]);

  // Create Earth material with textures
  const earthMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: earthColorMap,
      normalMap: earthNormalMap,
      roughness: 0.85,
      metalness: 0.0
    });
    return mat;
  }, [earthColorMap, earthNormalMap]);

  // Create atmosphere effect
  const atmosphereMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#87CEEB',
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
  }, []);

  // Impact location marker
  const impactMarkerPosition = useMemo(() => {
    if (!impactLocation) return [0, 0, 2.1];
    
    // Convert lat/lng to 3D coordinates on sphere
    const lat = (impactLocation.lat * Math.PI) / 180;
    const lng = (impactLocation.lng * Math.PI) / 180;
    const radius = 2.05;
    
    const x = radius * Math.cos(lat) * Math.cos(lng);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lng);
    
    return [x, y, z];
  }, [impactLocation]);

  // Animation effects based on phase
  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.005; // Slow rotation
    }
    
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.003;
    }
    // Rotate cloud layer slightly faster
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.006;
    }

    // Pulse effect for impact marker during impact phases
    if (impactMarkerRef.current && (animationPhase === 'impact' || animationPhase === 'explosion')) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.3;
      impactMarkerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Main Earth sphere */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[2, 64, 32]} />
      </mesh>
      
      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 64, 32]} />
        <meshPhongMaterial
          map={earthClouds}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[2.1, 32, 16]} />
      </mesh>
      
      {/* Impact location marker */}
      {impactLocation && (
        <mesh ref={impactMarkerRef} position={impactMarkerPosition}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial 
            color={showImpact ? "#ff4444" : "#ffff44"}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Impact crater (simple version) */}
      {showImpact && animationPhase !== 'idle' && (
        <mesh position={impactMarkerPosition}>
          <cylinderGeometry args={[0.1, 0.05, 0.02, 16]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}
    </group>
  );
});

/**
 * Enhanced Asteroid Component
 */
const EnhancedAsteroid = React.memo(({ 
  asteroidData, 
  position = [0, 0, 5],
  animationPhase = 'idle',
  animationProgress = 0
}) => {
  const asteroidRef = useRef();
  const trailRef = useRef();

  // Get asteroid properties
  const asteroidSize = asteroidData?.estimatedDiameter?.kilometers?.estimated_diameter_max || 0.1;
  const scaledSize = Math.max(0.05, Math.min(asteroidSize * 0.1, 0.5));
  
  // Create asteroid material
  const asteroidMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8B4513',
      roughness: 0.8,
      metalness: 0.1,
      bumpScale: 0.05
    });
  }, []);

  // Plasma trail material
  const trailMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ff6600',
      transparent: true,
      opacity: 0.6
    });
  }, []);

  // Animation effects
  useFrame((state) => {
    if (asteroidRef.current) {
      // Rotation
      asteroidRef.current.rotation.x += 0.02;
      asteroidRef.current.rotation.y += 0.01;
      
      // Heat glow effect during approach
      if (animationPhase === 'approaching' && asteroidMaterial) {
        const glowIntensity = animationProgress * 2;
        asteroidMaterial.emissive.setRGB(
          glowIntensity * 0.5, 
          glowIntensity * 0.2, 
          0
        );
      }
    }
  });

  return (
    <group position={position}>
      {/* Main asteroid */}
      <mesh ref={asteroidRef} material={asteroidMaterial}>
        <sphereGeometry args={[scaledSize, 16, 8]} />
      </mesh>
      
      {/* Plasma trail (during approach) */}
      {animationPhase === 'approaching' && (
        <mesh ref={trailRef} position={[0, 0, scaledSize * 2]}>
          <coneGeometry args={[scaledSize * 0.3, scaledSize * 3, 8]} />
          <primitive object={trailMaterial} />
        </mesh>
      )}
    </group>
  );
});

/**
 * Simple Particle Effects
 */
const SimpleParticleEffects = ({ 
  position = [0, 0, 2], 
  animationPhase = 'idle',
  animationProgress = 0 
}) => {
  const explosionRef = useRef();
  const debrisRef = useRef();

  // Explosion effect
  const explosionScale = useMemo(() => {
    if (animationPhase === 'impact') return animationProgress * 2;
    if (animationPhase === 'explosion') return 1 + animationProgress;
    return 0;
  }, [animationPhase, animationProgress]);

  // Debris particles
  const debrisParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.7;
      particles.push({
        position: [
          Math.cos(angle) * radius,
          Math.random() * 0.5,
          Math.sin(angle) * radius
        ],
        scale: 0.02 + Math.random() * 0.03
      });
    }
    return particles;
  }, []);

  return (
    <group position={position}>
      {/* Explosion sphere */}
      {explosionScale > 0 && (
        <mesh ref={explosionRef} scale={explosionScale}>
          <sphereGeometry args={[0.3, 16, 8]} />
          <meshBasicMaterial
            color="#ff8800"
            transparent
            opacity={0.7 - animationProgress * 0.5}
          />
        </mesh>
      )}
      
      {/* Debris particles */}
      {animationPhase === 'explosion' && debrisParticles.map((particle, index) => (
        <mesh
          key={index}
          position={particle.position.map(p => p * animationProgress)}
          scale={particle.scale}
        >
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color="#8B4513" />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Animation Controller Hook
 */
const useEnhancedAnimation = (animate, onComplete) => {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [asteroidPosition, setAsteroidPosition] = useState([0, 0, 8]);

  useEffect(() => {
    if (!animate) {
      setPhase('idle');
      setProgress(0);
      setAsteroidPosition([0, 0, 8]);
      return;
    }

    let animationId;
    let startTime = Date.now();
    const duration = 8000; // 8 seconds total

    const animateStep = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);

      // Update phases and positions based on progress
      if (newProgress < 0.4) {
        setPhase('approaching');
        const t = newProgress / 0.4;
        setAsteroidPosition([
          0,
          0,
          8 - (6 * t * t) // Accelerating approach
        ]);
      } else if (newProgress < 0.5) {
        setPhase('impact');
        setAsteroidPosition([0, 0, 2]);
      } else if (newProgress < 0.8) {
        setPhase('explosion');
        setAsteroidPosition([0, 0, 2]);
      } else if (newProgress < 1) {
        setPhase('aftermath');
        setAsteroidPosition([0, 0, 2]);
      } else {
        setPhase('complete');
        if (onComplete) onComplete();
        return;
      }

      animationId = requestAnimationFrame(animateStep);
    };

    animationId = requestAnimationFrame(animateStep);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animate, onComplete]);

  return { phase, progress, asteroidPosition };
};

/**
 * Main Enhanced Impact Scene
 */
const EnhancedImpactScene = ({ 
  simulationData, 
  onAnimationComplete 
}) => {
  const { 
    impactData, 
    asteroidData, 
    impactLocation, 
    impactAngle = 45,
    impactVelocity = 20,
    animate = false 
  } = simulationData || {};

  const { phase, progress, asteroidPosition } = useEnhancedAnimation(animate, onAnimationComplete);

  // Camera controls
  const { camera } = useThree();
  
  useFrame(() => {
    // Dynamic camera positioning based on animation phase
    if (phase === 'approaching') {
      camera.position.lerp(new THREE.Vector3(5, 3, 5), 0.02);
      camera.lookAt(0, 0, 0);
    } else if (phase === 'impact' || phase === 'explosion') {
      camera.position.lerp(new THREE.Vector3(3, 2, 3), 0.02);
      camera.lookAt(0, 0, 2);
    }
  });

  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Point light for dramatic effect */}
      {(phase === 'impact' || phase === 'explosion') && (
        <pointLight
          position={asteroidPosition}
          intensity={2}
          color="#ff8800"
          distance={10}
        />
      )}

      {/* Enhanced Earth */}
      <EnhancedEarth
        impactLocation={impactLocation}
        showImpact={phase !== 'idle' && phase !== 'approaching'}
        animationPhase={phase}
      />

      {/* Enhanced Asteroid */}
      {asteroidData && phase !== 'complete' && (
        <EnhancedAsteroid
          asteroidData={asteroidData}
          position={asteroidPosition}
          animationPhase={phase}
          animationProgress={progress}
        />
      )}

      {/* Particle Effects */}
      {(phase === 'impact' || phase === 'explosion' || phase === 'aftermath') && (
        <SimpleParticleEffects
          position={asteroidPosition}
          animationPhase={phase}
          animationProgress={progress}
        />
      )}

      {/* Animation Status Overlay */}
      <Html position={[0, 4, 0]}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          border: '1px solid #333'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Enhanced Impact Simulation
          </div>
          <div>Phase: <span style={{ color: '#4A90E2' }}>{phase}</span></div>
          <div>Progress: <span style={{ color: '#4A90E2' }}>{(progress * 100).toFixed(1)}%</span></div>
          {asteroidData && (
            <div>Asteroid: <span style={{ color: '#4A90E2' }}>{asteroidData.name || 'Test Asteroid'}</span></div>
          )}
          {impactLocation && (
            <div>
              Location: <span style={{ color: '#4A90E2' }}>
                {impactLocation.lat.toFixed(2)}°, {impactLocation.lng.toFixed(2)}°
              </span>
            </div>
          )}
        </div>
      </Html>
    </>
  );
};

/**
 * Enhanced Impact 3D Component - Working Version
 */
const EnhancedImpact3D = ({ 
  simulationData = {}, 
  onAnimationComplete,
  style = {} 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState(null);

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        fontSize: '16px'
      }}>
        <div>
          <div style={{ marginBottom: '10px', color: '#ff4444' }}>⚠️ Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        fontSize: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px', fontSize: '24px' }}>🚀</div>
          <div>Loading Enhanced 3D...</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
            Initializing physics engine and shaders
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', ...style }}>
      <Canvas
        camera={{ position: [5, 3, 5], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #000011 0%, #000033 100%)' }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={20}
          minDistance={2}
          enableDamping
          dampingFactor={0.05}
        />
        
        <EnhancedImpactScene 
          simulationData={simulationData}
          onAnimationComplete={onAnimationComplete}
        />
      </Canvas>
      
      {/* Performance indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#4A90E2',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        Enhanced Mode: Active
      </div>
    </div>
  );
};

export default EnhancedImpact3D;
