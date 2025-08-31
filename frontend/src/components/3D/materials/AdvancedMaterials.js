import * as THREE from 'three';

/**
 * Advanced Materials and Shaders for Asteroid Impact Simulation
 * Physically-based rendering with realistic surface properties
 */

/**
 * Enhanced Earth Material with realistic atmosphere and surface details
 */
class EarthMaterial {
  constructor(options = {}) {
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    
    // Earth properties
    this.radius = options.radius || 1;
    this.atmosphereThickness = options.atmosphereThickness || 0.05;
    this.dayTexture = null;
    this.nightTexture = null;
    this.normalMap = null;
    this.specularMap = null;
    this.cloudsTexture = null;
    
    // Lighting
    this.sunDirection = new THREE.Vector3(1, 0.5, 0.5).normalize();
    
    this.createMaterials();
  }
  
  createMaterials() {
    // Main Earth surface material
    this.surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: this.createEarthDayTexture() },
        nightTexture: { value: this.createEarthNightTexture() },
        normalMap: { value: this.createEarthNormalMap() },
        specularMap: { value: this.createEarthSpecularMap() },
        sunDirection: { value: this.sunDirection },
        time: { value: 0 },
        atmosphereColor: { value: new THREE.Color(0.5, 0.7, 1.0) },
        oceanColor: { value: new THREE.Color(0.1, 0.3, 0.8) },
        landColor: { value: new THREE.Color(0.3, 0.6, 0.2) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vSunDirection;
        uniform vec3 sunDirection;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vSunDirection = normalize(viewMatrix * vec4(sunDirection, 0.0)).xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D normalMap;
        uniform sampler2D specularMap;
        uniform vec3 sunDirection;
        uniform float time;
        uniform vec3 atmosphereColor;
        uniform vec3 oceanColor;
        uniform vec3 landColor;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vSunDirection;
        
        void main() {
          // Sample textures
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec3 normalSample = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
          float specular = texture2D(specularMap, vUv).r;
          
          // Calculate lighting
          vec3 normal = normalize(vNormal + normalSample * 0.1);
          float sunDot = dot(normal, vSunDirection);
          float dayNightMix = smoothstep(-0.1, 0.1, sunDot);
          
          // Mix day and night
          vec3 color = mix(nightColor.rgb * 0.3, dayColor.rgb, dayNightMix);
          
          // Add specular highlights for oceans
          vec3 viewDirection = normalize(-vPosition);
          vec3 reflectDirection = reflect(-vSunDirection, normal);
          float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0);
          color += spec * specular * vec3(1.0, 1.0, 1.0) * 0.5;
          
          // Atmospheric rim lighting
          float rimFactor = 1.0 - dot(normal, viewDirection);
          vec3 rimColor = atmosphereColor * pow(rimFactor, 3.0) * 0.3;
          color += rimColor;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    // Atmosphere material
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: this.sunDirection },
        atmosphereColor: { value: new THREE.Color(0.5, 0.7, 1.0) },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 sunDirection;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform vec3 atmosphereColor;
        uniform float time;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDirection = normalize(-vPosition);
          float rimFactor = 1.0 - abs(dot(vNormal, viewDirection));
          
          // Rayleigh scattering approximation
          float scattering = pow(rimFactor, 2.0);
          vec3 color = atmosphereColor * scattering;
          
          // Add some variation based on sun position
          float sunAlignment = dot(vNormal, normalize(sunDirection));
          color *= 0.5 + 0.5 * (1.0 + sunAlignment);
          
          gl_FragColor = vec4(color, scattering * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    
    // Clouds material
    this.cloudsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        cloudsTexture: { value: this.createCloudsTexture() },
        time: { value: 0 },
        sunDirection: { value: this.sunDirection }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D cloudsTexture;
        uniform float time;
        uniform vec3 sunDirection;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Animated cloud movement
          vec2 cloudUv = vUv + vec2(time * 0.01, time * 0.005);
          float clouds = texture2D(cloudsTexture, cloudUv).r;
          
          // Lighting on clouds
          vec3 viewDirection = normalize(-vPosition);
          float sunDot = dot(vNormal, normalize(sunDirection));
          float lighting = 0.5 + 0.5 * sunDot;
          
          vec3 cloudColor = vec3(1.0, 1.0, 1.0) * lighting;
          float alpha = clouds * 0.8;
          
          gl_FragColor = vec4(cloudColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending
    });
  }
  
  // Create procedural textures (fallbacks for when real textures aren't available)
  createEarthDayTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Create gradient for day texture
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.3, '#228B22'); // Forest green
    gradient.addColorStop(0.7, '#8B4513'); // Saddle brown
    gradient.addColorStop(1, '#4682B4'); // Steel blue
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 512);
    
    // Add some continent-like shapes
    context.fillStyle = '#228B22';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radius = 20 + Math.random() * 80;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createEarthNightTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Dark base
    context.fillStyle = '#000511';
    context.fillRect(0, 0, 1024, 512);
    
    // Add city lights
    context.fillStyle = '#FFD700';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const size = 1 + Math.random() * 3;
      
      context.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createEarthNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create height variation for normal mapping
    const imageData = context.createImageData(512, 256);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const height = Math.random();
      data[i] = 128 + (height - 0.5) * 100;     // R (normal X)
      data[i + 1] = 128 + (height - 0.5) * 100; // G (normal Y)
      data[i + 2] = 255;                         // B (normal Z)
      data[i + 3] = 255;                         // A
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createEarthSpecularMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Oceans are highly specular, land is not
    context.fillStyle = '#444444'; // Default land
    context.fillRect(0, 0, 512, 256);
    
    // Add ocean areas (high specularity)
    context.fillStyle = '#FFFFFF';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const width = 50 + Math.random() * 100;
      const height = 30 + Math.random() * 60;
      
      context.fillRect(x, y, width, height);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createCloudsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create cloud-like noise pattern
    context.fillStyle = '#000000';
    context.fillRect(0, 0, 512, 256);
    
    context.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = 10 + Math.random() * 30;
      const alpha = 0.3 + Math.random() * 0.4;
      
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    context.globalAlpha = 1;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  update(time) {
    this.surfaceMaterial.uniforms.time.value = time;
    this.atmosphereMaterial.uniforms.time.value = time;
    this.cloudsMaterial.uniforms.time.value = time;
  }
  
  setSunDirection(direction) {
    this.sunDirection.copy(direction);
    this.surfaceMaterial.uniforms.sunDirection.value = this.sunDirection;
    this.atmosphereMaterial.uniforms.sunDirection.value = this.sunDirection;
    this.cloudsMaterial.uniforms.sunDirection.value = this.sunDirection;
  }
}

/**
 * Enhanced Asteroid Material with realistic surface features
 */
class AsteroidMaterial {
  constructor(options = {}) {
    this.asteroidType = options.type || 'rocky'; // rocky, metallic, icy
    this.weathering = options.weathering || 0.5; // 0 = fresh, 1 = heavily weathered
    this.size = options.size || 1;
    
    this.createMaterial();
  }
  
  createMaterial() {
    const materialProps = this.getMaterialProperties();
    
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        diffuseTexture: { value: this.createAsteroidTexture() },
        normalTexture: { value: this.createAsteroidNormalMap() },
        roughnessTexture: { value: this.createRoughnessMap() },
        time: { value: 0 },
        size: { value: this.size },
        weathering: { value: this.weathering },
        baseColor: { value: materialProps.color },
        metallic: { value: materialProps.metallic },
        roughness: { value: materialProps.roughness }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D diffuseTexture;
        uniform sampler2D normalTexture;
        uniform sampler2D roughnessTexture;
        uniform float time;
        uniform float size;
        uniform float weathering;
        uniform vec3 baseColor;
        uniform float metallic;
        uniform float roughness;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        // Simple PBR lighting calculation
        vec3 calculatePBR(vec3 albedo, vec3 normal, vec3 viewDir, vec3 lightDir, float metallic, float roughness) {
          vec3 halfVector = normalize(lightDir + viewDir);
          float NdotL = max(dot(normal, lightDir), 0.0);
          float NdotV = max(dot(normal, viewDir), 0.0);
          float NdotH = max(dot(normal, halfVector), 0.0);
          float VdotH = max(dot(viewDir, halfVector), 0.0);
          
          // Fresnel (Schlick approximation)
          vec3 F0 = mix(vec3(0.04), albedo, metallic);
          vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
          
          // Distribution (GGX)
          float alpha = roughness * roughness;
          float alpha2 = alpha * alpha;
          float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
          float D = alpha2 / (3.14159 * denom * denom);
          
          // Geometry
          float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
          float GL = NdotL / (NdotL * (1.0 - k) + k);
          float GV = NdotV / (NdotV * (1.0 - k) + k);
          float G = GL * GV;
          
          // Cook-Torrance BRDF
          vec3 numerator = D * G * F;
          float denominator = 4.0 * NdotV * NdotL + 0.001;
          vec3 specular = numerator / denominator;
          
          vec3 kS = F;
          vec3 kD = vec3(1.0) - kS;
          kD *= 1.0 - metallic;
          
          return (kD * albedo / 3.14159 + specular) * NdotL;
        }
        
        void main() {
          // Sample textures
          vec3 albedo = texture2D(diffuseTexture, vUv).rgb * baseColor;
          vec3 normalSample = texture2D(normalTexture, vUv).rgb * 2.0 - 1.0;
          float roughnessSample = texture2D(roughnessTexture, vUv).r;
          
          // Apply weathering
          albedo = mix(albedo, albedo * 0.5, weathering);
          float finalRoughness = mix(roughness, 1.0, weathering * 0.5);
          finalRoughness = mix(finalRoughness, roughnessSample, 0.5);
          
          // Calculate normal
          vec3 normal = normalize(vNormal + normalSample * 0.5);
          
          // Lighting setup
          vec3 viewDir = normalize(-vPosition);
          vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5)); // Main light
          
          // PBR calculation
          vec3 color = calculatePBR(albedo, normal, viewDir, lightDir, metallic, finalRoughness);
          
          // Add ambient
          color += albedo * 0.1;
          
          // Add subsurface scattering for ice
          if (metallic < 0.1 && roughness > 0.8) {
            float subsurface = pow(max(dot(-lightDir, viewDir), 0.0), 2.0);
            color += albedo * subsurface * 0.2;
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  }
  
  getMaterialProperties() {
    const properties = {
      rocky: {
        color: new THREE.Color(0.4, 0.3, 0.2),
        metallic: 0.0,
        roughness: 0.9
      },
      metallic: {
        color: new THREE.Color(0.6, 0.6, 0.7),
        metallic: 0.8,
        roughness: 0.3
      },
      icy: {
        color: new THREE.Color(0.8, 0.9, 1.0),
        metallic: 0.0,
        roughness: 0.1
      }
    };
    
    return properties[this.asteroidType] || properties.rocky;
  }
  
  createAsteroidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    const properties = this.getMaterialProperties();
    const baseColor = `rgb(${Math.floor(properties.color.r * 255)}, ${Math.floor(properties.color.g * 255)}, ${Math.floor(properties.color.b * 255)})`;
    
    // Base color
    context.fillStyle = baseColor;
    context.fillRect(0, 0, 512, 512);
    
    // Add surface details based on type
    switch (this.asteroidType) {
      case 'rocky':
        this.addRockyDetails(context);
        break;
      case 'metallic':
        this.addMetallicDetails(context);
        break;
      case 'icy':
        this.addIcyDetails(context);
        break;
      default:
        this.addRockyDetails(context);
        break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  addRockyDetails(context) {
    // Add craters and surface variation
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 10 + Math.random() * 40;
      
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    // Add mineral streaks
    context.strokeStyle = 'rgba(100, 80, 60, 0.3)';
    context.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      context.beginPath();
      context.moveTo(Math.random() * 512, Math.random() * 512);
      context.lineTo(Math.random() * 512, Math.random() * 512);
      context.stroke();
    }
  }
  
  addMetallicDetails(context) {
    // Add metallic streaks and oxidation
    context.fillStyle = 'rgba(120, 100, 80, 0.3)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const width = 5 + Math.random() * 20;
      const height = 2 + Math.random() * 8;
      
      context.fillRect(x, y, width, height);
    }
    
    // Add bright metallic spots
    context.fillStyle = 'rgba(200, 200, 220, 0.4)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 2 + Math.random() * 8;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  
  addIcyDetails(context) {
    // Add ice crystal patterns
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    
    for (let i = 0; i < 100; i++) {
      const centerX = Math.random() * 512;
      const centerY = Math.random() * 512;
      const size = 5 + Math.random() * 15;
      
      // Draw crystal pattern
      context.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * size;
        const y = centerY + Math.sin(angle) * size;
        
        if (j === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.stroke();
    }
    
    // Add bright ice patches
    context.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 10 + Math.random() * 30;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  
  createAsteroidNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Generate height-based normal map
    const imageData = context.createImageData(512, 512);
    const data = imageData.data;
    
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4;
        
        // Generate height based on noise (used for normal calculation)
        // const height = this.noise(x * 0.01, y * 0.01) * 0.5 + 
        //               this.noise(x * 0.02, y * 0.02) * 0.3 + 
        //               this.noise(x * 0.04, y * 0.04) * 0.2;
        
        // Calculate normal from height differences
        const heightL = this.noise((x - 1) * 0.01, y * 0.01);
        const heightR = this.noise((x + 1) * 0.01, y * 0.01);
        const heightD = this.noise(x * 0.01, (y - 1) * 0.01);
        const heightU = this.noise(x * 0.01, (y + 1) * 0.01);
        
        const normalX = (heightL - heightR) * 0.5 + 0.5;
        const normalY = (heightD - heightU) * 0.5 + 0.5;
        const normalZ = 1.0;
        
        data[i] = normalX * 255;
        data[i + 1] = normalY * 255;
        data[i + 2] = normalZ * 255;
        data[i + 3] = 255;
      }
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createRoughnessMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    const imageData = context.createImageData(256, 256);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const roughness = 0.5 + this.noise(i * 0.001, 0) * 0.5;
      const value = Math.floor(roughness * 255);
      
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  // Simple noise function for procedural generation
  noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  
  update(time) {
    this.material.uniforms.time.value = time;
  }
  
  setWeathering(weathering) {
    this.weathering = Math.max(0, Math.min(1, weathering));
    this.material.uniforms.weathering.value = this.weathering;
  }
}

/**
 * Impact Crater Material with dynamic formation
 */
class CraterMaterial {
  constructor(options = {}) {
    this.size = options.size || 1;
    this.depth = options.depth || 0.1;
    this.age = options.age || 0; // 0 = fresh, 1 = old
    
    this.createMaterial();
  }
  
  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        size: { value: this.size },
        depth: { value: this.depth },
        age: { value: this.age },
        craterTexture: { value: this.createCraterTexture() }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float size;
        uniform float depth;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          // Deform geometry for crater shape
          vec3 pos = position;
          float distanceFromCenter = length(uv - vec2(0.5));
          float craterDepth = smoothstep(0.0, 0.5, 1.0 - distanceFromCenter) * depth;
          pos.y -= craterDepth;
          
          vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D craterTexture;
        uniform float time;
        uniform float age;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vec3 craterColor = texture2D(craterTexture, vUv).rgb;
          
          // Lighting
          vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
          float NdotL = max(dot(vNormal, lightDir), 0.0);
          
          // Age affects color and roughness
          vec3 freshColor = vec3(0.2, 0.1, 0.05); // Dark, fresh impact
          vec3 agedColor = vec3(0.4, 0.3, 0.2);   // Weathered
          
          vec3 finalColor = mix(freshColor, agedColor, age);
          finalColor *= craterColor;
          finalColor *= (0.3 + 0.7 * NdotL);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
  }
  
  createCraterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create radial crater pattern
    const centerX = 128;
    const centerY = 128;
    
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const normalizedDistance = distance / 128;
        
        let intensity;
        if (normalizedDistance < 0.3) {
          // Inner crater - very dark
          intensity = 50;
        } else if (normalizedDistance < 0.7) {
          // Crater wall - medium
          intensity = 100 + (normalizedDistance - 0.3) * 200;
        } else if (normalizedDistance < 0.9) {
          // Crater rim - bright
          intensity = 200;
        } else {
          // Outside crater - normal
          intensity = 150;
        }
        
        // Add some noise
        intensity += (Math.random() - 0.5) * 50;
        intensity = Math.max(0, Math.min(255, intensity));
        
        // Note: This would be used for direct pixel manipulation if needed
        // const pixelIndex = (y * 256 + x) * 4;
        const imageData = context.getImageData(0, 0, 256, 256);
        if (!imageData.data.length) {
          context.putImageData(context.createImageData(256, 256), 0, 0);
        }
      }
    }
    
    // Fallback: create simple gradient
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#222222');
    gradient.addColorStop(0.3, '#444444');
    gradient.addColorStop(0.7, '#888888');
    gradient.addColorStop(0.9, '#CCCCCC');
    gradient.addColorStop(1, '#888888');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  update(time) {
    this.material.uniforms.time.value = time;
  }
  
  setAge(age) {
    this.age = Math.max(0, Math.min(1, age));
    this.material.uniforms.age.value = this.age;
  }
}

// Export all materials
export { EarthMaterial, AsteroidMaterial, CraterMaterial };

// Helper function to create a material based on object type
export function createMaterial(type, options = {}) {
  switch (type) {
    case 'earth':
      return new EarthMaterial(options);
    case 'asteroid':
      return new AsteroidMaterial(options);
    case 'crater':
      return new CraterMaterial(options);
    default:
      console.warn('Unknown material type:', type);
      return new THREE.MeshStandardMaterial({ color: 0x888888 });
  }
}
