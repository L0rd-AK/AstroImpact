const express = require('express');
const Asteroid = require('../models/Asteroid');
const nasaApi = require('../utils/nasaApi');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all asteroids with pagination and filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'calculatedProperties.averageDiameter',
      sortOrder = 'desc',
      hazardous,
      minSize,
      maxSize,
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (hazardous !== undefined) {
      query.is_potentially_hazardous_asteroid = hazardous === 'true';
    }
    
    if (minSize || maxSize) {
      query['calculatedProperties.averageDiameter'] = {};
      if (minSize) query['calculatedProperties.averageDiameter'].$gte = parseFloat(minSize);
      if (maxSize) query['calculatedProperties.averageDiameter'].$lte = parseFloat(maxSize);
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { neo_reference_id: searchRegex }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const asteroids = await Asteroid.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Asteroid.countDocuments(query);

    // If no asteroids found, try to sync data from NASA API
    if (total === 0) {
      console.log('⚠️ No asteroids in database, attempting to sync from NASA API...');
      try {
        await nasaApi.syncAsteroidData();
        
        // Retry the query after sync
        const newAsteroids = await Asteroid.find(query)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(parseInt(limit))
          .lean();
        const newTotal = await Asteroid.countDocuments(query);
        
        return res.json({
          asteroids: newAsteroids,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(newTotal / parseInt(limit)),
            totalItems: newTotal,
            itemsPerPage: parseInt(limit)
          },
          message: newTotal > 0 ? 'Data loaded from NASA API' : 'No asteroids available'
        });
      } catch (syncError) {
        console.error('Failed to sync NASA data:', syncError.message);
        return res.status(503).json({ 
          error: 'No asteroid data available and unable to fetch from NASA API',
          details: syncError.message 
        });
      }
    }

    res.json({
      asteroids,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Asteroids fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch asteroids' });
  }
});

// Get featured/popular asteroids
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const asteroids = await nasaApi.getPopularAsteroids(parseInt(limit));
    
    res.json({ asteroids });
  } catch (error) {
    console.error('Featured asteroids fetch error:', error);
    
    // Fallback to database query
    try {
      const asteroids = await Asteroid.find({
        'calculatedProperties.averageDiameter': { $exists: true }
      })
      .sort({ 
        'is_potentially_hazardous_asteroid': -1,
        'calculatedProperties.kineticEnergy': -1 
      })
      .limit(parseInt(req.query.limit || 10))
      .lean();
      
      res.json({ asteroids });
    } catch (dbError) {
      res.status(500).json({ error: 'Failed to fetch featured asteroids' });
    }
  }
});

// Search asteroids
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const asteroids = await nasaApi.searchAsteroids(query.trim(), parseInt(limit));
    
    res.json({ asteroids });
  } catch (error) {
    console.error('Asteroid search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get specific asteroid by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find in database first
    let asteroid = await Asteroid.findOne({
      $or: [
        { _id: id },
        { neo_reference_id: id }
      ]
    }).lean();
    
    // If not found in database, try NASA API
    if (!asteroid) {
      try {
        const nasaData = await nasaApi.fetchAsteroidById(id);
        
        // Save to database for future use
        asteroid = new Asteroid(nasaData);
        await asteroid.save();
        asteroid = asteroid.toObject();
      } catch (apiError) {
        return res.status(404).json({ error: 'Asteroid not found' });
      }
    }
    
    res.json({ asteroid });
  } catch (error) {
    console.error('Asteroid fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch asteroid' });
  }
});

// Sync asteroid data from NASA API (admin only or scheduled)
router.post('/sync', async (req, res) => {
  try {
    const result = await nasaApi.syncAsteroidData();
    
    res.json({
      message: 'Asteroid data sync completed',
      ...result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get asteroid statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalCount,
      hazardousCount,
      averageSize,
      sizeDistribution
    ] = await Promise.all([
      Asteroid.countDocuments(),
      Asteroid.countDocuments({ is_potentially_hazardous_asteroid: true }),
      Asteroid.aggregate([
        {
          $group: {
            _id: null,
            avgSize: { $avg: '$calculatedProperties.averageDiameter' }
          }
        }
      ]),
      Asteroid.aggregate([
        {
          $bucket: {
            groupBy: '$calculatedProperties.averageDiameter',
            boundaries: [0, 100, 1000, 10000, 100000, Infinity],
            default: 'Unknown',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ])
    ]);

    res.json({
      statistics: {
        totalAsteroids: totalCount,
        hazardousAsteroids: hazardousCount,
        averageSize: averageSize[0]?.avgSize || 0,
        sizeDistribution
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get NASA API status
router.get('/nasa/status', async (req, res) => {
  try {
    const apiStatus = nasaApi.getApiStatus();
    const lastSync = await Asteroid.findOne({}, {}, { sort: { 'metadata.lastUpdated': -1 } });
    
    res.json({
      nasa_api: apiStatus,
      last_sync: lastSync?.metadata?.lastUpdated || null,
      database_count: await Asteroid.countDocuments()
    });
  } catch (error) {
    console.error('NASA status error:', error);
    res.status(500).json({ error: 'Failed to get NASA API status' });
  }
});

module.exports = router;
