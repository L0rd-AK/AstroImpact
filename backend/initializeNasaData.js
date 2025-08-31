const mongoose = require('mongoose');
const nasaApi = require('./src/utils/nasaApi');
const Asteroid = require('./src/models/Asteroid');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astroimpact');

async function initializeNasaData() {
  try {
    console.log('🚀 Starting NASA asteroid data initialization...');
    
    const apiKey = process.env.NASA_API_KEY;
    if (!apiKey || apiKey === 'DEMO_KEY') {
      console.log('🔑 Using NASA API Key: ❌ Missing or Demo Key (Limited)');
    } else {
      console.log('🔑 Using NASA API Key: ✅ Configured');
    }
    
    // Clear existing data
    const existingCount = await Asteroid.countDocuments();
    console.log(`📊 Found ${existingCount} existing asteroids in database`);
    
    if (existingCount > 0) {
      console.log('🗑️ Clearing existing asteroid data...');
      await Asteroid.deleteMany({});
      console.log('✅ Existing data cleared');
    }
    
    // Fetch and insert NASA data
    console.log('📡 Fetching real asteroid data from NASA API...');
    const result = await nasaApi.syncAsteroidData();
    
    // Verify the data
    const finalCount = await Asteroid.countDocuments();
    console.log(`\n📊 Data initialization complete!`);
    console.log(`   ✅ Total asteroids: ${finalCount}`);
    console.log(`   🆕 New asteroids: ${result.newCount}`);
    console.log(`   🔄 Updated asteroids: ${result.updatedCount}`);
    console.log(`   📡 Source: ${result.source || 'NASA NeoWs API'}`);
    
    // Show sample data
    console.log('\n🔍 Sample asteroids loaded:');
    const samples = await Asteroid.find({})
      .sort({ 'calculatedProperties.averageDiameter': -1 })
      .limit(5)
      .lean();
    
    samples.forEach((asteroid, index) => {
      const diameter = asteroid.calculatedProperties?.averageDiameter || 0;
      const hazardous = asteroid.is_potentially_hazardous_asteroid ? '⚠️ PHA' : '✅ Safe';
      console.log(`   ${index + 1}. ${asteroid.name} - ${diameter.toFixed(1)}m - ${hazardous}`);
    });
    
    console.log('\n🎉 NASA data initialization successful!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error initializing NASA data:', error.message);
    console.error('Stack trace:', error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeNasaData();
}

module.exports = initializeNasaData;
