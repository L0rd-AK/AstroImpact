const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asteroid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asteroid',
    required: false // Allow null for sample/demo data
  },
  impactLocation: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    address: String,
    country: String,
    city: String
  },
  impactAngle: {
    type: Number,
    default: 45,
    min: 0,
    max: 90
  },
  impactVelocity: Number, // km/s
  results: {
    craterDiameter: Number, // meters
    craterDepth: Number, // meters
    blastRadius: {
      noSurvivors: Number, // km
      heavyDamage: Number, // km
      moderateDamage: Number, // km
      lightDamage: Number // km
    },
    seismicMagnitude: Number,
    tsunamiHeight: Number, // meters (if applicable)
    environmentalEffects: {
      dustCloudRadius: Number, // km
      temperatureDrop: Number, // degrees C
      durationDays: Number
    },
    populationEffects: {
      estimatedCasualties: Number,
      affectedPopulation: Number,
      evacuationRadius: Number // km
    },
    economicImpact: {
      estimatedDamage: Number, // USD
      affectedInfrastructure: [String]
    }
  },
  mitigationStrategy: {
    method: {
      type: String,
      enum: [
        'kinetic_impactor',
        'nuclear_device',
        'gravity_tractor',
        'solar_sail',
        'mass_driver',
        'ion_beam',
        'evacuation_only',
        'none'
      ],
      default: 'none'
    },
    description: String,
    estimatedCost: Number, // USD
    successProbability: Number, // percentage
    timeRequired: Number, // years
    effectivenessReduction: Number // percentage reduction in impact severity
  },
  votes: {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    voters: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['like', 'dislike'] }
    }]
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  simulationDuration: Number, // milliseconds
  metadata: {
    version: { type: String, default: '1.0' },
    calculationMethod: String,
    dataSource: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
simulationSchema.index({ user: 1, createdAt: -1 });
simulationSchema.index({ 'votes.likes': -1 });
simulationSchema.index({ isPublic: 1, isFeatured: 1 });
simulationSchema.index({ 'impactLocation.latitude': 1, 'impactLocation.longitude': 1 });

// Virtual for total votes
simulationSchema.virtual('totalVotes').get(function() {
  return this.votes.likes - this.votes.dislikes;
});

// Method to check if user has voted
simulationSchema.methods.hasUserVoted = function(userId) {
  return this.votes.voters.some(voter => voter.user.toString() === userId.toString());
};

// Method to get user's vote
simulationSchema.methods.getUserVote = function(userId) {
  const voter = this.votes.voters.find(voter => voter.user.toString() === userId.toString());
  return voter ? voter.vote : null;
};

module.exports = mongoose.model('Simulation', simulationSchema);
