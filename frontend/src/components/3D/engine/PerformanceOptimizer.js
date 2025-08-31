import * as THREE from 'three';

/**
 * Performance Optimization System for 3D Asteroid Impact Simulation
 * Implements LOD, object pooling, frustum culling, and dynamic quality adjustment
 */

/**
 * Level of Detail (LOD) Manager
 * Automatically adjusts geometry complexity based on distance and performance
 */
class LODManager {
  constructor(camera) {
    this.camera = camera;
    this.lodObjects = new Map();
    this.performanceMonitor = new PerformanceMonitor();
    
    // LOD distance thresholds
    this.distances = {
      high: 5,
      medium: 15,
      low: 50
    };
    
    // Quality multipliers
    this.qualityLevels = {
      high: { geometry: 1.0, particles: 1.0, effects: 1.0 },
      medium: { geometry: 0.6, particles: 0.7, effects: 0.8 },
      low: { geometry: 0.3, particles: 0.4, effects: 0.5 }
    };
    
    this.currentQuality = 'high';
    this.autoAdjust = true;
  }
  
  /**
   * Register an object for LOD management
   */
  registerObject(object, lodLevels) {
    const lodData = {
      object: object,
      levels: lodLevels, // { high: geometry, medium: geometry, low: geometry }
      currentLevel: 'high',
      distance: 0
    };
    
    this.lodObjects.set(object.uuid, lodData);
  }
  
  /**
   * Update LOD for all registered objects
   */
  update() {
    if (!this.camera) return;
    
    this.performanceMonitor.startFrame();
    
    const cameraPosition = this.camera.position;
    
    this.lodObjects.forEach((lodData, uuid) => {
      const object = lodData.object;
      const distance = cameraPosition.distanceTo(object.position);
      lodData.distance = distance;
      
      // Determine appropriate LOD level
      let targetLevel = 'low';
      if (distance < this.distances.high) {
        targetLevel = 'high';
      } else if (distance < this.distances.medium) {
        targetLevel = 'medium';
      }
      
      // Apply quality adjustment
      if (this.autoAdjust) {
        targetLevel = this.adjustForPerformance(targetLevel);
      }
      
      // Update geometry if level changed
      if (lodData.currentLevel !== targetLevel) {
        this.switchLOD(lodData, targetLevel);
      }
    });
    
    this.performanceMonitor.endFrame();
    
    // Auto-adjust quality if needed
    if (this.autoAdjust) {
      this.autoAdjustQuality();
    }
  }
  
  switchLOD(lodData, newLevel) {
    const newGeometry = lodData.levels[newLevel];
    if (newGeometry && lodData.object.geometry !== newGeometry) {
      // Dispose old geometry if it's not shared
      if (lodData.object.geometry && lodData.object.geometry.userData.disposable) {
        lodData.object.geometry.dispose();
      }
      
      lodData.object.geometry = newGeometry;
      lodData.currentLevel = newLevel;
    }
  }
  
  adjustForPerformance(targetLevel) {
    const frameTime = this.performanceMonitor.getAverageFrameTime();
    const targetFrameTime = 16.67; // 60 FPS
    
    if (frameTime > targetFrameTime * 1.5) {
      // Performance too low, reduce quality
      if (targetLevel === 'high') return 'medium';
      if (targetLevel === 'medium') return 'low';
    } else if (frameTime < targetFrameTime * 0.8) {
      // Performance good, can increase quality
      if (targetLevel === 'low') return 'medium';
      if (targetLevel === 'medium') return 'high';
    }
    
    return targetLevel;
  }
  
  autoAdjustQuality() {
    const frameTime = this.performanceMonitor.getAverageFrameTime();
    const targetFrameTime = 16.67; // 60 FPS
    
    let newQuality = this.currentQuality;
    
    if (frameTime > targetFrameTime * 1.8) {
      newQuality = 'low';
    } else if (frameTime > targetFrameTime * 1.3) {
      newQuality = 'medium';
    } else if (frameTime < targetFrameTime * 0.7) {
      newQuality = 'high';
    }
    
    if (newQuality !== this.currentQuality) {
      this.setQuality(newQuality);
    }
  }
  
  setQuality(quality) {
    this.currentQuality = quality;
    const qualityData = this.qualityLevels[quality];
    
    // Dispatch quality change event
    window.dispatchEvent(new CustomEvent('lodQualityChange', {
      detail: { quality, multipliers: qualityData }
    }));
  }
  
  getQuality() {
    return this.currentQuality;
  }
  
  setAutoAdjust(enabled) {
    this.autoAdjust = enabled;
  }
  
  dispose() {
    this.lodObjects.clear();
  }
}

/**
 * Object Pool Manager
 * Reuses objects to reduce garbage collection and improve performance
 */
class ObjectPoolManager {
  constructor() {
    this.pools = new Map();
  }
  
  /**
   * Create a new object pool
   */
  createPool(name, factory, initialSize = 50) {
    const pool = {
      factory: factory,
      available: [],
      inUse: new Set(),
      totalCreated: 0
    };
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.poolName = name;
      obj.pooled = true;
      pool.available.push(obj);
      pool.totalCreated++;
    }
    
    this.pools.set(name, pool);
    return pool;
  }
  
  /**
   * Get an object from the pool
   */
  acquire(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      console.warn('Pool not found:', poolName);
      return null;
    }
    
    let obj;
    if (pool.available.length > 0) {
      obj = pool.available.pop();
    } else {
      // Create new object if pool is empty
      obj = pool.factory();
      obj.poolName = poolName;
      obj.pooled = true;
      pool.totalCreated++;
    }
    
    pool.inUse.add(obj);
    obj.inPool = false;
    
    // Reset object to default state
    if (obj.reset) {
      obj.reset();
    }
    
    return obj;
  }
  
  /**
   * Return an object to the pool
   */
  release(obj) {
    if (!obj || !obj.pooled) return;
    
    const pool = this.pools.get(obj.poolName);
    if (!pool) return;
    
    if (pool.inUse.has(obj)) {
      pool.inUse.delete(obj);
      pool.available.push(obj);
      obj.inPool = true;
      
      // Call cleanup if available
      if (obj.cleanup) {
        obj.cleanup();
      }
    }
  }
  
  /**
   * Get pool statistics
   */
  getStats(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) return null;
    
    return {
      available: pool.available.length,
      inUse: pool.inUse.size,
      total: pool.totalCreated,
      utilization: pool.inUse.size / pool.totalCreated
    };
  }
  
  /**
   * Clear a pool and dispose of all objects
   */
  clearPool(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) return;
    
    // Dispose available objects
    pool.available.forEach(obj => {
      if (obj.dispose) {
        obj.dispose();
      }
    });
    
    // Warn about in-use objects
    if (pool.inUse.size > 0) {
      console.warn(`Clearing pool ${poolName} with ${pool.inUse.size} objects still in use`);
    }
    
    pool.available = [];
    pool.inUse.clear();
    pool.totalCreated = 0;
  }
  
  dispose() {
    this.pools.forEach((pool, name) => {
      this.clearPool(name);
    });
    this.pools.clear();
  }
}

/**
 * Frustum Culling Manager
 * Hides objects outside the camera view for better performance
 */
class FrustumCullingManager {
  constructor(camera) {
    this.camera = camera;
    this.frustum = new THREE.Frustum();
    this.matrix = new THREE.Matrix4();
    this.cullableObjects = new Set();
    
    this.stats = {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0
    };
  }
  
  /**
   * Register an object for frustum culling
   */
  registerObject(object) {
    this.cullableObjects.add(object);
    object.frustumCulled = false; // We handle this manually
  }
  
  /**
   * Unregister an object
   */
  unregisterObject(object) {
    this.cullableObjects.delete(object);
  }
  
  /**
   * Update frustum culling for all registered objects
   */
  update() {
    if (!this.camera) return;
    
    // Update frustum from camera
    this.matrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.matrix);
    
    this.stats.totalObjects = this.cullableObjects.size;
    this.stats.visibleObjects = 0;
    this.stats.culledObjects = 0;
    
    this.cullableObjects.forEach(object => {
      if (!object.geometry || !object.geometry.boundingSphere) {
        object.geometry?.computeBoundingSphere();
      }
      
      const boundingSphere = object.geometry?.boundingSphere;
      if (boundingSphere) {
        // Transform bounding sphere to world space
        const center = boundingSphere.center.clone();
        object.localToWorld(center);
        const radius = boundingSphere.radius * object.scale.length();
        
        const sphere = new THREE.Sphere(center, radius);
        const isVisible = this.frustum.intersectsSphere(sphere);
        
        object.visible = isVisible;
        
        if (isVisible) {
          this.stats.visibleObjects++;
        } else {
          this.stats.culledObjects++;
        }
      } else {
        // Fallback: always visible if no bounding sphere
        object.visible = true;
        this.stats.visibleObjects++;
      }
    });
  }
  
  /**
   * Get culling statistics
   */
  getStats() {
    return { ...this.stats };
  }
  
  dispose() {
    this.cullableObjects.clear();
  }
}

/**
 * Performance Monitor
 * Tracks frame times and provides performance metrics
 */
class PerformanceMonitor {
  constructor(sampleSize = 60) {
    this.sampleSize = sampleSize;
    this.frameTimes = [];
    this.frameStart = 0;
    this.frameEnd = 0;
    
    // Performance thresholds (milliseconds)
    this.thresholds = {
      excellent: 8.33,  // 120 FPS
      good: 16.67,      // 60 FPS
      acceptable: 33.33, // 30 FPS
      poor: 66.67       // 15 FPS
    };
  }
  
  startFrame() {
    this.frameStart = performance.now();
  }
  
  endFrame() {
    this.frameEnd = performance.now();
    const frameTime = this.frameEnd - this.frameStart;
    
    this.frameTimes.push(frameTime);
    
    // Keep only recent samples
    if (this.frameTimes.length > this.sampleSize) {
      this.frameTimes.shift();
    }
  }
  
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
  
  getAverageFPS() {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
  
  getPerformanceLevel() {
    const avgFrameTime = this.getAverageFrameTime();
    
    if (avgFrameTime <= this.thresholds.excellent) return 'excellent';
    if (avgFrameTime <= this.thresholds.good) return 'good';
    if (avgFrameTime <= this.thresholds.acceptable) return 'acceptable';
    return 'poor';
  }
  
  getStats() {
    return {
      averageFrameTime: this.getAverageFrameTime(),
      averageFPS: this.getAverageFPS(),
      performanceLevel: this.getPerformanceLevel(),
      sampleCount: this.frameTimes.length
    };
  }
  
  reset() {
    this.frameTimes = [];
  }
}

/**
 * Instanced Rendering Manager
 * Efficiently renders many similar objects using instanced rendering
 */
class InstancedRenderingManager {
  constructor() {
    this.instancedMeshes = new Map();
  }
  
  /**
   * Create an instanced mesh for rendering many similar objects
   */
  createInstancedMesh(name, geometry, material, maxInstances) {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    const instanceData = {
      mesh: instancedMesh,
      count: 0,
      maxInstances: maxInstances,
      matrices: [],
      colors: [],
      customData: []
    };
    
    this.instancedMeshes.set(name, instanceData);
    return instancedMesh;
  }
  
  /**
   * Add an instance to the instanced mesh
   */
  addInstance(name, matrix, color = null, customData = null) {
    const instanceData = this.instancedMeshes.get(name);
    if (!instanceData || instanceData.count >= instanceData.maxInstances) {
      return -1; // Cannot add more instances
    }
    
    const index = instanceData.count;
    instanceData.mesh.setMatrixAt(index, matrix);
    
    if (color) {
      instanceData.mesh.setColorAt(index, color);
    }
    
    instanceData.matrices[index] = matrix.clone();
    instanceData.colors[index] = color ? color.clone() : null;
    instanceData.customData[index] = customData;
    
    instanceData.count++;
    instanceData.mesh.count = instanceData.count;
    
    return index;
  }
  
  /**
   * Update an instance
   */
  updateInstance(name, index, matrix, color = null) {
    const instanceData = this.instancedMeshes.get(name);
    if (!instanceData || index >= instanceData.count) {
      return false;
    }
    
    instanceData.mesh.setMatrixAt(index, matrix);
    instanceData.matrices[index] = matrix.clone();
    
    if (color) {
      instanceData.mesh.setColorAt(index, color);
      instanceData.colors[index] = color.clone();
    }
    
    instanceData.mesh.instanceMatrix.needsUpdate = true;
    if (color && instanceData.mesh.instanceColor) {
      instanceData.mesh.instanceColor.needsUpdate = true;
    }
    
    return true;
  }
  
  /**
   * Remove an instance (by swapping with last and reducing count)
   */
  removeInstance(name, index) {
    const instanceData = this.instancedMeshes.get(name);
    if (!instanceData || index >= instanceData.count) {
      return false;
    }
    
    const lastIndex = instanceData.count - 1;
    
    if (index !== lastIndex) {
      // Swap with last instance
      const lastMatrix = instanceData.matrices[lastIndex];
      const lastColor = instanceData.colors[lastIndex];
      const lastCustomData = instanceData.customData[lastIndex];
      
      instanceData.mesh.setMatrixAt(index, lastMatrix);
      if (lastColor) {
        instanceData.mesh.setColorAt(index, lastColor);
      }
      
      instanceData.matrices[index] = lastMatrix;
      instanceData.colors[index] = lastColor;
      instanceData.customData[index] = lastCustomData;
    }
    
    instanceData.count--;
    instanceData.mesh.count = instanceData.count;
    instanceData.mesh.instanceMatrix.needsUpdate = true;
    
    return true;
  }
  
  /**
   * Clear all instances
   */
  clearInstances(name) {
    const instanceData = this.instancedMeshes.get(name);
    if (!instanceData) return;
    
    instanceData.count = 0;
    instanceData.mesh.count = 0;
    instanceData.matrices = [];
    instanceData.colors = [];
    instanceData.customData = [];
  }
  
  /**
   * Get instance data
   */
  getInstanceData(name) {
    return this.instancedMeshes.get(name);
  }
  
  dispose() {
    this.instancedMeshes.forEach((instanceData, name) => {
      if (instanceData.mesh.geometry) {
        instanceData.mesh.geometry.dispose();
      }
      if (instanceData.mesh.material) {
        instanceData.mesh.material.dispose();
      }
    });
    this.instancedMeshes.clear();
  }
}

/**
 * Texture Manager
 * Efficiently manages texture loading and memory usage
 */
class TextureManager {
  constructor() {
    this.textures = new Map();
    this.loader = new THREE.TextureLoader();
    this.loading = new Map();
    
    // Default settings
    this.defaultSettings = {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearMipmapLinearFilter,
      generateMipmaps: true
    };
  }
  
  /**
   * Load a texture with caching
   */
  async loadTexture(url, settings = {}) {
    // Check cache first
    if (this.textures.has(url)) {
      return this.textures.get(url);
    }
    
    // Check if already loading
    if (this.loading.has(url)) {
      return this.loading.get(url);
    }
    
    // Start loading
    const loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Apply settings
          const finalSettings = { ...this.defaultSettings, ...settings };
          Object.keys(finalSettings).forEach(key => {
            texture[key] = finalSettings[key];
          });
          
          this.textures.set(url, texture);
          this.loading.delete(url);
          resolve(texture);
        },
        undefined,
        (error) => {
          this.loading.delete(url);
          reject(error);
        }
      );
    });
    
    this.loading.set(url, loadPromise);
    return loadPromise;
  }
  
  /**
   * Get a texture from cache
   */
  getTexture(url) {
    return this.textures.get(url);
  }
  
  /**
   * Dispose of a texture
   */
  disposeTexture(url) {
    const texture = this.textures.get(url);
    if (texture) {
      texture.dispose();
      this.textures.delete(url);
    }
  }
  
  /**
   * Get memory usage statistics
   */
  getMemoryUsage() {
    let totalMemory = 0;
    let textureCount = 0;
    
    this.textures.forEach(texture => {
      if (texture.image) {
        const width = texture.image.width || 0;
        const height = texture.image.height || 0;
        const channels = 4; // Assume RGBA
        totalMemory += width * height * channels;
        textureCount++;
      }
    });
    
    return {
      totalMemoryMB: totalMemory / (1024 * 1024),
      textureCount: textureCount
    };
  }
  
  dispose() {
    this.textures.forEach(texture => {
      texture.dispose();
    });
    this.textures.clear();
    this.loading.clear();
  }
}

/**
 * Main Performance Manager
 * Coordinates all performance optimization systems
 */
class PerformanceManager {
  constructor(renderer, camera, scene) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    
    // Initialize subsystems
    this.lodManager = new LODManager(camera);
    this.objectPool = new ObjectPoolManager();
    this.frustumCulling = new FrustumCullingManager(camera);
    this.performanceMonitor = new PerformanceMonitor();
    this.instancedRendering = new InstancedRenderingManager();
    this.textureManager = new TextureManager();
    
    // Settings
    this.enableLOD = true;
    this.enableFrustumCulling = true;
    this.enableInstancedRendering = true;
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    // Listen for quality changes
    window.addEventListener('lodQualityChange', (event) => {
      const { quality, multipliers } = event.detail;
      this.applyQualitySettings(quality, multipliers);
    });
  }
  
  applyQualitySettings(quality, multipliers) {
    // Adjust renderer settings
    const pixelRatio = window.devicePixelRatio;
    let renderPixelRatio;
    
    switch (quality) {
      case 'low':
        renderPixelRatio = Math.min(1, pixelRatio * 0.5);
        this.renderer.shadowMap.enabled = false;
        break;
      case 'medium':
        renderPixelRatio = Math.min(1.5, pixelRatio * 0.75);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'high':
        renderPixelRatio = pixelRatio;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
      default:
        renderPixelRatio = pixelRatio;
        break;
    }
    
    this.renderer.setPixelRatio(renderPixelRatio);
    
    // Dispatch event for other systems to respond
    window.dispatchEvent(new CustomEvent('performanceQualityChange', {
      detail: { quality, multipliers, pixelRatio: renderPixelRatio }
    }));
  }
  
  update() {
    this.performanceMonitor.startFrame();
    
    if (this.enableLOD) {
      this.lodManager.update();
    }
    
    if (this.enableFrustumCulling) {
      this.frustumCulling.update();
    }
    
    this.performanceMonitor.endFrame();
  }
  
  getStats() {
    return {
      performance: this.performanceMonitor.getStats(),
      lod: {
        quality: this.lodManager.getQuality(),
        objectCount: this.lodManager.lodObjects.size
      },
      frustumCulling: this.frustumCulling.getStats(),
      memory: this.textureManager.getMemoryUsage()
    };
  }
  
  dispose() {
    this.lodManager.dispose();
    this.objectPool.dispose();
    this.frustumCulling.dispose();
    this.instancedRendering.dispose();
    this.textureManager.dispose();
  }
}

export { 
  PerformanceManager,
  LODManager, 
  ObjectPoolManager, 
  FrustumCullingManager, 
  PerformanceMonitor, 
  InstancedRenderingManager, 
  TextureManager 
};
