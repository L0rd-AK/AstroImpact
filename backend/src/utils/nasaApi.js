const axios = require('axios');
const Asteroid = require('../models/Asteroid');

class NASAApiService {
  constructor() {
    this.baseURL = 'https://api.nasa.gov/neo/rest/v1';
    this.apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  }

  async fetchAsteroidFeed(startDate = null, endDate = null) {
    try {
      let url = `${this.baseURL}/feed?api_key=${this.apiKey}`;
      
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AstroImpact-Simulator/1.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error('NASA API fetch error:', error.message);
      throw new Error(`Failed to fetch asteroid data: ${error.message}`);
    }
  }

  async fetchAsteroidById(asteroidId) {
    try {
      const url = `${this.baseURL}/neo/${asteroidId}?api_key=${this.apiKey}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AstroImpact-Simulator/1.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error('NASA API asteroid fetch error:', error.message);
      throw new Error(`Failed to fetch asteroid ${asteroidId}: ${error.message}`);
    }
  }

  async syncAsteroidData() {
    try {
      console.log('🔄 Syncing asteroid data from NASA API...');
      
      // Get current date and 7 days from now
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const startDate = today.toISOString().split('T')[0];
      const endDate = nextWeek.toISOString().split('T')[0];

      const feedData = await this.fetchAsteroidFeed(startDate, endDate);
      const asteroids = Object.values(feedData.near_earth_objects).flat();

      let newCount = 0;
      let updatedCount = 0;

      for (const asteroidData of asteroids) {
        try {
          const existingAsteroid = await Asteroid.findOne({
            neo_reference_id: asteroidData.neo_reference_id
          });

          if (existingAsteroid) {
            // Update existing asteroid
            Object.assign(existingAsteroid, asteroidData);
            existingAsteroid.lastUpdated = new Date();
            await existingAsteroid.save();
            updatedCount++;
          } else {
            // Create new asteroid
            const newAsteroid = new Asteroid(asteroidData);
            await newAsteroid.save();
            newCount++;
          }
        } catch (error) {
          console.error(`Error processing asteroid ${asteroidData.neo_reference_id}:`, error.message);
        }
      }

      console.log(`✅ Asteroid sync complete: ${newCount} new, ${updatedCount} updated`);
      return { newCount, updatedCount, totalProcessed: asteroids.length };
    } catch (error) {
      console.error('❌ Asteroid sync failed:', error.message);
      throw error;
    }
  }

  async getPopularAsteroids(limit = 20) {
    try {
      return await Asteroid.find({
        'calculatedProperties.averageDiameter': { $exists: true },
        'calculatedProperties.kineticEnergy': { $exists: true }
      })
      .sort({ 
        'is_potentially_hazardous_asteroid': -1,
        'calculatedProperties.kineticEnergy': -1 
      })
      .limit(limit)
      .lean();
    } catch (error) {
      console.error('Error fetching popular asteroids:', error.message);
      throw error;
    }
  }

  async searchAsteroids(query, limit = 10) {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      return await Asteroid.find({
        $or: [
          { name: searchRegex },
          { neo_reference_id: searchRegex }
        ]
      })
      .sort({ 'calculatedProperties.averageDiameter': -1 })
      .limit(limit)
      .lean();
    } catch (error) {
      console.error('Error searching asteroids:', error.message);
      throw error;
    }
  }

  // Fallback data for when API is unavailable
  getFallbackAsteroids() {
    return [
      {
        neo_reference_id: "2000433",
        name: "433 Eros (1898 DQ)",
        is_potentially_hazardous_asteroid: false,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 16840,
            estimated_diameter_max: 37680
          }
        },
        close_approach_data: [{
          relative_velocity: {
            kilometers_per_second: "5.04"
          }
        }]
      },
      {
        neo_reference_id: "2001036",
        name: "1036 Ganymed (1924 TD)",
        is_potentially_hazardous_asteroid: true,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 31110,
            estimated_diameter_max: 69570
          }
        },
        close_approach_data: [{
          relative_velocity: {
            kilometers_per_second: "19.56"
          }
        }]
      }
    ];
  }
}

module.exports = new NASAApiService();
