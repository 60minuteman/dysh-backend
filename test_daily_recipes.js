const axios = require('axios');
const jwt = require('jsonwebtoken');

const baseURL = 'http://localhost:3000';
const JWT_SECRET = 'dysh-backend-secret-key'; // Default JWT secret from the app

// Test user credentials 
const testUser = {
  userId: 'clsnwls300000db0inegmrp65q', // pro user
  email: 'testuser@example.com'
};

function generateTestToken(userId) {
  return jwt.sign(
    { sub: userId, email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function testBasicRecipeEndpoint(token) {
  try {
    console.log('🍳 Testing existing recipe endpoint...');
    const response = await axios.get(`${baseURL}/recipes/breakfast?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Existing recipe endpoint working:', response.data.recipes?.length, 'recipes found');
    return true;
  } catch (error) {
    console.error('❌ Basic recipe endpoint error:', error.response?.data || error.message);
    return false;
  }
}

async function createTestLocation(token) {
  try {
    console.log('🏠 Creating test location...');
    
    const locationData = {
      name: "Home",
      country: "Nigeria", 
      countryCode: "NG",
      timezone: "Africa/Lagos",
      latitude: 6.5244,
      longitude: 3.3792,
      isPrimary: true
    };

    const response = await axios.post(`${baseURL}/api/locations`, locationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Location created:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Location creation error:', error.response?.data || error.message);
    return null;
  }
}

async function testManualRecipeGeneration(token) {
  try {
    console.log('🧪 Testing manual daily recipe generation...');
    
    const response = await axios.post(`${baseURL}/api/daily-recipes/generate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Daily recipes generated:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Recipe generation error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetDailyRecipes(token) {
  try {
    console.log('📋 Testing get daily recipes...');
    
    const response = await axios.get(`${baseURL}/api/daily-recipes?limit=10&offset=0`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Daily recipes retrieved:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Get daily recipes error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetRecipesByCategory(token, category = 'breakfast') {
  try {
    console.log(`🍽️ Testing get daily recipes by category: ${category}...`);
    
    const response = await axios.get(`${baseURL}/api/daily-recipes/category/${category}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Category recipes retrieved:', response.data?.length || 0, 'recipes');
    return true;
    
  } catch (error) {
    console.error('❌ Get category recipes error:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Daily Recipe System Tests\n');
  
  // Generate test token first
  console.log('🔑 Generating test JWT token...');
  const token = generateTestToken(testUser.userId);
  console.log('✅ Token generated for user:', testUser.userId);
  
  // Test basic connectivity
  console.log('\n🍳 Testing basic connectivity...');
  const basicWorking = await testBasicRecipeEndpoint(token);
  if (!basicWorking) {
    console.log('❌ Server not responding properly. Exiting tests.');
    return;
  }
  
  console.log('\n📍 Testing Location Management...');
  const location = await createTestLocation(token);
  
  if (location) {
    console.log('\n🍳 Testing Daily Recipe Generation...');
    const generated = await testManualRecipeGeneration(token);
    
    if (generated) {
      console.log('\n📋 Testing Recipe Retrieval...');
      await testGetDailyRecipes(token);
      await testGetRecipesByCategory(token, 'breakfast');
      await testGetRecipesByCategory(token, 'lunch');
      await testGetRecipesByCategory(token, 'dinner');
    }
  }
  
  console.log('\n✨ Test complete!');
  console.log('\n📖 API Documentation available at: http://localhost:3000/api/docs');
}

runTests(); 