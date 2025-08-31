import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Simplified Enhanced Impact 3D Component for Testing
 * This version removes complex dependencies to isolate issues
 */

// Simple Earth component without advanced materials
const SimpleEarth = ({ impactLocation }) => {
  const earthRef = useRef();

  useEffect(() => {
    if (earthRef.current && impactLocation) {
      // Simple impact marker logic
      console.log('Impact location:', impactLocation);
    }
  }, [impactLocation]);

  return (
    <group>
      {/* Basic Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 32]} />
        <meshStandardMaterial
          color="#4A90E2"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Simple impact marker */}
      {impactLocation && (
        <mesh position={[0, 0, 2.1]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      )}
    </group>
  );
};

// Simple asteroid component
const SimpleAsteroid = ({ asteroidData, position = [0, 0, 5] }) => {
  const asteroidRef = useRef();

  // Get asteroid size from data
  const asteroidSize = asteroidData?.estimatedDiameter?.kilometers?.estimated_diameter_max || 0.1;
  const scaledSize = Math.max(0.05, Math.min(asteroidSize * 0.1, 0.5)); // Scale for visibility

  return (
    <mesh ref={asteroidRef} position={position}>
      <sphereGeometry args={[scaledSize, 16, 8]} />
      <meshStandardMaterial
        color="#8B4513"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

// Simple animation controller
const useSimpleAnimation = (animate, onComplete) => {
  const [phase, setPhase] = useState('idle'); // idle, approaching, impact, explosion, aftermath
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!animate) {
      setPhase('idle');
      setProgress(0);
      return;
    }

    let animationId;
    let startTime = Date.now();
    const duration = 5000; // 5 seconds total

    const animateStep = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);

      // Update phases based on progress
      if (newProgress < 0.3) {
        setPhase('approaching');
      } else if (newProgress < 0.4) {
        setPhase('impact');
      } else if (newProgress < 0.7) {
        setPhase('explosion');
      } else if (newProgress < 1) {
        setPhase('aftermath');
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

  return { phase, progress };
};

// Main scene component
const EnhancedImpactScene = ({ 
  simulationData, 
  onAnimationComplete 
}) => {
  const { impactData, asteroidData, impactLocation, animate } = simulationData || {};
  const { phase, progress } = useSimpleAnimation(animate, onAnimationComplete);

  // Calculate asteroid position based on animation phase
  const asteroidPosition = React.useMemo(() => {
    if (phase === 'idle') return [0, 0, 8];
    if (phase === 'approaching') {
      const t = progress / 0.3; // 0 to 1 during approaching phase
      return [
        0,
        0,
        8 - (6 * t) // Move from z=8 to z=2
      ];
    }
    if (phase === 'impact' || phase === 'explosion' || phase === 'aftermath') {
      return [0, 0, 2]; // At impact point
    }
    return [0, 0, 8];
  }, [phase, progress]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Earth */}
      <SimpleEarth impactLocation={impactLocation} />

      {/* Asteroid */}
      {asteroidData && (
        <SimpleAsteroid 
          asteroidData={asteroidData} 
          position={asteroidPosition}
        />
      )}

      {/* Simple explosion effect */}
      {(phase === 'impact' || phase === 'explosion') && (
        <mesh position={[0, 0, 2]}>
          <sphereGeometry args={[0.2 + progress * 0.5, 8, 8]} />
          <meshBasicMaterial
            color="#ff8800"
            transparent
            opacity={0.7 - progress * 0.5}
          />
        </mesh>
      )}

      {/* Animation info overlay */}
      <Html position={[0, 3, 0]}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <div>Phase: {phase}</div>
          <div>Progress: {(progress * 100).toFixed(1)}%</div>
          {asteroidData && (
            <div>Asteroid: {asteroidData.name || 'Test Asteroid'}</div>
          )}
        </div>
      </Html>
    </>
  );
};

// Main component
const EnhancedImpact3D = ({ 
  simulationData = {}, 
  onAnimationComplete,
  style = {} 
}) => {
  const [isLoading] = useState(false);
  const [error] = useState(null);

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff'
      }}>
        <div>Error: {error}</div>
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
        color: '#fff'
      }}>
        <div>Loading Enhanced 3D...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', ...style }}>
      <Canvas
        camera={{ position: [5, 3, 5], fov: 60 }}
        style={{ background: '#000011' }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={20}
          minDistance={3}
        />
        
        <EnhancedImpactScene 
          simulationData={simulationData}
          onAnimationComplete={onAnimationComplete}
        />
      </Canvas>
    </div>
  );
};

export default EnhancedImpact3D;
