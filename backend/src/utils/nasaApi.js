const axios = require('axios');
const Asteroid = require('../models/Asteroid');

class NASAApiService {
  constructor() {
    this.baseURL = 'https://api.nasa.gov/neo/rest/v1';
    this.apiKey = process.env.NASA_API_KEY;
    
    // Set default if not configured
    if (!this.apiKey) {
      this.apiKey = 'DEMO_KEY';
      console.warn('⚠️ NASA_API_KEY not found in environment variables');
      console.warn('💡 Using DEMO_KEY - rate limited to 30 requests per hour');
    } else if (this.apiKey === 'DEMO_KEY') {
      console.warn('⚠️ Using NASA DEMO_KEY - rate limited to 30 requests per hour');
      console.warn('💡 Set a real NASA_API_KEY in .env file for unlimited access');
    } else {
      console.log('✅ NASA API Key configured successfully');
    }
  }

  // Check if API key is valid and not demo key
  isValidApiKey() {
    return this.apiKey && this.apiKey !== 'DEMO_KEY' && this.apiKey.length > 10;
  }

  // Get API rate limit status
  getApiStatus() {
    return {
      apiKey: this.apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'CONFIGURED',
      baseURL: this.baseURL,
      isValid: this.isValidApiKey()
    };
  }

  async fetchAsteroidFeed(startDate = null, endDate = null) {
    try {
      let url = `${this.baseURL}/feed?api_key=${this.apiKey}`;
      
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      console.log(`🌐 Fetching from: ${url.replace(this.apiKey, '***')}`);

      const response = await axios.get(url, {
        timeout: 30000, // Increased timeout to 30 seconds
        headers: {
          'User-Agent': 'AstroImpact-Simulator/1.0'
        }
      });

      console.log(`📡 API Response received (${response.status})`);
      return response.data;
    } catch (error) {
      console.error('NASA API fetch error:', error.message);
      if (error.code === 'ECONNABORTED') {
        throw new Error('NASA API request timed out - please try again');
      }
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

      console.log(`📅 Fetching asteroids from ${startDate} to ${endDate}`);
      const feedData = await this.fetchAsteroidFeed(startDate, endDate);
      
      if (!feedData.near_earth_objects) {
        throw new Error('No near Earth objects data received from NASA API');
      }

      const asteroids = Object.values(feedData.near_earth_objects).flat();
      console.log(`📡 Retrieved ${asteroids.length} asteroids from NASA API`);

      let newCount = 0;
      let updatedCount = 0;

      for (const asteroidData of asteroids) {
        try {
          // Process and enhance asteroid data
          const processedData = this.processAsteroidData(asteroidData);
          
          const existingAsteroid = await Asteroid.findOne({
            neo_reference_id: asteroidData.neo_reference_id
          });

          if (existingAsteroid) {
            // Update existing asteroid
            Object.assign(existingAsteroid, processedData);
            existingAsteroid.metadata.lastUpdated = new Date();
            await existingAsteroid.save();
            updatedCount++;
          } else {
            // Create new asteroid
            const newAsteroid = new Asteroid(processedData);
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
      
      // If NASA API fails and database is empty, use fallback data
      const count = await Asteroid.countDocuments();
      if (count === 0) {
        console.log('📦 Using fallback asteroid data...');
        await this.insertFallbackData();
        return { newCount: 3, updatedCount: 0, totalProcessed: 3, source: 'fallback' };
      }
      
      throw error;
    }
  }

  // Process raw NASA data to match our schema
  processAsteroidData(nasaData) {
    // Remove the 'id' field to avoid conflicts with MongoDB's _id
    const { id, ...cleanedData } = nasaData;
    
    const diameter = cleanedData.estimated_diameter?.meters || {};
    const averageDiameter = (diameter.estimated_diameter_min + diameter.estimated_diameter_max) / 2 || 1000;
    
    // Get the most recent close approach data
    const closeApproach = cleanedData.close_approach_data?.[0] || {};
    const velocity = parseFloat(closeApproach.relative_velocity?.kilometers_per_second) || 20;
    
    // Calculate physical properties
    const volume = (4/3) * Math.PI * Math.pow(averageDiameter / 2, 3); // Volume in cubic meters
    const density = 2500; // Average asteroid density kg/m³
    const mass = volume * density;
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2); // Convert km/s to m/s
    
    return {
      ...cleanedData,
      calculatedProperties: {
        averageDiameter: averageDiameter,
        volume: volume,
        mass: mass,
        kineticEnergy: kineticEnergy,
        averageVelocity: velocity,
        orbitalPeriod: cleanedData.orbital_data?.orbital_period || null,
        lastCalculated: new Date()
      },
      metadata: {
        lastUpdated: new Date(),
        source: "NASA_NeoWs_API",
        version: "1.0",
        nasa_id: id // Store the original NASA ID separately
      }
    };
  }

  // Insert fallback data if NASA API is unavailable
  async insertFallbackData() {
    const fallbackData = this.getFallbackAsteroids().map(asteroid => this.processAsteroidData(asteroid));
    await Asteroid.insertMany(fallbackData);
    console.log('📦 Fallback asteroid data inserted');
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
        nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2000433",
        absolute_magnitude_h: 10.4,
        is_potentially_hazardous_asteroid: false,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 16840,
            estimated_diameter_max: 37680
          }
        },
        close_approach_data: [{
          close_approach_date: "2025-01-30",
          close_approach_date_full: "2025-Jan-30 14:17",
          relative_velocity: {
            kilometers_per_second: "5.04",
            kilometers_per_hour: "18144"
          },
          miss_distance: {
            astronomical: "0.1738",
            lunar: "67.61",
            kilometers: "26000000"
          },
          orbiting_body: "Earth"
        }]
      },
      {
        neo_reference_id: "2001036",
        name: "1036 Ganymed (1924 TD)",
        nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2001036",
        absolute_magnitude_h: 9.45,
        is_potentially_hazardous_asteroid: true,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 31110,
            estimated_diameter_max: 69570
          }
        },
        close_approach_data: [{
          close_approach_date: "2025-10-13",
          close_approach_date_full: "2025-Oct-13 06:56",
          relative_velocity: {
            kilometers_per_second: "19.56",
            kilometers_per_hour: "70416"
          },
          miss_distance: {
            astronomical: "0.3814",
            lunar: "148.37",
            kilometers: "57060000"
          },
          orbiting_body: "Earth"
        }]
      },
      {
        neo_reference_id: "2099942",
        name: "99942 Apophis (2004 MN4)",
        nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2099942",
        absolute_magnitude_h: 19.7,
        is_potentially_hazardous_asteroid: true,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 317,
            estimated_diameter_max: 709
          }
        },
        close_approach_data: [{
          close_approach_date: "2029-04-13",
          close_approach_date_full: "2029-Apr-13 21:46",
          relative_velocity: {
            kilometers_per_second: "7.43",
            kilometers_per_hour: "26748"
          },
          miss_distance: {
            astronomical: "0.0002548",
            lunar: "99.12",
            kilometers: "38139"
          },
          orbiting_body: "Earth"
        }]
      },
      {
        neo_reference_id: "54016101",
        name: "2020 XL5",
        nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=54016101",
        absolute_magnitude_h: 20.5,
        is_potentially_hazardous_asteroid: false,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 800,
            estimated_diameter_max: 1800
          }
        },
        close_approach_data: [{
          close_approach_date: "2025-12-08",
          close_approach_date_full: "2025-Dec-08 18:24",
          relative_velocity: {
            kilometers_per_second: "25.8",
            kilometers_per_hour: "92880"
          },
          miss_distance: {
            astronomical: "0.0123",
            lunar: "4.787",
            kilometers: "1841200"
          },
          orbiting_body: "Earth"
        }]
      },
      {
        neo_reference_id: "2001620",
        name: "1620 Geographos (1951 RA)",
        nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2001620",
        absolute_magnitude_h: 15.6,
        is_potentially_hazardous_asteroid: true,
        estimated_diameter: {
          meters: {
            estimated_diameter_min: 2440,
            estimated_diameter_max: 5460
          }
        },
        close_approach_data: [{
          close_approach_date: "2025-08-23",
          close_approach_date_full: "2025-Aug-23 10:15",
          relative_velocity: {
            kilometers_per_second: "14.2",
            kilometers_per_hour: "51120"
          },
          miss_distance: {
            astronomical: "0.0335",
            lunar: "13.03",
            kilometers: "5014000"
          },
          orbiting_body: "Earth"
        }]
      }
    ];
  }
}

module.exports = new NASAApiService();
