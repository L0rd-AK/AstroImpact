const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astroimpact');

const sampleAsteroids = [
  {
    id: "2099942",
    neo_reference_id: "2099942",
    name: "99942 Apophis (2004 MN4)",
    nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2099942",
    absolute_magnitude_h: 19.7,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.3170031414,
        estimated_diameter_max: 0.7090571767
      },
      meters: {
        estimated_diameter_min: 317.0031414,
        estimated_diameter_max: 709.0571767
      }
    },
    is_potentially_hazardous_asteroid: true,
    close_approach_data: [
      {
        close_approach_date: "2029-04-13",
        close_approach_date_full: "2029-Apr-13 21:46",
        epoch_date_close_approach: 1869779160000,
        relative_velocity: {
          kilometers_per_second: "7.4330131766",
          kilometers_per_hour: "26758.847436",
          miles_per_hour: "16623.915069"
        },
        miss_distance: {
          astronomical: "0.0002548096",
          lunar: "99.123334",
          kilometers: "38139.384",
          miles: "23696.499"
        },
        orbiting_body: "Earth"
      }
    ],
    calculatedProperties: {
      averageDiameter: 0.513,
      volume: 0.071,
      mass: 6.15e13,
      kineticEnergy: 2.03e15,
      averageVelocity: 7.43,
      orbitalPeriod: 324,
      lastCalculated: new Date()
    },
    metadata: {
      lastUpdated: new Date(),
      source: "NASA_NeoWs_API",
      version: "1.0"
    }
  },
  {
    id: "3542519",
    neo_reference_id: "3542519",
    name: "2010 PK9",
    nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=3542519",
    absolute_magnitude_h: 22.2,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.1079622,
        estimated_diameter_max: 0.2414939
      },
      meters: {
        estimated_diameter_min: 107.9622,
        estimated_diameter_max: 241.4939
      }
    },
    is_potentially_hazardous_asteroid: false,
    close_approach_data: [
      {
        close_approach_date: "2024-03-15",
        close_approach_date_full: "2024-Mar-15 12:30",
        epoch_date_close_approach: 1710504600000,
        relative_velocity: {
          kilometers_per_second: "15.2",
          kilometers_per_hour: "54720",
          miles_per_hour: "34000"
        },
        miss_distance: {
          astronomical: "0.0524",
          lunar: "20.384",
          kilometers: "7840000",
          miles: "4871000"
        },
        orbiting_body: "Earth"
      }
    ],
    calculatedProperties: {
      averageDiameter: 0.175,
      volume: 0.0028,
      mass: 7.3e12,
      kineticEnergy: 8.4e14,
      averageVelocity: 15.2,
      orbitalPeriod: 890,
      lastCalculated: new Date()
    },
    metadata: {
      lastUpdated: new Date(),
      source: "NASA_NeoWs_API",
      version: "1.0"
    }
  },
  {
    id: "54016101",
    neo_reference_id: "54016101",
    name: "2020 XL5",
    nasa_jpl_url: "http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=54016101",
    absolute_magnitude_h: 20.5,
    estimated_diameter: {
      kilometers: {
        estimated_diameter_min: 0.8,
        estimated_diameter_max: 1.8
      },
      meters: {
        estimated_diameter_min: 800,
        estimated_diameter_max: 1800
      }
    },
    is_potentially_hazardous_asteroid: true,
    close_approach_data: [
      {
        close_approach_date: "2025-12-08",
        close_approach_date_full: "2025-Dec-08 18:24",
        epoch_date_close_approach: 1764583440000,
        relative_velocity: {
          kilometers_per_second: "25.8",
          kilometers_per_hour: "92880",
          miles_per_hour: "57720"
        },
        miss_distance: {
          astronomical: "0.0123",
          lunar: "4.787",
          kilometers: "1841200",
          miles: "1144300"
        },
        orbiting_body: "Earth"
      }
    ],
    calculatedProperties: {
      averageDiameter: 1.3,
      volume: 1.15,
      mass: 3.0e15,
      kineticEnergy: 9.95e17,
      averageVelocity: 25.8,
      orbitalPeriod: 400,
      lastCalculated: new Date()
    },
    metadata: {
      lastUpdated: new Date(),
      source: "NASA_NeoWs_API",
      version: "1.0"
    }
  }
];

async function insertSampleData() {
  try {
    const Asteroid = require('./src/models/Asteroid');
    
    // Clear existing data
    await Asteroid.deleteMany({});
    console.log('🗑️ Cleared existing asteroid data');
    
    // Insert sample data
    const inserted = await Asteroid.insertMany(sampleAsteroids);
    console.log(`✅ Inserted ${inserted.length} sample asteroids`);
    
    console.log('📊 Sample asteroids added:');
    inserted.forEach(asteroid => {
      console.log(`  - ${asteroid.name} (${asteroid.calculatedProperties.averageDiameter} km)`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    mongoose.connection.close();
  }
}

insertSampleData();
