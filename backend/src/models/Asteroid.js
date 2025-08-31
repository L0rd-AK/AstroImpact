const mongoose = require('mongoose');

const asteroidSchema = new mongoose.Schema({
  neo_reference_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  nasa_jpl_url: String,
  absolute_magnitude_h: Number,
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: Number,
      estimated_diameter_max: Number
    },
    meters: {
      estimated_diameter_min: Number,
      estimated_diameter_max: Number
    }
  },
  is_potentially_hazardous_asteroid: Boolean,
  close_approach_data: [{
    close_approach_date: String,
    close_approach_date_full: String,
    epoch_date_close_approach: Number,
    relative_velocity: {
      kilometers_per_second: String,
      kilometers_per_hour: String,
      miles_per_hour: String
    },
    miss_distance: {
      astronomical: String,
      lunar: String,
      kilometers: String,
      miles: String
    },
    orbiting_body: String
  }],
  orbital_data: {
    orbit_id: String,
    orbit_determination_date: String,
    first_observation_date: String,
    last_observation_date: String,
    data_arc_in_days: Number,
    observations_used: Number,
    orbit_uncertainty: String,
    minimum_orbit_intersection: String,
    jupiter_tisserand_invariant: String,
    epoch_osculation: String,
    eccentricity: String,
    semi_major_axis: String,
    inclination: String,
    ascending_node_longitude: String,
    orbital_period: String,
    perihelion_distance: String,
    perihelion_argument: String,
    aphelion_distance: String,
    perihelion_time: String,
    mean_anomaly: String,
    mean_motion: String
  },
  // Cached calculated values for simulation
  calculatedProperties: {
    mass: Number, // in kg
    density: Number, // in kg/m³
    averageDiameter: Number, // in meters
    averageVelocity: Number, // in km/s
    kineticEnergy: Number, // in joules
    volume: Number, // in cubic meters
    orbitalPeriod: Number, // in days
    lastCalculated: Date
  },
  // Metadata about the data source and updates
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      default: 'NASA_NeoWs_API'
    },
    version: {
      type: String,
      default: '1.0'
    },
    nasa_id: String // Original NASA ID
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
asteroidSchema.index({ 'is_potentially_hazardous_asteroid': 1 });
asteroidSchema.index({ 'calculatedProperties.averageDiameter': -1 });
asteroidSchema.index({ 'lastUpdated': -1 });

// Pre-save middleware to calculate properties
asteroidSchema.pre('save', function(next) {
  if (this.estimated_diameter && this.estimated_diameter.meters) {
    const minDiameter = this.estimated_diameter.meters.estimated_diameter_min;
    const maxDiameter = this.estimated_diameter.meters.estimated_diameter_max;
    this.calculatedProperties.averageDiameter = (minDiameter + maxDiameter) / 2;
    
    // Estimate mass assuming rocky asteroid density (2.6 g/cm³)
    const radius = this.calculatedProperties.averageDiameter / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    this.calculatedProperties.density = 2600; // kg/m³
    this.calculatedProperties.mass = volume * this.calculatedProperties.density;
  }
  
  if (this.close_approach_data && this.close_approach_data.length > 0) {
    const velocity = parseFloat(this.close_approach_data[0].relative_velocity.kilometers_per_second);
    this.calculatedProperties.averageVelocity = velocity;
    
    // Calculate kinetic energy: KE = 0.5 * m * v²
    if (this.calculatedProperties.mass) {
      const velocityMs = velocity * 1000; // convert to m/s
      this.calculatedProperties.kineticEnergy = 0.5 * this.calculatedProperties.mass * Math.pow(velocityMs, 2);
    }
  }
  
  next();
});

module.exports = mongoose.model('Asteroid', asteroidSchema);
