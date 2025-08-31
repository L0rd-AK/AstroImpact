const axios = require('axios');
require('dotenv').config();

async function testNASAApi() {
  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    console.log('🔑 API Key:', apiKey === 'DEMO_KEY' ? 'DEMO_KEY (Limited)' : 'CONFIGURED');
    
    const url = `https://api.nasa.gov/neo/rest/v1/feed?api_key=${apiKey}`;
    console.log('🌐 Testing NASA API connection...');
    
    const response = await axios.get(url, { timeout: 15000 });
    
    if (response.status === 200) {
      const data = response.data;
      const asteroidCount = Object.values(data.near_earth_objects || {}).flat().length;
      
      console.log('✅ NASA API connection successful!');
      console.log(`📊 Found ${asteroidCount} asteroids in current feed`);
      console.log(`📅 Data range: ${data.element_count} total objects`);
      
      // Show first asteroid as example
      const asteroids = Object.values(data.near_earth_objects || {}).flat();
      if (asteroids.length > 0) {
        const sample = asteroids[0];
        console.log('\n📖 Sample asteroid:');
        console.log(`   Name: ${sample.name}`);
        console.log(`   ID: ${sample.neo_reference_id}`);
        console.log(`   Hazardous: ${sample.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}`);
      }
    }
  } catch (error) {
    console.error('❌ NASA API test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('   Reason: Request timeout - Check internet connection');
    }
  }
}

testNASAApi();
