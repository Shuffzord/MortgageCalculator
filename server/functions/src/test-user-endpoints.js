const axios = require('axios');

const API_URL = 'http://localhost:5001/mortgage-firebase-firebase/europe-west3/api';
let authToken;

const testUserEndpoints = async () => {
  try {
    console.log('Starting test script...');

    // Login to get auth token
    console.log('Attempting to login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    authToken = loginResponse.data.token;
    console.log('Login successful, token received');

    // Test GET /api/users/profile
    console.log('Testing GET /api/users/profile...');
    const profileResponse = await axios.get(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('GET /api/users/profile:', profileResponse.data);

    // Test PUT /api/users/profile
    console.log('Testing PUT /api/users/profile...');
    const updateProfileResponse = await axios.put(`${API_URL}/api/users/profile`, {
      displayName: 'Updated Name',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('PUT /api/users/profile:', updateProfileResponse.data);

    // Test GET /api/users/limits
    console.log('Testing GET /api/users/limits...');
    const limitsResponse = await axios.get(`${API_URL}/api/users/limits`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('GET /api/users/limits:', limitsResponse.data);

    // Test GET /api/users/tier
    console.log('Testing GET /api/users/tier...');
    const tierResponse = await axios.get(`${API_URL}/api/users/tier`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('GET /api/users/tier:', tierResponse.data);

    // Test PUT /api/users/tier
    console.log('Testing PUT /api/users/tier...');
    const updateTierResponse = await axios.put(`${API_URL}/api/users/tier`, {
      tier: 'premium'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('PUT /api/users/tier:', updateTierResponse.data);

    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Error occurred during testing:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error stack:', error.stack);
  }
};

console.log('Test script loaded. Running tests...');
testUserEndpoints().then(() => console.log('Test script finished executing'));