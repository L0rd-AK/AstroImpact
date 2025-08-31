import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Detailed asteroid component with surface features
const DetailedAsteroid = ({ asteroidData, scale = 1 }) => {
  const asteroidRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (asteroidRef.current) {
      asteroidRef.current.rotation.y += 0.005;
      asteroidRef.current.rotation.x += 0.002;
    }
  });

  // Calculate asteroid properties
  const diameter = asteroidData?.diameter || 1000; // meters
  const displaySize = Math.max(0.5, Math.min(3, diameter / 1000)) * scale;
  const mass = asteroidData?.mass || (4/3 * Math.PI * Math.pow(diameter/2, 3) * 2700); // kg, assuming rock density
  const velocity = asteroidData?.velocity || 20; // km/s

  // Create irregular shape with noise
  const createAsteroidGeometry = () => {
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const vertices = geometry.attributes.position.array;
    
    // Add noise to create irregular surface
    for (let i = 0; i < vertices.length; i += 3) {
      const vertex = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
      const noise = Math.random() * 0.3 + 0.8; // Vary between 0.8 and 1.1
      vertex.multiplyScalar(noise);
      vertices[i] = vertex.x;
      vertices[i + 1] = vertex.y;
      vertices[i + 2] = vertex.z;
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };

  return (
    <group
      ref={asteroidRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? displaySize * 1.1 : displaySize}
    >
      {/* Main asteroid body */}
      <mesh geometry={createAsteroidGeometry()}>
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.9}
          metalness={0.1}
          bumpScale={0.3}
        />
      </mesh>
      
      {/* Surface details - craters */}
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const position = [
          Math.cos(angle) * 0.8,
          Math.sin(angle) * 0.3,
          Math.sin(angle) * 0.8
        ];
        
        return (
          <mesh key={i} position={position} scale={0.1}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
              color="#654321"
              transparent
              opacity={0.7}
            />
          </mesh>
        );
      })}
      
      {/* Asteroid info overlay */}
      {hovered && (
        <Html position={[2, 1, 0]} occlude>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '250px',
            border: '1px solid #00d4ff'
          }}>
            <h6 style={{ margin: '0 0 8px 0', color: '#00d4ff' }}>
              {asteroidData?.name || 'Asteroid Details'}
            </h6>
            <div style={{ marginBottom: '4px' }}>
              <strong>Diameter:</strong> {(diameter / 1000).toFixed(2)} km
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Mass:</strong> {(mass / 1e15).toExponential(2)} × 10¹⁵ kg
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Velocity:</strong> {velocity.toFixed(2)} km/s
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Kinetic Energy:</strong> {((0.5 * mass * Math.pow(velocity * 1000, 2)) / 1e15).toExponential(2)} PJ
            </div>
            {asteroidData?.is_potentially_hazardous_asteroid && (
              <div style={{ 
                color: '#ff4444', 
                fontWeight: 'bold',
                marginTop: '8px',
                padding: '4px 8px',
                background: 'rgba(255, 68, 68, 0.2)',
                borderRadius: '4px'
              }}>
                ⚠️ POTENTIALLY HAZARDOUS
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// Trajectory visualization
const Trajectory = ({ startPosition, endPosition, progress = 0 }) => {
  const points = [];
  const segments = 50;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...startPosition),
      new THREE.Vector3(...endPosition),
      t
    );
    points.push(point);
  }
  
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.02, 8, false);
  
  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial
        color="#ffaa00"
        transparent
        opacity={0.6}
        emissive="#ff6600"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
};

// Comparison scale component
const ScaleReference = ({ asteroidSize }) => {
  return (
    <group position={[4, -2, 0]}>
      {/* Earth reference */}
      <mesh position={[-1, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* Asteroid */}
      <mesh position={[1, 0, 0]}>
        <sphereGeometry args={[asteroidSize * 0.3, 16, 16]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Labels */}
      <Html position={[-1, -0.5, 0]}>
        <div style={{ color: '#cccccc', fontSize: '10px', textAlign: 'center' }}>
          Earth<br/>(Reference)
        </div>
      </Html>
      
      <Html position={[1, -0.5, 0]}>
        <div style={{ color: '#cccccc', fontSize: '10px', textAlign: 'center' }}>
          Asteroid<br/>(To Scale)
        </div>
      </Html>
    </group>
  );
};

// Main Asteroid3D component
const Asteroid3D = ({ asteroidData, showComparison = true, showTrajectory = false }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      borderRadius: '12px', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
    }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 0, 5]} intensity={0.3} color="#4A90E2" />
        <spotLight 
          position={[0, 5, 0]} 
          intensity={0.5} 
          angle={Math.PI / 4}
          penumbra={0.1}
          castShadow
        />
        
        {/* Star field background */}
        <mesh>
          <sphereGeometry args={[50, 32, 32]} />
          <meshBasicMaterial 
            color="#000011" 
            side={THREE.BackSide}
            transparent
            opacity={0.8}
          />
        </mesh>
        
        {/* Main asteroid */}
        <DetailedAsteroid asteroidData={asteroidData} scale={1} />
        
        {/* Scale comparison */}
        {showComparison && (
          <ScaleReference 
            asteroidSize={Math.max(0.1, Math.min(1, (asteroidData?.diameter || 1000) / 10000))} 
          />
        )}
        
        {/* Trajectory path */}
        {showTrajectory && (
          <Trajectory
            startPosition={[8, 4, 6]}
            endPosition={[0, 0, 0]}
            progress={0}
          />
        )}
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
          autoRotate={true}
          autoRotateSpeed={1}
        />
        
        {/* Asteroid statistics */}
        <Html position={[-4, 3, 0]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            minWidth: '200px',
            border: '1px solid #00d4ff'
          }}>
            <h6 style={{ margin: '0 0 8px 0', color: '#00d4ff' }}>
              Asteroid Analysis
            </h6>
            <div>Name: {asteroidData?.name || 'Unknown'}</div>
            <div>Type: Near-Earth Asteroid</div>
            <div>Composition: Rocky/Metallic</div>
            <div>Discovery: {asteroidData?.discovery_date || 'Historical'}</div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#cccccc' }}>
              🖱️ Click and drag to rotate<br/>
              🔍 Scroll to zoom in/out<br/>
              🎯 Hover for details
            </div>
          </div>
        </Html>
      </Canvas>
    </div>
  );
};

export default Asteroid3D;
