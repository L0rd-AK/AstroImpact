import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';

// Textured Earth sphere with clouds
const EarthSphere = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const [earthColorMap, earthNormalMap, earthClouds] = useTexture([
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'
  ]);

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial map={earthColorMap} normalMap={earthNormalMap} roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.015, 48, 48]} />
        <meshPhongMaterial map={earthClouds} transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
};

// Orbit path ellipse ring (in XZ plane, later rotated via parent group)
const OrbitRing = ({ a, b }) => {
  const points = useMemo(() => {
    const segments = 160;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(t) * a, 0, Math.sin(t) * b]);
    }
    return pts;
  }, [a, b]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#7a7a7a" linewidth={1} />
    </line>
  );
};

// One orbiting asteroid marker
const OrbitingAsteroid = ({ asteroid, index }) => {
  const ref = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = React.useState(false);

  // Derive simple orbit parameters
  const avgDiameter = asteroid?.calculatedProperties?.averageDiameter ||
    asteroid?.estimated_diameter?.meters?.estimated_diameter_max || 200;
  const velocityKps = Number(
    asteroid?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second
  ) || asteroid?.calculatedProperties?.averageVelocity || 10;

  // Map miss distance (km) to orbit radius units (scene units)
  const missKm = Number(asteroid?.close_approach_data?.[0]?.miss_distance?.kilometers) || 3.8e5;
  const aSemi = useMemo(() => {
    // Scale: 12,000 km -> 1 scene unit, clamp to [1.2, 12]
    const r = Math.max(1.2, Math.min(12, missKm / 12000));
    return r;
  }, [missKm]);

  // Ellipse minor axis b depends on velocity and index for variety
  const bSemi = useMemo(() => {
    const vNorm = Math.max(1, Math.min(50, velocityKps)) / 50; // 0..1
    const factor = 0.55 + 0.35 * (0.3 + (index % 7) / 10) * (1 - vNorm);
    return Math.max(0.6, Math.min(aSemi, aSemi * factor));
  }, [aSemi, velocityKps, index]);

  // Size scaled down a lot for readability
  const size = Math.max(0.03, Math.min(0.15, (avgDiameter / 1000) * 0.05));

  // Base phase based on epoch and id to place asteroid along its ellipse
  const epochMs = Number(asteroid?.close_approach_data?.[0]?.epoch_date_close_approach) || 0;
  const phase = useMemo(() => {
    const base = (epochMs / 1e7) % (Math.PI * 2);
    return base + (index % 16) * (Math.PI / 8);
  }, [epochMs, index]);

  // Deterministic orientation from id
  const idSeed = (asteroid?.neo_reference_id || String(asteroid?._id || index))
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const inclination = ((idSeed % 45) - 22.5) * (Math.PI / 180); // -22.5..22.5 deg
  const omega = ((idSeed % 360) * Math.PI) / 180; // longitude of ascending node
  const argPeriapsis = (((idSeed * 3) % 360) * Math.PI) / 180;

  // Angular speed for visible circling motion
  const angularSpeed = useMemo(() => {
    const v = Math.max(1, Math.min(50, velocityKps));
    return (v / 50) * 0.7 / Math.max(0.8, (aSemi + bSemi) / 2);
  }, [velocityKps, aSemi, bSemi]);

  // Animate position along ellipse
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const theta = phase + t * angularSpeed;
    const x = Math.cos(theta) * aSemi;
    const z = Math.sin(theta) * bSemi;
    const y = 0;
    if (ref.current) ref.current.position.set(x, y, z);
  });

  const fmt = {
    m: (v) => (v == null || isNaN(v) ? 'N/A' : `${Number(v).toFixed(0)} m`),
    kps: (v) => (v == null || isNaN(v) ? 'N/A' : `${Number(v).toFixed(2)} km/s`),
    sci: (v) => {
      if (v == null || isNaN(v)) return 'N/A';
      const n = Number(v);
      if (n === 0) return '0 J';
      const e = Math.floor(Math.log10(Math.abs(n)));
      const mant = n / Math.pow(10, e);
      return `${mant.toFixed(2)}e${e} J`;
    }
  };

  // Diameter (single value): prefer calculated average, else mean of min/max meters
  const diameterM = useMemo(() => {
    if (asteroid?.calculatedProperties?.averageDiameter) {
      return asteroid.calculatedProperties.averageDiameter;
    }
    const minM = asteroid?.estimated_diameter?.meters?.estimated_diameter_min;
    const maxM = asteroid?.estimated_diameter?.meters?.estimated_diameter_max;
    if (minM && maxM) return (Number(minM) + Number(maxM)) / 2;
    return undefined;
  }, [asteroid]);

  // Velocity km/s
  const velocityKmS = Number(
    asteroid?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second
  ) || asteroid?.calculatedProperties?.averageVelocity;

  // Kinetic energy: use provided; else 0.5*m*v^2 with v in m/s
  const kineticEnergyJ = useMemo(() => {
    if (asteroid?.calculatedProperties?.kineticEnergy) {
      return asteroid.calculatedProperties.kineticEnergy;
    }
    const mass = asteroid?.calculatedProperties?.mass; // kg
    const vms = velocityKmS ? Number(velocityKmS) * 1000 : undefined; // m/s
    if (mass && vms) return 0.5 * mass * vms * vms;
    return undefined;
  }, [asteroid, velocityKmS]);

  return (
    <group ref={groupRef} rotation={[inclination, omega, argPeriapsis]}>
      <OrbitRing a={aSemi} b={bSemi} />
      <mesh
        ref={ref}
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial color={hovered ? '#e0b089' : '#b38b6d'} roughness={0.9} metalness={0.05} />
        {hovered && (
          <Html position={[0, 0.25 + size * 2, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid #444',
              maxWidth: '260px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {asteroid?.name || asteroid?.neo_reference_id || 'Asteroid'}
              </div>
              <div style={{ opacity: 0.9 }}>
                <div><b>Name:</b> {asteroid?.name || 'N/A'}</div>
                <div><b>Diameter:</b> {fmt.m(diameterM)}</div>
                <div><b>Velocity:</b> {fmt.kps(velocityKmS)}</div>
                <div><b>Kinetic Energy:</b> {fmt.sci(kineticEnergyJ)}</div>
                <div><b>Hazard Level:</b> {asteroid?.is_potentially_hazardous_asteroid ? 'Hazardous' : 'Not Hazardous'}</div>
              </div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

const StarsBackground = () => {
  return (
    <mesh>
      <sphereGeometry args={[60, 32, 32]} />
      <meshBasicMaterial color="#000010" side={1} />
    </mesh>
  );
};

const Scene = ({ asteroids }) => {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 8, 5]} intensity={1} castShadow />
      <pointLight position={[-6, -4, -4]} intensity={0.3} color="#4A90E2" />

      <StarsBackground />
      <group>
        <EarthSphere />
        {asteroids?.map((a, i) => (
          <OrbitingAsteroid key={a._id || i} asteroid={a} index={i} />
        ))}
      </group>

      <OrbitControls enablePan enableZoom enableRotate autoRotate={false} />
    </>
  );
};

const OrbitView = ({ asteroids = [] }) => {
  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      <Canvas shadows camera={{ position: [0, 3, 10], fov: 50 }}>
        <Scene asteroids={asteroids} />
      </Canvas>
    </div>
  );
};

export default OrbitView;


