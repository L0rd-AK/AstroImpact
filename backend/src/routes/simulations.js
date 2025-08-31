const express = require('express');
const Simulation = require('../models/Simulation');
const Asteroid = require('../models/Asteroid');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const impactCalculator = require('../utils/impactCalculator');

const router = express.Router();

// Create new simulation
router.post('/', auth, async (req, res) => {
  try {
    const { 
      asteroidId, 
      impactLocation, 
      impactAngle = 45, 
      impactVelocity = 20,
      asteroidData,
      mitigationStrategy,
      isPublic = true 
    } = req.body;

    console.log('Simulation request data:', {
      asteroidId,
      impactLocation,
      impactAngle,
      impactVelocity,
      asteroidData: asteroidData ? { name: asteroidData.name, id: asteroidData.id } : null
    });

    // Use provided asteroid data or fetch from database
    let asteroid = asteroidData;
    if (!asteroid && asteroidId) {
      asteroid = await Asteroid.findOne({ neo_reference_id: asteroidId });
      if (!asteroid) {
        return res.status(404).json({ error: 'Asteroid not found' });
      }
    }

    if (!asteroid) {
      return res.status(400).json({ error: 'Asteroid data required' });
    }

    const startTime = Date.now();

    // Enhanced impact calculation with provided parameters
    const results = impactCalculator.runDetailedSimulation({
      asteroid,
      impactLocation,
      impactAngle: parseFloat(impactAngle),
      impactVelocity: parseFloat(impactVelocity)
    });

    console.log('Raw simulation results:', results);

    // Restructure results to match the Simulation model
    const structuredResults = {
      craterDiameter: results.craterDiameter * 1000, // Convert to meters
      craterDepth: results.craterDepth * 1000, // Convert to meters
      blastRadius: results.detailedEffects.blastRadius,
      seismicMagnitude: results.detailedEffects.seismicMagnitude,
      tsunamiHeight: results.detailedEffects.tsunamiHeight,
      environmentalEffects: results.detailedEffects.environmentalEffects,
      populationEffects: results.detailedEffects.populationEffects,
      economicImpact: {
        estimatedDamage: results.economicImpact,
        affectedInfrastructure: results.detailedEffects.economicImpact.affectedInfrastructure
      }
    };

    console.log('Structured results:', structuredResults);

    // Apply mitigation strategy if provided
    let finalResults = structuredResults;
    if (mitigationStrategy && mitigationStrategy.method !== 'none') {
      finalResults = impactCalculator.applyMitigation(structuredResults, mitigationStrategy);
    }

    const simulationDuration = Date.now() - startTime;

    // Create simulation record
    const simulation = new Simulation({
      user: req.user._id,
      asteroid: asteroid._id || null, // Will be null for sample data
      impactLocation: {
        latitude: impactLocation.lat,
        longitude: impactLocation.lng
      },
      impactAngle: parseFloat(impactAngle),
      impactVelocity: parseFloat(impactVelocity),
      results: finalResults,
      mitigationStrategy: mitigationStrategy || { method: 'none' },
      isPublic,
      simulationDuration,
      metadata: {
        version: '2.0',
        calculationMethod: 'Enhanced USGS scaling laws',
        dataSource: 'NASA NeoWs API + Custom Parameters',
        asteroidData: {
          name: asteroid.name,
          id: asteroid.id || asteroid.neo_reference_id,
          diameter: asteroid.estimatedDiameter?.kilometers?.estimated_diameter_max || 1,
          velocity: impactVelocity
        }
      }
    });

    await simulation.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 
        'stats.simulationsRun': 1,
        'stats.points': 10
      }
    });

    res.status(201).json({
      message: 'Simulation completed successfully',
      simulation,
      results: results // Send original results format for frontend
    });
  } catch (error) {
    console.error('Simulation creation error:', error);
    res.status(500).json({ error: 'Failed to create simulation' });
  }
});

// Get user's simulations
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const simulations = await Simulation.find({ user: req.user._id })
      .populate('asteroid', 'name neo_reference_id calculatedProperties is_potentially_hazardous_asteroid')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Simulation.countDocuments({ user: req.user._id });

    res.json({
      simulations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('User simulations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// Get public simulations (community feed)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'votes.likes', 
      sortOrder = 'desc',
      featured = false
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const query = { isPublic: true };
    if (featured === 'true') {
      query.isFeatured = true;
    }

    const simulations = await Simulation.find(query)
      .populate('user', 'username profile.firstName profile.lastName')
      .populate('asteroid', 'name neo_reference_id calculatedProperties is_potentially_hazardous_asteroid')
      .sort({ [sortBy]: sortDirection, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Simulation.countDocuments(query);

    res.json({
      simulations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Public simulations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch public simulations' });
  }
});

// Get specific simulation
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = { _id: id };
    
    // If user is not authenticated or not the owner, only show public simulations
    if (!req.user) {
      query.isPublic = true;
    }

    const simulation = await Simulation.findOne(query)
      .populate('user', 'username profile stats')
      .populate('asteroid')
      .populate('comments.user', 'username profile.firstName profile.lastName')
      .lean();

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    // Check if user owns this simulation or it's public
    if (!simulation.isPublic && (!req.user || simulation.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ simulation });
  } catch (error) {
    console.error('Simulation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

// Vote on simulation
router.post('/:id/vote', auth, validate(schemas.vote), async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.validatedData;

    const simulation = await Simulation.findOne({ _id: id, isPublic: true });
    if (!simulation) {
      return res.status(404).json({ error: 'Public simulation not found' });
    }

    // Check if user already voted
    const existingVoteIndex = simulation.votes.voters.findIndex(
      voter => voter.user.toString() === req.user._id.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = simulation.votes.voters[existingVoteIndex].vote;
      
      if (existingVote === vote) {
        return res.status(400).json({ error: 'You already voted this way' });
      }

      // Update existing vote
      simulation.votes.voters[existingVoteIndex].vote = vote;
      
      // Update counters
      if (existingVote === 'like') {
        simulation.votes.likes--;
        simulation.votes.dislikes++;
      } else {
        simulation.votes.dislikes--;
        simulation.votes.likes++;
      }
    } else {
      // Add new vote
      simulation.votes.voters.push({
        user: req.user._id,
        vote
      });

      if (vote === 'like') {
        simulation.votes.likes++;
      } else {
        simulation.votes.dislikes++;
      }
    }

    await simulation.save();

    // Update simulation owner's stats
    if (vote === 'like') {
      await User.findByIdAndUpdate(simulation.user, {
        $inc: { 'stats.votesReceived': 1, 'stats.points': 5 }
      });
    }

    res.json({
      message: 'Vote recorded successfully',
      votes: {
        likes: simulation.votes.likes,
        dislikes: simulation.votes.dislikes,
        userVote: vote
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Add comment to simulation
router.post('/:id/comments', auth, validate(schemas.comment), async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.validatedData;

    const simulation = await Simulation.findOne({ _id: id, isPublic: true });
    if (!simulation) {
      return res.status(404).json({ error: 'Public simulation not found' });
    }

    const comment = {
      user: req.user._id,
      text,
      timestamp: new Date()
    };

    simulation.comments.push(comment);
    await simulation.save();

    // Populate user data for response
    await simulation.populate('comments.user', 'username profile.firstName profile.lastName');
    const newComment = simulation.comments[simulation.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete simulation
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const simulation = await Simulation.findOne({ _id: id, user: req.user._id });
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found or access denied' });
    }

    await Simulation.findByIdAndDelete(id);

    res.json({ message: 'Simulation deleted successfully' });
  } catch (error) {
    console.error('Simulation deletion error:', error);
    res.status(500).json({ error: 'Failed to delete simulation' });
  }
});

// Get simulation statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalSimulations,
      publicSimulations,
      topMitigationMethods,
      averageImpactSeverity
    ] = await Promise.all([
      Simulation.countDocuments(),
      Simulation.countDocuments({ isPublic: true }),
      Simulation.aggregate([
        { $group: { _id: '$mitigationStrategy.method', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Simulation.aggregate([
        {
          $group: {
            _id: null,
            avgCraterSize: { $avg: '$results.craterDiameter' },
            avgCasualties: { $avg: '$results.populationEffects.estimatedCasualties' }
          }
        }
      ])
    ]);

    res.json({
      statistics: {
        totalSimulations,
        publicSimulations,
        topMitigationMethods,
        averageImpactSeverity: averageImpactSeverity[0] || {}
      }
    });
  } catch (error) {
    console.error('Simulation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper function to calculate severity score
function calculateSeverityScore(results) {
  const craterScore = Math.log10(results.craterDiameter || 1);
  const casualtyScore = Math.log10(results.populationEffects.estimatedCasualties || 1);
  const economicScore = Math.log10(results.economicImpact.estimatedDamage || 1);
  
  return Math.round((craterScore + casualtyScore + economicScore) / 3 * 10);
}

module.exports = router;
