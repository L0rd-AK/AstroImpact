import * as THREE from 'three';

/**
 * Advanced Particle Systems for Asteroid Impact Simulation
 * Physics-based particle simulation with realistic behaviors
 */

// Base Particle System with object pooling and LOD
export class ParticleSystemBase {
  constructor(options = {}) {
    this.maxParticles = options.maxParticles || 1000;
    this.poolSize = Math.ceil(this.maxParticles * 1.5); // 50% extra for pooling
    this.activeParticles = [];
    this.particlePool = [];
    this.isActive = false;
    this.emissionRate = options.emissionRate || 100; // particles per second
    this.lifetime = options.lifetime || 5; // seconds
    this.gravity = options.gravity || new THREE.Vector3(0, -9.81, 0);
    
    // LOD settings
    this.lodLevels = {
      high: { maxParticles: this.maxParticles, quality: 1.0 },
      medium: { maxParticles: Math.floor(this.maxParticles * 0.6), quality: 0.7 },
      low: { maxParticles: Math.floor(this.maxParticles * 0.3), quality: 0.4 }
    };
    this.currentLOD = 'high';
    
    // Performance monitoring
    this.frameTime = 0;
    this.targetFrameTime = 16.67; // 60fps
    
    this.initialize();
  }
  
  initialize() {
    this.createGeometry();
    this.createMaterial();
    this.createMesh();
    this.initializeParticlePool();
  }
  
  createGeometry() {
    // Override in subclasses
    this.geometry = new THREE.BufferGeometry();
  }
  
  createMaterial() {
    // Override in subclasses
    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  }
  
  createMesh() {
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false; // Important for large particle systems
  }
  
  initializeParticlePool() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particlePool.push(this.createParticle());
    }
  }
  
  createParticle() {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      life: 0,
      maxLife: this.lifetime,
      size: 1,
      color: new THREE.Color(1, 1, 1),
      opacity: 1,
      active: false
    };
  }
  
  getParticleFromPool() {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop();
    }
    return this.createParticle(); // Fallback if pool is empty
  }
  
  returnParticleToPool(particle) {
    particle.active = false;
    particle.life = 0;
    this.particlePool.push(particle);
  }
  
  emitParticle(position, velocity, options = {}) {
    if (this.activeParticles.length >= this.getCurrentMaxParticles()) {
      // Remove oldest particle if at limit
      const oldestParticle = this.activeParticles.shift();
      this.returnParticleToPool(oldestParticle);
    }
    
    const particle = this.getParticleFromPool();
    particle.position.copy(position);
    particle.velocity.copy(velocity);
    particle.acceleration.copy(this.gravity);
    particle.life = 0;
    particle.maxLife = options.lifetime || this.lifetime;
    particle.size = options.size || 1;
    particle.color.copy(options.color || new THREE.Color(1, 1, 1));
    particle.opacity = options.opacity || 1;
    particle.active = true;
    
    this.activeParticles.push(particle);
  }
  
  update(deltaTime) {
    if (!this.isActive) return;
    
    const startTime = performance.now();
    
    // Update particles with physics
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      if (!particle.active || particle.life >= particle.maxLife) {
        this.activeParticles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }
      
      // Physics update
      particle.velocity.add(
        particle.acceleration.clone().multiplyScalar(deltaTime)
      );
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );
      
      // Life update
      particle.life += deltaTime;
      
      // Fade out over lifetime
      const lifeRatio = particle.life / particle.maxLife;
      particle.opacity = 1 - lifeRatio;
      
      this.updateParticleSpecific(particle, deltaTime, lifeRatio);
    }
    
    this.updateGeometry();
    
    // Performance monitoring and LOD adjustment
    this.frameTime = performance.now() - startTime;
    this.adjustLOD();
  }
  
  updateParticleSpecific(particle, deltaTime, lifeRatio) {
    // Override in subclasses for specific behaviors
  }
  
  updateGeometry() {
    const positions = new Float32Array(this.activeParticles.length * 3);
    const colors = new Float32Array(this.activeParticles.length * 3);
    const sizes = new Float32Array(this.activeParticles.length);
    const opacities = new Float32Array(this.activeParticles.length);
    
    for (let i = 0; i < this.activeParticles.length; i++) {
      const particle = this.activeParticles[i];
      const i3 = i * 3;
      
      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;
      
      colors[i3] = particle.color.r;
      colors[i3 + 1] = particle.color.g;
      colors[i3 + 2] = particle.color.b;
      
      sizes[i] = particle.size;
      opacities[i] = particle.opacity;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;
  }
  
  adjustLOD() {
    if (this.frameTime > this.targetFrameTime * 1.5 && this.currentLOD !== 'low') {
      this.setLOD(this.currentLOD === 'high' ? 'medium' : 'low');
    } else if (this.frameTime < this.targetFrameTime * 0.8 && this.currentLOD !== 'high') {
      this.setLOD(this.currentLOD === 'low' ? 'medium' : 'high');
    }
  }
  
  setLOD(level) {
    this.currentLOD = level;
    const lod = this.lodLevels[level];
    
    // Remove excess particles if needed
    while (this.activeParticles.length > lod.maxParticles) {
      const particle = this.activeParticles.pop();
      this.returnParticleToPool(particle);
    }
  }
  
  getCurrentMaxParticles() {
    return this.lodLevels[this.currentLOD].maxParticles;
  }
  
  start() {
    this.isActive = true;
  }
  
  stop() {
    this.isActive = false;
  }
  
  clear() {
    this.activeParticles.forEach(particle => {
      this.returnParticleToPool(particle);
    });
    this.activeParticles = [];
  }
  
  dispose() {
    this.clear();
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    this.particlePool = [];
  }
}

/**
 * Plasma Trail System for atmospheric entry
 */
export class PlasmaTrailSystem extends ParticleSystemBase {
  constructor(options = {}) {
    super({
      maxParticles: 500,
      emissionRate: 200,
      lifetime: 2,
      ...options
    });
    
    this.temperature = 5000; // Kelvin
    this.plasmaColors = [
      new THREE.Color(1, 0.8, 0.4), // Orange
      new THREE.Color(1, 0.4, 0.2), // Red-orange
      new THREE.Color(0.8, 0.2, 1), // Purple-blue
      new THREE.Color(0.4, 0.8, 1)  // Blue-white
    ];
  }
  
  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        temperature: { value: this.temperature }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float temperature;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          // Create plasma-like glow effect
          float glow = 1.0 - distance * 2.0;
          glow = pow(glow, 2.0);
          
          // Temperature-based color variation
          vec3 hotColor = mix(vColor, vec3(1.0, 1.0, 1.0), temperature / 10000.0);
          
          gl_FragColor = vec4(hotColor * glow, vOpacity * glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
  
  emitPlasmaParticle(position, velocity, temperature = this.temperature) {
    const colorIndex = Math.floor(Math.random() * this.plasmaColors.length);
    const color = this.plasmaColors[colorIndex];
    
    this.emitParticle(position, velocity, {
      color: color,
      size: 0.2 + Math.random() * 0.3,
      lifetime: 1 + Math.random() * 2,
      opacity: 0.8 + Math.random() * 0.2
    });
  }
  
  updateParticleSpecific(particle, deltaTime, lifeRatio) {
    // Plasma particles expand and cool over time
    particle.size *= 1 + deltaTime * 0.5;
    
    // Color shift from hot to cool
    const coolFactor = lifeRatio;
    particle.color.lerp(new THREE.Color(0.2, 0.2, 0.8), coolFactor * 0.3);
    
    // Add turbulence
    const turbulence = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    particle.velocity.add(turbulence);
  }
  
  update(deltaTime) {
    super.update(deltaTime);
    if (this.material.uniforms) {
      this.material.uniforms.time.value += deltaTime;
    }
  }
}

/**
 * Impact Explosion System
 */
export class ImpactExplosionSystem extends ParticleSystemBase {
  constructor(options = {}) {
    super({
      maxParticles: 2000,
      emissionRate: 1000,
      lifetime: 8,
      gravity: new THREE.Vector3(0, -2, 0),
      ...options
    });
    
    this.explosionCenter = new THREE.Vector3();
    this.explosionRadius = 0;
    this.explosionForce = 100;
    this.phases = ['fireball', 'shockwave', 'debris', 'dust'];
    this.currentPhase = 0;
  }
  
  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        explosionCenter: { value: this.explosionCenter },
        explosionRadius: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute float phase;
        uniform vec3 explosionCenter;
        uniform float explosionRadius;
        varying float vOpacity;
        varying vec3 vColor;
        varying float vPhase;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          vPhase = phase;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Size based on distance from explosion and phase
          float distanceFromExplosion = distance(position, explosionCenter);
          float sizeFactor = 1.0 + (explosionRadius - distanceFromExplosion) / explosionRadius;
          
          gl_PointSize = size * sizeFactor * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying float vPhase;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          float alpha = 1.0 - distance * 2.0;
          
          // Different effects based on phase
          if (vPhase < 1.0) {
            // Fireball phase - intense glow
            alpha = pow(alpha, 0.5);
          } else if (vPhase < 2.0) {
            // Shockwave phase - sharp edges
            alpha = step(0.3, alpha);
          } else {
            // Debris/dust phase - soft particles
            alpha = pow(alpha, 2.0);
          }
          
          gl_FragColor = vec4(vColor, vOpacity * alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
  
  explode(center, energy) {
    this.explosionCenter.copy(center);
    this.explosionRadius = Math.pow(energy / 1e15, 1/3) * 2; // Cube root scaling
    this.explosionForce = energy / 1e14;
    
    this.clear();
    this.emitExplosionParticles();
  }
  
  emitExplosionParticles() {
    const particleCount = this.getCurrentMaxParticles();
    
    for (let i = 0; i < particleCount; i++) {
      const phase = Math.floor(Math.random() * this.phases.length);
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const distance = Math.random() * this.explosionRadius;
      
      const position = new THREE.Vector3(
        this.explosionCenter.x + Math.cos(angle) * Math.cos(elevation) * distance,
        this.explosionCenter.y + Math.sin(elevation) * distance,
        this.explosionCenter.z + Math.sin(angle) * Math.cos(elevation) * distance
      );
      
      const velocity = position.clone().sub(this.explosionCenter).normalize();
      velocity.multiplyScalar(this.explosionForce * (0.5 + Math.random() * 0.5));
      
      const color = this.getPhaseColor(phase);
      
      this.emitParticle(position, velocity, {
        color: color,
        size: 0.1 + Math.random() * 0.5,
        lifetime: 3 + Math.random() * 5,
        opacity: 0.7 + Math.random() * 0.3,
        phase: phase
      });
    }
  }
  
  getPhaseColor(phase) {
    switch (phase) {
      case 0: // Fireball
        return new THREE.Color(1, 0.3, 0);
      case 1: // Shockwave
        return new THREE.Color(1, 1, 0.5);
      case 2: // Debris
        return new THREE.Color(0.4, 0.3, 0.2);
      case 3: // Dust
        return new THREE.Color(0.6, 0.5, 0.4);
      default:
        return new THREE.Color(1, 1, 1);
    }
  }
  
  updateParticleSpecific(particle, deltaTime, lifeRatio) {
    // Different behaviors based on particle phase
    const phase = particle.phase || 0;
    
    switch (Math.floor(phase)) {
      case 0: // Fireball - expand and fade
        particle.size *= 1 + deltaTime * 2;
        break;
      case 1: // Shockwave - fast expansion, quick fade
        particle.size *= 1 + deltaTime * 5;
        particle.opacity *= 0.95;
        break;
      case 2: // Debris - ballistic trajectory
        // Already handled by base physics
        break;
      case 3: // Dust - slow, affected by air resistance
        particle.velocity.multiplyScalar(0.98);
        break;
      default:
        break;
    }
  }
}

/**
 * Debris Cloud System
 */
export class DebrisCloudSystem extends ParticleSystemBase {
  constructor(options = {}) {
    super({
      maxParticles: 1500,
      emissionRate: 500,
      lifetime: 15,
      gravity: new THREE.Vector3(0, -3, 0),
      ...options
    });
    
    this.windVelocity = new THREE.Vector3(2, 0, 1);
    this.airResistance = 0.02;
  }
  
  createMaterial() {
    this.material = new THREE.PointsMaterial({
      color: 0x8B4513,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending,
      map: this.createDebrisTexture()
    });
  }
  
  createDebrisTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Create irregular rock-like texture
    context.fillStyle = '#654321';
    context.fillRect(0, 0, 32, 32);
    
    for (let i = 0; i < 20; i++) {
      context.fillStyle = `rgb(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 80 + 60)}, ${Math.floor(Math.random() * 60 + 40)})`;
      context.fillRect(Math.random() * 32, Math.random() * 32, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  updateParticleSpecific(particle, deltaTime, lifeRatio) {
    // Apply air resistance
    particle.velocity.multiplyScalar(1 - this.airResistance * deltaTime);
    
    // Apply wind force
    const windForce = this.windVelocity.clone().multiplyScalar(deltaTime * 0.1);
    particle.velocity.add(windForce);
    
    // Tumbling rotation (affects visual only, stored in particle data)
    if (!particle.rotation) {
      particle.rotation = new THREE.Vector3(
        Math.random() * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.1
      );
    }
    
    // Size variation for realism
    particle.size = particle.originalSize * (0.8 + 0.4 * Math.sin(particle.life * 3));
  }
  
  emitDebris(position, velocity, material = 'rock') {
    const materialColors = {
      rock: new THREE.Color(0.4, 0.3, 0.2),
      metal: new THREE.Color(0.6, 0.6, 0.7),
      ice: new THREE.Color(0.8, 0.9, 1.0)
    };
    
    this.emitParticle(position, velocity, {
      color: materialColors[material] || materialColors.rock,
      size: 0.02 + Math.random() * 0.08,
      lifetime: 10 + Math.random() * 10,
      opacity: 0.8,
      originalSize: 0.02 + Math.random() * 0.08
    });
  }
}

/**
 * Dust Plume System
 */
export class DustPlumeSystem extends ParticleSystemBase {
  constructor(options = {}) {
    super({
      maxParticles: 3000,
      emissionRate: 800,
      lifetime: 20,
      gravity: new THREE.Vector3(0, -0.5, 0),
      ...options
    });
    
    this.thermalDrafts = [];
    this.initializeThermalDrafts();
  }
  
  initializeThermalDrafts() {
    // Create thermal updrafts around impact site
    for (let i = 0; i < 5; i++) {
      this.thermalDrafts.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          0,
          (Math.random() - 0.5) * 10
        ),
        strength: 2 + Math.random() * 3,
        radius: 2 + Math.random() * 3
      });
    }
  }
  
  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.3 }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          // Soft, cloudy appearance
          float alpha = 1.0 - distance * 2.0;
          alpha = pow(alpha, 3.0);
          
          // Add noise for volume
          float noise = sin(time * 2.0 + gl_FragCoord.x * 0.1) * 0.1 + 0.9;
          
          gl_FragColor = vec4(vColor, vOpacity * alpha * noise * opacity);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
  }
  
  updateParticleSpecific(particle, deltaTime, lifeRatio) {
    // Apply thermal updrafts
    this.thermalDrafts.forEach(draft => {
      const distance = particle.position.distanceTo(draft.position);
      if (distance < draft.radius) {
        const strength = (1 - distance / draft.radius) * draft.strength;
        const updraft = new THREE.Vector3(0, strength * deltaTime, 0);
        particle.velocity.add(updraft);
      }
    });
    
    // Brownian motion for dust particles
    const brownian = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    );
    particle.velocity.add(brownian);
    
    // Size growth as particles clump
    particle.size *= 1 + deltaTime * 0.1;
    
    // Density affects opacity
    particle.opacity = (1 - lifeRatio) * 0.3;
  }
}

/**
 * Shockwave System
 */
export class ShockwaveSystem extends ParticleSystemBase {
  constructor(options = {}) {
    super({
      maxParticles: 100,
      emissionRate: 50,
      lifetime: 5,
      gravity: new THREE.Vector3(0, 0, 0), // No gravity for shockwaves
      ...options
    });
    
    this.shockwaveSpeed = 100; // Unrealistically slow for visibility
    this.rings = [];
  }
  
  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          vUv = uv;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          
          // Ring pattern
          float ring = abs(distance - 0.3) < 0.1 ? 1.0 : 0.0;
          float alpha = ring * vOpacity;
          
          // Pulse effect
          alpha *= 0.5 + 0.5 * sin(time * 10.0);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
  
  createShockwave(center, energy) {
    const ring = {
      center: center.clone(),
      radius: 0,
      maxRadius: Math.pow(energy / 1e15, 1/3) * 10,
      speed: this.shockwaveSpeed,
      energy: energy,
      startTime: Date.now()
    };
    
    this.rings.push(ring);
  }
  
  update(deltaTime) {
    // Update shockwave rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.radius += ring.speed * deltaTime;
      
      if (ring.radius >= ring.maxRadius) {
        this.rings.splice(i, 1);
        continue;
      }
      
      // Emit particles along the ring
      this.emitRingParticles(ring);
    }
    
    super.update(deltaTime);
    
    if (this.material.uniforms) {
      this.material.uniforms.time.value += deltaTime;
    }
  }
  
  emitRingParticles(ring) {
    const particleCount = Math.floor(ring.radius * 10);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const position = new THREE.Vector3(
        ring.center.x + Math.cos(angle) * ring.radius,
        ring.center.y,
        ring.center.z + Math.sin(angle) * ring.radius
      );
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * ring.speed * 0.1,
        0,
        Math.sin(angle) * ring.speed * 0.1
      );
      
      this.emitParticle(position, velocity, {
        color: new THREE.Color(1, 0.5, 0),
        size: 0.2,
        lifetime: 1,
        opacity: 0.8
      });
    }
  }
}
