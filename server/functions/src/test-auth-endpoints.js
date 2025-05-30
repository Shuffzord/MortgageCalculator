const axios = require('axios');

const BASE_URL = 'http://localhost:5001/mortgage-firebase-firebase/europe-west3/api';
let idToken = ''; // Replace this with a valid Firebase ID token for testing

async function testAuthEndpoints() {
  try {
    // Test token verification
    console.log('Testing token verification...');
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify`, null, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    console.log('Verify response:', verifyResponse.data);

    // Test get current user
    console.log('\nTesting get current user...');
    const getUserResponse = await axios.get(`${BASE_URL}/auth/user`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    console.log('Get user response:', getUserResponse.data);

    // Test update user profile
    console.log('\nTesting update user profile...');
    const updateUserResponse = await axios.put(`${BASE_URL}/auth/user`, 
      { displayName: 'Updated Name', photoURL: 'https://example.com/photo.jpg' },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    console.log('Update user response:', updateUserResponse.data);

    // Test unauthorized access
    console.log('\nTesting unauthorized access...');
    try {
      await axios.get(`${BASE_URL}/auth/user`);
    } catch (error) {
      console.log('Unauthorized access error:', error.response.data);
    }

  } catch (error) {
    console.error('Error during tests:', error.response ? error.response.data : error.message);
  }
}

testAuthEndpoints();