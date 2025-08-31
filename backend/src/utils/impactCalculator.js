class ImpactCalculator {
  constructor() {
    // Physical constants
    this.EARTH_RADIUS = 6371000; // meters
    this.EARTH_SURFACE_GRAVITY = 9.81; // m/s²
    this.TYPICAL_ROCK_DENSITY = 2600; // kg/m³
    this.TYPICAL_ICE_DENSITY = 900; // kg/m³
  }

  /**
   * Calculate crater diameter using scaling laws
   * Based on USGS impact crater scaling
   * @param {number} energy - Impact energy in joules
   * @param {number} angle - Impact angle in degrees (90 = vertical)
   * @param {string} targetType - 'land' or 'water'
   * @returns {number} Crater diameter in meters
   */
  calculateCraterDiameter(energy, angle = 45, targetType = 'land') {
    // Scaling factor based on target type
    const scalingFactor = targetType === 'water' ? 0.8 : 1.0;
    
    // Angle correction (vertical impact = 1.0, oblique impacts are less efficient)
    const angleCorrection = Math.sin(angle * Math.PI / 180) ** 0.5;
    
    // Crater scaling law: D = k * E^0.33
    // k varies based on target material (0.01-0.02 for typical rock)
    const k = targetType === 'water' ? 0.015 : 0.012;
    
    const diameter = k * Math.pow(energy, 0.33) * scalingFactor * angleCorrection;
    return Math.max(diameter, 1); // Minimum 1 meter
  }

  /**
   * Calculate crater depth
   * @param {number} diameter - Crater diameter in meters
   * @param {string} targetType - 'land' or 'water'
   * @returns {number} Crater depth in meters
   */
  calculateCraterDepth(diameter, targetType = 'land') {
    // Depth-to-diameter ratio varies by crater size and target
    const depthRatio = targetType === 'water' ? 0.1 : 0.2;
    return diameter * depthRatio;
  }

  /**
   * Calculate blast damage radii
   * @param {number} energy - Impact energy in joules
   * @returns {object} Damage radii in kilometers
   */
  calculateBlastRadii(energy) {
    // Convert energy to equivalent TNT (1 J ≈ 2.39e-10 tons TNT)
    const tntEquivalent = energy * 2.39e-10; // tons of TNT
    
    // Scaling laws for blast damage (empirical formulas)
    const noSurvivors = 0.001 * Math.pow(tntEquivalent, 0.33); // km
    const heavyDamage = 0.003 * Math.pow(tntEquivalent, 0.33); // km
    const moderateDamage = 0.01 * Math.pow(tntEquivalent, 0.33); // km
    const lightDamage = 0.03 * Math.pow(tntEquivalent, 0.33); // km

    return {
      noSurvivors: Math.max(noSurvivors, 0.001),
      heavyDamage: Math.max(heavyDamage, 0.005),
      moderateDamage: Math.max(moderateDamage, 0.01),
      lightDamage: Math.max(lightDamage, 0.05)
    };
  }

  /**
   * Calculate seismic magnitude
   * @param {number} energy - Impact energy in joules
   * @returns {number} Richter scale magnitude
   */
  calculateSeismicMagnitude(energy) {
    // Empirical relationship: M = (log10(E) - 4.8) / 1.5
    // Where E is in joules
    const magnitude = (Math.log10(energy) - 4.8) / 1.5;
    return Math.max(Math.min(magnitude, 10), 0); // Clamp between 0-10
  }

  /**
   * Calculate tsunami height (for ocean impacts)
   * @param {number} energy - Impact energy in joules
   * @param {number} waterDepth - Water depth in meters
   * @returns {number} Tsunami height in meters
   */
  calculateTsunamiHeight(energy, waterDepth = 4000) {
    if (waterDepth < 100) return 0; // Too shallow for significant tsunami
    
    // Simplified tsunami scaling
    const tntEquivalent = energy * 2.39e-10;
    const baseHeight = 0.1 * Math.pow(tntEquivalent, 0.25);
    
    // Depth factor (deeper water = higher tsunamis)
    const depthFactor = Math.min(waterDepth / 1000, 5);
    
    return baseHeight * depthFactor;
  }

  /**
   * Calculate environmental effects
   * @param {number} energy - Impact energy in joules
   * @param {number} diameter - Asteroid diameter in meters
   * @returns {object} Environmental effects
   */
  calculateEnvironmentalEffects(energy, diameter) {
    const tntEquivalent = energy * 2.39e-10;
    
    // Dust cloud radius (km)
    const dustCloudRadius = 5 * Math.pow(tntEquivalent, 0.2);
    
    // Temperature drop (depends on dust injection into atmosphere)
    const dustMass = Math.pow(diameter / 1000, 3) * 1e12; // rough estimate
    const temperatureDrop = Math.min(dustMass / 1e15 * 2, 10); // max 10°C drop
    
    // Duration of effects (days)
    const durationDays = Math.min(Math.pow(diameter / 100, 1.5), 365);

    return {
      dustCloudRadius: Math.max(dustCloudRadius, 1),
      temperatureDrop: Math.max(temperatureDrop, 0.1),
      durationDays: Math.max(durationDays, 1)
    };
  }

  /**
   * Estimate population effects
   * @param {number} blastRadii - Blast damage radii object
   * @param {number} latitude - Impact latitude
   * @param {number} longitude - Impact longitude
   * @returns {object} Population effects estimates
   */
  estimatePopulationEffects(blastRadii, latitude, longitude) {
    // Simplified population density estimation
    // In a real app, you'd use actual population data APIs
    
    // Average global population density: ~60 people/km²
    // Urban areas: ~1000-10000 people/km²
    // Rural areas: ~10-100 people/km²
    
    const isUrban = this.isUrbanArea(latitude, longitude);
    const populationDensity = isUrban ? 5000 : 50; // people per km²
    
    const heavyDamageArea = Math.PI * Math.pow(blastRadii.heavyDamage, 2);
    const moderateDamageArea = Math.PI * Math.pow(blastRadii.moderateDamage, 2);
    const lightDamageArea = Math.PI * Math.pow(blastRadii.lightDamage, 2);
    
    const estimatedCasualties = heavyDamageArea * populationDensity * 0.8; // 80% casualty rate in heavy damage zone
    const affectedPopulation = lightDamageArea * populationDensity;
    const evacuationRadius = blastRadii.lightDamage * 2; // Evacuation zone is larger
    
    return {
      estimatedCasualties: Math.round(estimatedCasualties),
      affectedPopulation: Math.round(affectedPopulation),
      evacuationRadius: evacuationRadius
    };
  }

  /**
   * Estimate economic impact
   * @param {number} blastRadii - Blast damage radii object
   * @param {number} latitude - Impact latitude
   * @param {number} longitude - Impact longitude
   * @returns {object} Economic impact estimates
   */
  estimateEconomicImpact(blastRadii, latitude, longitude) {
    const isUrban = this.isUrbanArea(latitude, longitude);
    const isDeveloped = this.isDevelopedCountry(latitude, longitude);
    
    // Economic density (USD per km²)
    let economicDensity = 1000000; // Base: $1M per km²
    if (isUrban) economicDensity *= 50;
    if (isDeveloped) economicDensity *= 10;
    
    const heavyDamageArea = Math.PI * Math.pow(blastRadii.heavyDamage, 2);
    const moderateDamageArea = Math.PI * Math.pow(blastRadii.moderateDamage, 2);
    const lightDamageArea = Math.PI * Math.pow(blastRadii.lightDamage, 2);
    
    const totalDamage = 
      (heavyDamageArea * economicDensity * 0.9) +
      (moderateDamageArea * economicDensity * 0.5) +
      (lightDamageArea * economicDensity * 0.1);
    
    const affectedInfrastructure = [];
    if (blastRadii.heavyDamage > 1) affectedInfrastructure.push('Buildings', 'Roads');
    if (blastRadii.heavyDamage > 5) affectedInfrastructure.push('Power Grid', 'Water Supply');
    if (blastRadii.heavyDamage > 10) affectedInfrastructure.push('Airports', 'Hospitals');
    if (blastRadii.heavyDamage > 50) affectedInfrastructure.push('Regional Infrastructure');
    
    return {
      estimatedDamage: Math.round(totalDamage),
      affectedInfrastructure
    };
  }

  /**
   * Run detailed impact simulation with custom parameters
   * @param {object} params - Simulation parameters
   * @returns {object} Complete simulation results
   */
  runDetailedSimulation(params) {
    const { asteroid, impactLocation, impactAngle = 45, impactVelocity = 20 } = params;
    const { lat: latitude, lng: longitude } = impactLocation;
    
    // Calculate asteroid properties
    const diameter = asteroid.estimatedDiameter?.kilometers?.estimated_diameter_max || 1; // km
    const diameterMeters = diameter * 1000; // Convert to meters
    const mass = (4/3) * Math.PI * Math.pow(diameterMeters/2, 3) * this.TYPICAL_ROCK_DENSITY; // kg
    const velocity = impactVelocity * 1000; // Convert km/s to m/s
    
    // Calculate kinetic energy: E = 0.5 * m * v²
    const energy = 0.5 * mass * Math.pow(velocity, 2); // Joules
    const tntEquivalent = energy * 2.39e-10; // tons of TNT
    
    // Determine if impact is on land or water
    const targetType = this.isWaterImpact(latitude, longitude) ? 'water' : 'land';
    
    // Calculate crater properties
    const craterDiameter = this.calculateCraterDiameter(energy, impactAngle, targetType) / 1000; // Convert to km
    const craterDepth = this.calculateCraterDepth(craterDiameter * 1000, targetType) / 1000; // Convert to km
    
    // Calculate blast effects
    const blastRadius = this.calculateBlastRadii(energy);
    
    // Calculate affected area (km²)
    const affectedArea = Math.PI * Math.pow(blastRadius.lightDamage, 2);
    
    // Calculate other effects
    const seismicMagnitude = this.calculateSeismicMagnitude(energy);
    const tsunamiHeight = targetType === 'water' ? 
      this.calculateTsunamiHeight(energy) : 0;
    
    const environmentalEffects = this.calculateEnvironmentalEffects(energy, diameterMeters);
    const populationEffects = this.estimatePopulationEffects(blastRadius, latitude, longitude);
    const economicImpact = this.estimateEconomicImpact(blastRadius, latitude, longitude);
    
    // Determine severity
    const severity = this.calculateSeverity(energy, craterDiameter, populationEffects.estimatedCasualties);
    
    // Generate mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(energy, severity, targetType);
    
    return {
      energy,
      tntEquivalent,
      craterDiameter,
      craterDepth,
      affectedArea,
      estimatedCasualties: populationEffects.estimatedCasualties,
      economicImpact: economicImpact.estimatedDamage,
      severity,
      mitigationStrategies,
      detailedEffects: {
        blastRadius,
        seismicMagnitude,
        tsunamiHeight,
        environmentalEffects,
        populationEffects,
        economicImpact,
        targetType
      }
    };
  }

  /**
   * Calculate impact severity
   * @param {number} energy - Impact energy in joules
   * @param {number} craterDiameter - Crater diameter in km
   * @param {number} casualties - Estimated casualties
   * @returns {string} Severity level
   */
  calculateSeverity(energy, craterDiameter, casualties) {
    const tntEquivalent = energy * 2.39e-10;
    
    if (tntEquivalent > 1e12 || craterDiameter > 100 || casualties > 1e7) {
      return 'catastrophic';
    } else if (tntEquivalent > 1e9 || craterDiameter > 10 || casualties > 1e5) {
      return 'severe';
    } else if (tntEquivalent > 1e6 || craterDiameter > 1 || casualties > 1e3) {
      return 'moderate';
    } else {
      return 'minor';
    }
  }

  /**
   * Generate mitigation strategies based on impact parameters
   * @param {number} energy - Impact energy in joules
   * @param {string} severity - Impact severity
   * @param {string} targetType - Target type (land/water)
   * @returns {array} Array of mitigation strategies
   */
  generateMitigationStrategies(energy, severity, targetType) {
    const strategies = [];
    const tntEquivalent = energy * 2.39e-10;
    
    // Always include evacuation
    strategies.push("Immediate evacuation of the impact zone and surrounding areas");
    
    if (severity === 'minor' || severity === 'moderate') {
      strategies.push("Deploy emergency response teams to affected areas");
      strategies.push("Establish temporary shelters and medical facilities");
      strategies.push("Coordinate international humanitarian aid");
    }
    
    if (severity === 'severe') {
      strategies.push("Activate national emergency protocols");
      strategies.push("Deploy military resources for search and rescue operations");
      strategies.push("Implement regional communication networks backup");
      strategies.push("Coordinate with international space agencies for debris tracking");
    }
    
    if (severity === 'catastrophic') {
      strategies.push("Implement global emergency response protocols");
      strategies.push("Activate international space defense systems");
      strategies.push("Coordinate worldwide resource allocation");
      strategies.push("Establish alternative global communication networks");
      strategies.push("Implement climate monitoring and agricultural protection measures");
    }
    
    if (targetType === 'water') {
      strategies.push("Issue tsunami warnings for coastal areas");
      strategies.push("Evacuate coastal regions within 1000km radius");
    } else {
      strategies.push("Monitor seismic activity and potential landslides");
      strategies.push("Protect critical infrastructure and data centers");
    }
    
    if (tntEquivalent > 1e6) {
      strategies.push("Monitor atmospheric dust and temperature changes");
      strategies.push("Secure food and water supplies for extended periods");
    }
    
    return strategies;
  }

  /**
   * Run complete impact simulation
   * @param {object} asteroid - Asteroid data
   * @param {object} location - Impact location
   * @param {number} angle - Impact angle
   * @returns {object} Complete simulation results
   */
  runSimulation(asteroid, location, angle = 45) {
    const { latitude, longitude } = location;
    const energy = asteroid.calculatedProperties.kineticEnergy;
    const diameter = asteroid.calculatedProperties.averageDiameter;
    
    // Determine if impact is on land or water
    const targetType = this.isWaterImpact(latitude, longitude) ? 'water' : 'land';
    
    // Calculate crater properties
    const craterDiameter = this.calculateCraterDiameter(energy, angle, targetType);
    const craterDepth = this.calculateCraterDepth(craterDiameter, targetType);
    
    // Calculate blast effects
    const blastRadius = this.calculateBlastRadii(energy);
    
    // Calculate other effects
    const seismicMagnitude = this.calculateSeismicMagnitude(energy);
    const tsunamiHeight = targetType === 'water' ? 
      this.calculateTsunamiHeight(energy) : 0;
    
    const environmentalEffects = this.calculateEnvironmentalEffects(energy, diameter);
    const populationEffects = this.estimatePopulationEffects(blastRadius, latitude, longitude);
    const economicImpact = this.estimateEconomicImpact(blastRadius, latitude, longitude);
    
    return {
      craterDiameter,
      craterDepth,
      blastRadius,
      seismicMagnitude,
      tsunamiHeight,
      environmentalEffects,
      populationEffects,
      economicImpact
    };
  }

  /**
   * Apply mitigation strategy effects
   * @param {object} results - Original simulation results
   * @param {object} mitigation - Mitigation strategy
   * @returns {object} Modified results
   */
  applyMitigation(results, mitigation) {
    if (!mitigation || mitigation.method === 'none') {
      return results;
    }
    
    const effectiveness = mitigation.effectivenessReduction || 0;
    const reductionFactor = 1 - (effectiveness / 100);
    
    // Apply reduction to all damage metrics
    const mitigatedResults = JSON.parse(JSON.stringify(results)); // Deep copy
    
    if (mitigation.method !== 'evacuation_only') {
      mitigatedResults.craterDiameter *= reductionFactor;
      mitigatedResults.craterDepth *= reductionFactor;
      mitigatedResults.blastRadius.noSurvivors *= reductionFactor;
      mitigatedResults.blastRadius.heavyDamage *= reductionFactor;
      mitigatedResults.blastRadius.moderateDamage *= reductionFactor;
      mitigatedResults.blastRadius.lightDamage *= reductionFactor;
      mitigatedResults.seismicMagnitude *= reductionFactor;
      mitigatedResults.tsunamiHeight *= reductionFactor;
    }
    
    // Evacuation reduces casualties but not physical damage
    if (mitigation.method === 'evacuation_only' || effectiveness > 0) {
      mitigatedResults.populationEffects.estimatedCasualties *= (reductionFactor * 0.1);
    }
    
    return mitigatedResults;
  }

  // Helper methods
  isWaterImpact(latitude, longitude) {
    // Simplified ocean detection (in a real app, use actual geographic data)
    // This is a very rough approximation
    const landMasses = [
      { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180, isLand: false }, // Default to water
      { minLat: -60, maxLat: 85, minLng: -170, maxLng: 30, isLand: true }, // Major landmasses approximation
    ];
    
    // For demo purposes, assume 70% of Earth is water
    return Math.random() < 0.7; // Simplified random assignment
  }

  isUrbanArea(latitude, longitude) {
    // Simplified urban area detection
    // In a real app, use actual urban area datasets
    return Math.random() < 0.3; // ~30% chance of urban area
  }

  isDevelopedCountry(latitude, longitude) {
    // Simplified developed country detection
    // In a real app, use actual country economic data
    return Math.random() < 0.5; // ~50% chance of developed area
  }
}

module.exports = new ImpactCalculator();
