// Load environment variables first
require('dotenv').config();

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const BASE_URL = process.env.FUNCTIONS_EMULATOR_URL || 'http://localhost:5001/mortgage-firebase-firebase/europe-west3/api';

// Test users
const testUsers = {
  freeUser: {
    email: 'free-user@test.com',
    password: 'testpassword123',
    tier: 'free'
  },
  premiumUser: {
    email: 'premium-user@test.com',
    password: 'testpassword123',
    tier: 'premium'
  }
};

// Test calculation data
const testCalculation = {
  title: 'Test Mortgage Calculation',
  loanAmount: 300000,
  interestRate: 4.5,
  loanTerm: 30,
  downPayment: 60000,
  extraPayments: [
    {
      month: 12,
      amount: 1000,
      type: 'yearly'
    }
  ],
  isPublic: false
};

const testCalculationUpdate = {
  title: 'Updated Test Mortgage Calculation',
  loanAmount: 350000,
  interestRate: 4.25,
  isPublic: true
};

async function createTestUser(userData) {
  try {
    // Delete user if exists
    try {
      const existingUser = await admin.auth().getUserByEmail(userData.email);
      await admin.auth().deleteUser(existingUser.uid);
      console.log(`Deleted existing user: ${userData.email}`);
    } catch (error) {
      // User doesn't exist, continue
    }

    // Create new user
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      emailVerified: true,
    });

    // Set user tier in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      tier: userData.tier,
      email: userData.email,
      createdAt: new Date().toISOString()
    });

    // Create custom token for testing
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      tier: userData.tier
    });

    console.log(`Created test user: ${userData.email} (${userData.tier})`);
    return { uid: userRecord.uid, token: customToken, tier: userData.tier };
  } catch (error) {
    console.error(`Error creating test user ${userData.email}:`, error.message);
    throw error;
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      ok: response.ok
    };
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return {
      status: 500,
      data: { error: error.message },
      ok: false
    };
  }
}

async function testCalculationEndpoints() {
  console.log('🧪 Starting Calculation Endpoints Test Suite\n');

  try {
    // Create test users
    console.log('📝 Creating test users...');
    const freeUser = await createTestUser(testUsers.freeUser);
    const premiumUser = await createTestUser(testUsers.premiumUser);
    console.log('✅ Test users created\n');

    // Test 1: Calculate mortgage without saving (no auth required)
    console.log('🧮 Test 1: Calculate mortgage without saving');
    const calcResult = await makeRequest('/calculations/calculate', {
      method: 'POST',
      body: JSON.stringify({
        loanAmount: testCalculation.loanAmount,
        interestRate: testCalculation.interestRate,
        loanTerm: testCalculation.loanTerm,
        downPayment: testCalculation.downPayment,
        extraPayments: testCalculation.extraPayments
      })
    });
    
    if (calcResult.ok) {
      console.log('✅ Calculation successful');
      console.log(`   Monthly Payment: $${calcResult.data.data.monthlyPayment.toFixed(2)}`);
      console.log(`   Total Interest: $${calcResult.data.data.totalInterest.toFixed(2)}`);
    } else {
      console.log('❌ Calculation failed:', calcResult.data);
    }
    console.log('');

    // Test 2: Save calculation (Free user)
    console.log('💾 Test 2: Save calculation (Free user)');
    const saveResult = await makeRequest('/calculations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freeUser.token}`
      },
      body: JSON.stringify(testCalculation)
    });
    
    let savedCalculationId = null;
    if (saveResult.ok) {
      console.log('✅ Calculation saved successfully');
      savedCalculationId = saveResult.data.data.id;
      console.log(`   Calculation ID: ${savedCalculationId}`);
    } else {
      console.log('❌ Save failed:', saveResult.data);
    }
    console.log('');

    // Test 3: Get user calculations (Free user)
    console.log('📋 Test 3: Get user calculations (Free user)');
    const listResult = await makeRequest('/calculations?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${freeUser.token}`
      }
    });
    
    if (listResult.ok) {
      console.log('✅ Retrieved calculations successfully');
      console.log(`   Total calculations: ${listResult.data.data.total}`);
      console.log(`   Current page: ${listResult.data.data.page}`);
    } else {
      console.log('❌ List failed:', listResult.data);
    }
    console.log('');

    // Test 4: Get specific calculation
    if (savedCalculationId) {
      console.log('🔍 Test 4: Get specific calculation');
      const getResult = await makeRequest(`/calculations/${savedCalculationId}`, {
        headers: {
          'Authorization': `Bearer ${freeUser.token}`
        }
      });
      
      if (getResult.ok) {
        console.log('✅ Retrieved specific calculation successfully');
        console.log(`   Title: ${getResult.data.data.title}`);
        console.log(`   Loan Amount: $${getResult.data.data.loanAmount.toLocaleString()}`);
      } else {
        console.log('❌ Get calculation failed:', getResult.data);
      }
      console.log('');
    }

    // Test 5: Update calculation
    if (savedCalculationId) {
      console.log('✏️ Test 5: Update calculation');
      const updateResult = await makeRequest(`/calculations/${savedCalculationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freeUser.token}`
        },
        body: JSON.stringify(testCalculationUpdate)
      });
      
      if (updateResult.ok) {
        console.log('✅ Calculation updated successfully');
        console.log(`   New title: ${updateResult.data.data.title}`);
        console.log(`   New loan amount: $${updateResult.data.data.loanAmount.toLocaleString()}`);
      } else {
        console.log('❌ Update failed:', updateResult.data);
      }
      console.log('');
    }

    // Test 6: Share calculation
    if (savedCalculationId) {
      console.log('🔗 Test 6: Share calculation');
      const shareResult = await makeRequest(`/calculations/${savedCalculationId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freeUser.token}`
        }
      });
      
      let publicToken = null;
      if (shareResult.ok) {
        console.log('✅ Calculation shared successfully');
        publicToken = shareResult.data.data.publicToken;
        console.log(`   Public token: ${publicToken.substring(0, 16)}...`);
        console.log(`   Share URL: ${shareResult.data.data.shareUrl}`);
      } else {
        console.log('❌ Share failed:', shareResult.data);
      }
      console.log('');

      // Test 7: Access public calculation (no auth required)
      if (publicToken) {
        console.log('🌐 Test 7: Access public calculation');
        const publicResult = await makeRequest(`/calculations/public/${publicToken}`);
        
        if (publicResult.ok) {
          console.log('✅ Public calculation accessed successfully');
          console.log(`   Title: ${publicResult.data.data.title}`);
          console.log(`   Is Public: ${publicResult.data.data.isPublic}`);
          console.log(`   User ID hidden: ${publicResult.data.data.userId === undefined ? 'Yes' : 'No'}`);
        } else {
          console.log('❌ Public access failed:', publicResult.data);
        }
        console.log('');
      }
    }

    // Test 8: Test tier limits (Free user - try to save multiple calculations)
    console.log('🚫 Test 8: Test tier limits (Free user)');
    let limitReached = false;
    for (let i = 2; i <= 5; i++) {
      const limitTestResult = await makeRequest('/calculations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freeUser.token}`
        },
        body: JSON.stringify({
          ...testCalculation,
          title: `Test Calculation ${i}`
        })
      });
      
      if (!limitTestResult.ok && limitTestResult.data.error?.includes('limit')) {
        console.log(`✅ Tier limit enforced at calculation ${i}`);
        console.log(`   Error: ${limitTestResult.data.error}`);
        limitReached = true;
        break;
      } else if (limitTestResult.ok) {
        console.log(`   Calculation ${i} saved successfully`);
      }
    }
    
    if (!limitReached) {
      console.log('⚠️ Tier limit not reached - may need adjustment');
    }
    console.log('');

    // Test 9: Premium user unlimited saves
    console.log('💎 Test 9: Premium user unlimited saves');
    const premiumSaveResult = await makeRequest('/calculations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${premiumUser.token}`
      },
      body: JSON.stringify({
        ...testCalculation,
        title: 'Premium User Calculation'
      })
    });
    
    if (premiumSaveResult.ok) {
      console.log('✅ Premium user can save calculations');
      console.log(`   Calculation ID: ${premiumSaveResult.data.data.id}`);
    } else {
      console.log('❌ Premium save failed:', premiumSaveResult.data);
    }
    console.log('');

    // Test 10: Check usage limits
    console.log('📊 Test 10: Check usage limits');
    const limitsResult = await makeRequest('/users/limits', {
      headers: {
        'Authorization': `Bearer ${freeUser.token}`
      }
    });
    
    if (limitsResult.ok) {
      console.log('✅ Usage limits retrieved successfully');
      console.log(`   Tier: ${limitsResult.data.data.tier}`);
      console.log(`   Calculations saved: ${limitsResult.data.data.calculationsSaved}`);
      console.log(`   Max calculations: ${limitsResult.data.data.maxCalculations}`);
      console.log(`   Remaining: ${limitsResult.data.data.remainingCalculations}`);
    } else {
      console.log('❌ Limits check failed:', limitsResult.data);
    }
    console.log('');

    // Test 11: Delete calculation
    if (savedCalculationId) {
      console.log('🗑️ Test 11: Delete calculation');
      const deleteResult = await makeRequest(`/calculations/${savedCalculationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${freeUser.token}`
        }
      });
      
      if (deleteResult.ok) {
        console.log('✅ Calculation deleted successfully');
      } else {
        console.log('❌ Delete failed:', deleteResult.data);
      }
      console.log('');
    }

    // Test 12: Error handling - Invalid data
    console.log('⚠️ Test 12: Error handling - Invalid data');
    const invalidResult = await makeRequest('/calculations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freeUser.token}`
      },
      body: JSON.stringify({
        title: '',
        loanAmount: -1000,
        interestRate: 100,
        loanTerm: 0
      })
    });
    
    if (!invalidResult.ok) {
      console.log('✅ Invalid data properly rejected');
      console.log(`   Error: ${invalidResult.data.error}`);
    } else {
      console.log('❌ Invalid data was accepted (should be rejected)');
    }
    console.log('');

    console.log('🎉 Calculation Endpoints Test Suite Completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    // Cleanup test users
    console.log('\n🧹 Cleaning up test users...');
    try {
      for (const userData of Object.values(testUsers)) {
        try {
          const user = await admin.auth().getUserByEmail(userData.email);
          await admin.auth().deleteUser(user.uid);
          console.log(`Deleted test user: ${userData.email}`);
        } catch (error) {
          // User might not exist
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }
}

// Run the tests
if (require.main === module) {
  testCalculationEndpoints().catch(console.error);
}

module.exports = { testCalculationEndpoints };