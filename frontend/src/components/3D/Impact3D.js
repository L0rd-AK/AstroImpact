import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Impact crater component
const ImpactCrater = ({ position, size, depth = 0.1 }) => {
  const craterRef = useRef();
  
  useFrame((state) => {
    if (craterRef.current) {
      // Subtle pulsing effect
      craterRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });

  return (
    <group position={position} ref={craterRef}>
      {/* Main crater */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[size, size * 0.7, depth, 32]} />
        <meshStandardMaterial
          color="#654321"
          roughness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Crater rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.9, size * 1.2, 32]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Debris field */}
      {[...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const distance = size * (1.5 + Math.random() * 0.5);
        const debrisPos = [
          Math.cos(angle) * distance,
          Math.random() * 0.1,
          Math.sin(angle) * distance
        ];
        
        return (
          <mesh key={i} position={debrisPos} scale={Math.random() * 0.05 + 0.02}>
            <dodecahedronGeometry />
            <meshStandardMaterial color="#444444" />
          </mesh>
        );
      })}
    </group>
  );
};

// Shockwave animation component
const Shockwave = ({ isActive, intensity = 1 }) => {
  const [waves, setWaves] = useState([]);
  const wavesRef = useRef([]);

  useEffect(() => {
    if (isActive) {
      // Create multiple shockwave rings
      const newWaves = [
        { id: 1, startTime: 0, maxRadius: 2 * intensity },
        { id: 2, startTime: 0.5, maxRadius: 3 * intensity },
        { id: 3, startTime: 1, maxRadius: 4 * intensity }
      ];
      setWaves(newWaves);
    } else {
      setWaves([]);
    }
  }, [isActive, intensity]);

  useFrame((state) => {
    wavesRef.current.forEach((waveRef, index) => {
      if (waveRef && waves[index]) {
        const wave = waves[index];
        const elapsed = state.clock.elapsedTime - wave.startTime;
        const progress = Math.max(0, Math.min(1, elapsed / 3));
        
        if (progress > 0 && progress < 1) {
          const radius = progress * wave.maxRadius;
          waveRef.scale.set(radius, 1, radius);
          waveRef.material.opacity = (1 - progress) * 0.6;
        } else {
          waveRef.scale.set(0, 0, 0);
        }
      }
    });
  });

  return (
    <group>
      {waves.map((wave, index) => (
        <mesh
          key={wave.id}
          ref={el => wavesRef.current[index] = el}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.8, 1, 32]} />
          <meshStandardMaterial
            color="#ff6600"
            transparent
            opacity={0.6}
            emissive="#ff4400"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// Debris cloud component
const DebrisCloud = ({ isActive, intensity = 1 }) => {
  const debrisRef = useRef();
  const particlesRef = useRef([]);
  const [particles] = useState(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      initialPosition: [
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ],
      velocity: [
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      ],
      size: Math.random() * 0.02 + 0.01,
      color: Math.random() > 0.5 ? "#ff4400" : "#ffaa00"
    }));
  });

  useFrame((state, delta) => {
    if (isActive && particlesRef.current) {
      particlesRef.current.forEach((particleRef, index) => {
        if (particleRef && particles[index]) {
          const particle = particles[index];
          const elapsed = state.clock.elapsedTime;
          
          // Update position based on velocity and gravity
          const newY = particle.initialPosition[1] + 
            particle.velocity[1] * elapsed - 
            0.5 * 9.8 * Math.pow(elapsed, 2) * 0.1;
          
          particleRef.position.set(
            particle.initialPosition[0] + particle.velocity[0] * elapsed,
            Math.max(-2, newY),
            particle.initialPosition[2] + particle.velocity[2] * elapsed
          );
          
          // Fade out over time
          if (particleRef.material) {
            particleRef.material.opacity = Math.max(0, 1 - elapsed / 5);
          }
        }
      });
    }
  });

  if (!isActive) return null;

  return (
    <group ref={debrisRef}>
      {particles.map((particle, index) => (
        <mesh
          key={particle.id}
          ref={el => particlesRef.current[index] = el}
          position={particle.initialPosition}
          scale={particle.size}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={0.3}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
};

// Ground impact visualization
const GroundImpact = ({ position, impactData }) => {
  const [showEffects, setShowEffects] = useState(false);
  const [effectsIntensity, setEffectsIntensity] = useState(1);

  useEffect(() => {
    if (impactData) {
      setShowEffects(true);
      // Calculate effects intensity based on impact data
      const energy = impactData.kineticEnergy || 1e15;
      setEffectsIntensity(Math.min(3, Math.max(0.5, energy / 1e15)));
    }
  }, [impactData]);

  return (
    <group position={position}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#2d5016"
          roughness={0.9}
        />
      </mesh>
      
      {/* Impact crater */}
      {showEffects && (
        <ImpactCrater
          position={[0, 0, 0]}
          size={0.3 * effectsIntensity}
          depth={0.1 * effectsIntensity}
        />
      )}
      
      {/* Shockwave */}
      <Shockwave isActive={showEffects} intensity={effectsIntensity} />
      
      {/* Debris cloud */}
      <DebrisCloud isActive={showEffects} intensity={effectsIntensity} />
      
      {/* Fireball */}
      {showEffects && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.3 * effectsIntensity, 16, 16]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff6600"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};

// Impact statistics display
const ImpactStats = ({ impactData, position }) => {
  if (!impactData) return null;

  const {
    kineticEnergy = 0,
    craterDiameter = 0,
    earthquakeMagnitude = 0,
    casualties = {},
    economicDamage = 0
  } = impactData;

  return (
    <Html position={position}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '13px',
        minWidth: '280px',
        border: '2px solid #ff4400',
        boxShadow: '0 0 20px rgba(255, 68, 0, 0.3)'
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
              {(kineticEnergy / 1e15).toFixed(2)} PJ
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🕳️ Crater Diameter:</span>
            <span style={{ color: '#ffaa00' }}>
              {(craterDiameter / 1000).toFixed(2)} km
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🌍 Earthquake:</span>
            <span style={{ color: '#ffaa00' }}>
              Magnitude {earthquakeMagnitude.toFixed(1)}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>💰 Economic Damage:</span>
            <span style={{ color: '#ff4444' }}>
              ${(economicDamage / 1e9).toFixed(1)}B
            </span>
          </div>
          
          {casualties.total && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              background: 'rgba(255, 68, 68, 0.2)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff4444', fontWeight: 'bold' }}>
                ⚠️ Estimated Casualties
              </div>
              <div style={{ color: '#ffcccc', fontSize: '12px' }}>
                {casualties.total.toLocaleString()} people affected
              </div>
            </div>
          )}
        </div>
      </div>
    </Html>
  );
};

// Main Impact3D component
const Impact3D = ({ 
  impactData, 
  asteroidData, 
  animate = false,
  onAnimationComplete 
}) => {
  const [animationPhase, setAnimationPhase] = useState('approach'); // approach, impact, aftermath
  const [showImpact, setShowImpact] = useState(false);

  useEffect(() => {
    if (animate) {
      setAnimationPhase('approach');
      setShowImpact(false);
      
      // Sequence the animation
      const approachTimer = setTimeout(() => {
        setAnimationPhase('impact');
        setShowImpact(true);
      }, 2000);
      
      const aftermathTimer = setTimeout(() => {
        setAnimationPhase('aftermath');
        if (onAnimationComplete) onAnimationComplete();
      }, 5000);
      
      return () => {
        clearTimeout(approachTimer);
        clearTimeout(aftermathTimer);
      };
    }
  }, [animate, onAnimationComplete]);

  return (
    <div style={{ 
      width: '100%', 
      height: '600px', 
      borderRadius: '12px', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #2d1810 100%)',
      position: 'relative'
    }}>
      <Canvas camera={{ position: [0, 3, 8], fov: 60 }}>
        {/* Enhanced lighting for dramatic effect */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff6600" />
        
        {/* Ground impact scene */}
        <GroundImpact 
          position={[0, 0, 0]} 
          impactData={showImpact ? impactData : null}
        />
        
        {/* Approaching asteroid (only during approach phase) */}
        {animationPhase === 'approach' && asteroidData && (
          <mesh position={[5, 3, 5]}>
            <dodecahedronGeometry args={[0.1, 1]} />
            <meshStandardMaterial
              color="#8B4513"
              emissive="#ff4400"
              emissiveIntensity={0.2}
            />
          </mesh>
        )}
        
        {/* Impact statistics */}
        <ImpactStats 
          impactData={impactData}
          position={[4, 2, 0]}
        />
        
        {/* Environment */}
        <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1a1a0a" />
        </mesh>
        
        {/* Sky dome */}
        <mesh>
          <sphereGeometry args={[50, 32, 32]} />
          <meshBasicMaterial 
            color={animationPhase === 'impact' ? "#ff2200" : "#000822"} 
            side={THREE.BackSide}
            transparent
            opacity={0.8}
          />
        </mesh>
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
        />
        
        {/* Instructions */}
        <Html position={[-6, -2, 0]}>
          <div style={{
            color: '#cccccc',
            fontSize: '11px',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px',
            borderRadius: '4px',
            maxWidth: '200px'
          }}>
            <div style={{ color: '#ff6600', fontWeight: 'bold', marginBottom: '4px' }}>
              🎬 Impact Simulation
            </div>
            <div>Phase: {animationPhase.toUpperCase()}</div>
            <div style={{ marginTop: '8px', fontSize: '10px' }}>
              🖱️ Drag to rotate view<br/>
              🔍 Scroll to zoom<br/>
              📊 Statistics panel on right
            </div>
          </div>
        </Html>
      </Canvas>
      
      {/* Animation phase indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff',
        padding: '12px',
        borderRadius: '8px',
        border: '2px solid #ff6600'
      }}>
        <div style={{ fontWeight: 'bold', color: '#ff6600' }}>
          Animation Phase
        </div>
        <div style={{ textTransform: 'capitalize', fontSize: '14px' }}>
          {animationPhase}
        </div>
        {animate && (
          <div style={{ fontSize: '10px', color: '#cccccc', marginTop: '4px' }}>
            {animationPhase === 'approach' && '🚀 Asteroid approaching...'}
            {animationPhase === 'impact' && '💥 Impact in progress!'}
            {animationPhase === 'aftermath' && '🔥 Analyzing consequences...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Impact3D;
