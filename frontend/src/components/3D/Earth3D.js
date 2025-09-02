import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Earth component with realistic textures
const Earth = ({ impactLocation, showImpact }) => {
  const earthRef = useRef();
  const impactRef = useRef();
  
  // Convert lat/lng to 3D coordinates on sphere
  const latLngTo3D = (lat, lng, radius = 2) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    return {
      x: -radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  };

  const impactPosition = impactLocation ? latLngTo3D(impactLocation.lat, impactLocation.lng) : { x: 0, y: 0, z: 0 };

  // Rotate Earth
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  const [earthColorMap, earthNormalMap, earthClouds] = useTexture([
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'
  ]);

  return (
    <group>
      {/* Earth */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          map={earthColorMap}
          normalMap={earthNormalMap}
          roughness={0.85}
          metalness={0.0}
        />
      </Sphere>

      {/* Clouds */}
      <Sphere args={[2.03, 64, 64]}>
        <meshPhongMaterial
          map={earthClouds}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </Sphere>
      
      {/* Atmosphere */}
      <Sphere args={[2.05, 64, 64]}>
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Impact location marker */}
      {showImpact && impactLocation && (
        <group position={[impactPosition.x, impactPosition.y, impactPosition.z]}>
          <Sphere ref={impactRef} args={[0.05, 16, 16]}>
            <meshStandardMaterial
              color="#ff4444"
              emissive="#ff2222"
              emissiveIntensity={0.5}
            />
          </Sphere>
          
          {/* Impact crater ring */}
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.1, 0.15, 32]} />
            <meshStandardMaterial
              color="#ff6666"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
      
      {/* Country/City labels could be added here */}
    </group>
  );
};

// Asteroid component
const Asteroid = ({ position, size = 0.1, velocity, isAnimating }) => {
  const asteroidRef = useRef();
  const [currentPosition, setCurrentPosition] = useState(position);

  useFrame((state, delta) => {
    if (asteroidRef.current && isAnimating && velocity) {
      // Animate asteroid movement towards Earth
      const direction = new THREE.Vector3(0, 0, 0).sub(new THREE.Vector3(...currentPosition)).normalize();
      const newPos = new THREE.Vector3(...currentPosition).add(direction.multiplyScalar(velocity * delta));
      
      setCurrentPosition([newPos.x, newPos.y, newPos.z]);
      asteroidRef.current.position.copy(newPos);
      
      // Add rotation
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={currentPosition}>
      <mesh ref={asteroidRef}>
        {/* Irregular asteroid shape */}
        <dodecahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Asteroid trail */}
      {isAnimating && (
        <mesh>
          <cylinderGeometry args={[0.002, 0.01, 1, 8]} />
          <meshStandardMaterial
            color="#ffaa00"
            transparent
            opacity={0.6}
            emissive="#ff6600"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

// Impact explosion effect
const ImpactExplosion = ({ position, isVisible, intensity = 1 }) => {
  const explosionRef = useRef();
  const [scale, setScale] = useState(0);

  useFrame((state, delta) => {
    if (isVisible && explosionRef.current) {
      const newScale = scale + delta * 2;
      setScale(newScale);
      explosionRef.current.scale.setScalar(Math.min(newScale, intensity));
      
      // Fade out
      if (explosionRef.current.material) {
        explosionRef.current.material.opacity = Math.max(0, 1 - (newScale / intensity));
      }
    }
  });

  if (!isVisible) return null;

  return (
    <group position={position}>
      <Sphere ref={explosionRef} args={[0.1, 16, 16]}>
        <meshStandardMaterial
          color="#ff4400"
          transparent
          opacity={1}
          emissive="#ff6600"
          emissiveIntensity={2}
        />
      </Sphere>
      
      {/* Shockwave rings */}
      {[1, 2, 3].map((ring, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2 + index * 0.1, 0.25 + index * 0.1, 32]} />
          <meshStandardMaterial
            color="#ffaa00"
            transparent
            opacity={0.5 - index * 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// Main Earth3D component
const Earth3D = ({ 
  impactLocation, 
  asteroidData, 
  showImpact = false, 
  animateImpact = false,
  onAnimationComplete 
}) => {
  const [showExplosion, setShowExplosion] = useState(false);
  const [asteroidPosition, setAsteroidPosition] = useState([8, 4, 6]);

  useEffect(() => {
    if (animateImpact) {
      // Reset animation
      setShowExplosion(false);
      setAsteroidPosition([8, 4, 6]);
      
      // Trigger explosion after delay
      const timer = setTimeout(() => {
        setShowExplosion(true);
        if (onAnimationComplete) onAnimationComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [animateImpact, onAnimationComplete]);

  const asteroidSize = asteroidData?.diameter ? 
    Math.max(0.05, Math.min(0.3, asteroidData.diameter / 10000)) : 0.1;

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4A90E2" />
        
        {/* Earth */}
        <Earth impactLocation={impactLocation} showImpact={showImpact} />
        
        {/* Asteroid */}
        {asteroidData && (
          <Asteroid
            position={asteroidPosition}
            size={asteroidSize}
            velocity={animateImpact ? 2 : 0}
            isAnimating={animateImpact}
          />
        )}
        
        {/* Impact explosion */}
        {showImpact && impactLocation && (
          <ImpactExplosion
            position={impactLocation ? [
              latLngTo3D(impactLocation.lat, impactLocation.lng).x,
              latLngTo3D(impactLocation.lat, impactLocation.lng).y,
              latLngTo3D(impactLocation.lat, impactLocation.lng).z
            ] : [0, 0, 0]}
            isVisible={showExplosion}
            intensity={asteroidSize * 10}
          />
        )}
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={!animateImpact}
          autoRotateSpeed={0.5}
        />
        
        {/* Info overlay */}
        {asteroidData && (
          <Html position={[3, 3, 0]}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '12px',
              minWidth: '200px'
            }}>
              <h6 style={{ margin: '0 0 8px 0', color: '#00d4ff' }}>
                {asteroidData.name || 'Selected Asteroid'}
              </h6>
              {asteroidData.diameter && (
                <div>Diameter: {(asteroidData.diameter / 1000).toFixed(2)} km</div>
              )}
              {asteroidData.velocity && (
                <div>Velocity: {asteroidData.velocity.toFixed(2)} km/s</div>
              )}
              {asteroidData.mass && (
                <div>Mass: {asteroidData.mass.toExponential(2)} kg</div>
              )}
            </div>
          </Html>
        )}
        
        {/* Instructions */}
        <Html position={[-4, -3, 0]}>
          <div style={{
            color: '#cccccc',
            fontSize: '11px',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '8px',
            borderRadius: '4px'
          }}>
            🖱️ Drag to rotate • 🔍 Scroll to zoom • 📍 Impact location marked in red
          </div>
        </Html>
      </Canvas>
    </div>
  );
};

// Helper function (defined outside component to avoid re-creation)
const latLngTo3D = (lat, lng, radius = 2) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
};

export default Earth3D;
