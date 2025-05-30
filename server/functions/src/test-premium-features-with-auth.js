const axios = require('axios');
const admin = require('firebase-admin');

// Configuration
const BASE_URL = 'http://localhost:5001/mortgage-firebase-firebase/europe-west3/api';
const AUTH_EMULATOR_URL = 'http://localhost:9099';

// Test users
const TEST_USERS = {
  premium: {
    email: 'premium-test@example.com',
    password: 'testpassword123',
    displayName: 'Premium Test User'
  },
  free: {
    email: 'free-test@example.com', 
    password: 'testpassword123',
    displayName: 'Free Test User'
  }
};

let premiumUserToken = '';
let freeUserToken = '';
let testCalculationId = '';

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'mortgage-firebase-firebase'
  });
}

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Create a Firebase Auth user in emulator
const createFirebaseUser = async (userInfo) => {
  try {
    // Create user with Firebase Admin
    const userRecord = await admin.auth().createUser({
      email: userInfo.email,
      password: userInfo.password,
      displayName: userInfo.displayName
    });

    // Create custom token for testing
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    // Exchange custom token for ID token using Firebase Auth REST API
    const tokenResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );

    return {
      uid: userRecord.uid,
      idToken: tokenResponse.data.idToken,
      email: userInfo.email
    };
  } catch (error) {
    console.error('Error creating Firebase user:', error.message);
    throw error;
  }
};

// Set user tier in Firestore
const setUserTier = async (uid, tier) => {
  try {
    await admin.firestore().collection('users').doc(uid).set({
      tier: tier,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user tier:', error.message);
    throw error;
  }
};

// Test functions
async function setupTestUsers() {
  console.log('\n🔧 Setting up test users...');
  
  try {
    // Create premium user
    console.log('Creating premium user...');
    const premiumUser = await createFirebaseUser(TEST_USERS.premium);
    await setUserTier(premiumUser.uid, 'premium');
    premiumUserToken = premiumUser.idToken;
    console.log('✅ Premium user created:', premiumUser.email);

    // Create free user
    console.log('Creating free user...');
    const freeUser = await createFirebaseUser(TEST_USERS.free);
    await setUserTier(freeUser.uid, 'free');
    freeUserToken = freeUser.idToken;
    console.log('✅ Free user created:', freeUser.email);

    return true;
  } catch (error) {
    console.error('❌ Failed to setup test users:', error.message);
    return false;
  }
}

async function testPremiumAccessControl() {
  console.log('\n🔒 Testing Premium Access Control...');
  
  // Test premium user can access premium features
  console.log('Testing premium user access...');
  const premiumAccess = await makeRequest('GET', '/comparisons', null, premiumUserToken);
  if (premiumAccess.success) {
    console.log('✅ Premium user can access comparison features');
  } else {
    console.log('❌ Premium user access failed:', premiumAccess.error);
    return false;
  }

  // Test free user cannot access premium features
  console.log('Testing free user access (should fail)...');
  const freeAccess = await makeRequest('GET', '/comparisons', null, freeUserToken);
  if (!freeAccess.success && freeAccess.status === 403) {
    console.log('✅ Free user properly denied access to premium features');
  } else {
    console.log('❌ Free user access control failed:', freeAccess);
    return false;
  }

  // Test unauthenticated access
  console.log('Testing unauthenticated access (should fail)...');
  const noAuthAccess = await makeRequest('GET', '/comparisons');
  if (!noAuthAccess.success && noAuthAccess.status === 401) {
    console.log('✅ Unauthenticated access properly denied');
  } else {
    console.log('❌ Unauthenticated access control failed:', noAuthAccess);
    return false;
  }

  return true;
}

async function testCalculationCreation() {
  console.log('\n📊 Testing Calculation Creation...');
  
  const calculationData = {
    title: 'Premium Test Calculation',
    loanAmount: 500000,
    interestRate: 4.5,
    loanTerm: 30,
    downPayment: 100000
  };

  const result = await makeRequest('POST', '/calculations', calculationData, premiumUserToken);
  
  if (result.success) {
    testCalculationId = result.data.data.id;
    console.log('✅ Test calculation created:', testCalculationId);
    console.log(`   Monthly Payment: $${result.data.data.results.monthlyPayment.toFixed(2)}`);
    console.log(`   Total Interest: $${result.data.data.results.totalInterest.toLocaleString()}`);
    return true;
  } else {
    console.log('❌ Failed to create test calculation:', result.error);
    return false;
  }
}

async function testLoanComparison() {
  console.log('\n🔄 Testing Loan Comparison Engine...');
  
  const comparisonData = {
    title: 'Premium Loan Comparison Test',
    loans: [
      {
        title: 'Loan Option A - 4.5%',
        loanAmount: 500000,
        interestRate: 4.5,
        loanTerm: 30,
        downPayment: 100000
      },
      {
        title: 'Loan Option B - 4.0%',
        loanAmount: 500000,
        interestRate: 4.0,
        loanTerm: 30,
        downPayment: 100000
      },
      {
        title: 'Loan Option C - 5.0%',
        loanAmount: 500000,
        interestRate: 5.0,
        loanTerm: 25,
        downPayment: 100000
      }
    ]
  };

  // Test comparison calculation
  console.log('Testing comparison calculation...');
  const calcResult = await makeRequest('POST', '/comparisons/calculate', comparisonData, premiumUserToken);
  
  if (calcResult.success) {
    const results = calcResult.data.data;
    console.log('✅ Comparison calculation successful');
    console.log(`   Best loan: ${results.summary.bestLoan.title}`);
    console.log(`   Total savings: $${results.summary.totalSavings.toLocaleString()}`);
    console.log(`   Loans compared: ${results.loans.length}`);
  } else {
    console.log('❌ Comparison calculation failed:', calcResult.error);
    return false;
  }

  // Test saving comparison
  console.log('Testing comparison save...');
  const saveResult = await makeRequest('POST', '/comparisons/save', comparisonData, premiumUserToken);
  
  if (saveResult.success) {
    const comparisonId = saveResult.data.data.id;
    console.log('✅ Comparison saved:', comparisonId);
    
    // Test retrieving saved comparison
    const getResult = await makeRequest('GET', `/comparisons/${comparisonId}`, null, premiumUserToken);
    if (getResult.success) {
      console.log('✅ Comparison retrieved successfully');
    } else {
      console.log('❌ Failed to retrieve comparison:', getResult.error);
      return false;
    }
  } else {
    console.log('❌ Failed to save comparison:', saveResult.error);
    return false;
  }

  // Test listing comparisons
  console.log('Testing comparison listing...');
  const listResult = await makeRequest('GET', '/comparisons', null, premiumUserToken);
  
  if (listResult.success) {
    console.log(`✅ Listed ${listResult.data.data.comparisons.length} comparisons`);
  } else {
    console.log('❌ Failed to list comparisons:', listResult.error);
    return false;
  }

  return true;
}

async function testScenarioModeling() {
  console.log('\n📈 Testing Scenario Modeling...');
  
  if (!testCalculationId) {
    console.log('❌ No test calculation available for scenario modeling');
    return false;
  }

  // Test rate change scenarios
  console.log('Testing rate change scenario generation...');
  const rateResult = await makeRequest('POST', '/scenarios/rate-change', null, premiumUserToken);
  
  if (rateResult.success) {
    console.log(`✅ Generated ${rateResult.data.data.length} rate change scenarios`);
  } else {
    console.log('❌ Failed to generate rate change scenarios:', rateResult.error);
    return false;
  }

  // Test stress test scenarios
  console.log('Testing stress test scenario generation...');
  const stressResult = await makeRequest('POST', '/scenarios/stress-test', null, premiumUserToken);
  
  if (stressResult.success) {
    console.log(`✅ Generated ${stressResult.data.data.length} stress test scenarios`);
  } else {
    console.log('❌ Failed to generate stress test scenarios:', stressResult.error);
    return false;
  }

  // Test custom what-if analysis
  console.log('Testing custom what-if analysis...');
  const scenarioData = {
    title: 'Premium Scenario Analysis Test',
    baseCalculationId: testCalculationId,
    scenarios: [
      {
        name: 'Rate Increase +1%',
        type: 'rate-change',
        parameters: {
          rateChange: 1.0
        }
      },
      {
        name: 'Extra Payment $500/month',
        type: 'what-if',
        parameters: {
          extraPayment: 500
        }
      },
      {
        name: 'Moderate Recession Stress Test',
        type: 'stress-test',
        parameters: {
          stressLevel: 'moderate'
        }
      }
    ]
  };

  const whatIfResult = await makeRequest('POST', '/scenarios/what-if', scenarioData, premiumUserToken);
  
  if (whatIfResult.success) {
    const results = whatIfResult.data.data;
    console.log('✅ What-if analysis successful');
    console.log(`   Scenarios analyzed: ${results.scenarios.length}`);
    console.log(`   Best case: ${results.analysis.bestCase.description}`);
    console.log(`   Worst case: ${results.analysis.worstCase.description}`);
    console.log(`   Risk level: ${results.analysis.riskAssessment.overall}`);
  } else {
    console.log('❌ What-if analysis failed:', whatIfResult.error);
    return false;
  }

  // Test saving scenario analysis
  console.log('Testing scenario analysis save...');
  const saveResult = await makeRequest('POST', '/scenarios/save', scenarioData, premiumUserToken);
  
  if (saveResult.success) {
    console.log('✅ Scenario analysis saved:', saveResult.data.data.id);
  } else {
    console.log('❌ Failed to save scenario analysis:', saveResult.error);
    return false;
  }

  return true;
}

async function testExportGeneration() {
  console.log('\n📄 Testing Export Generation...');
  
  if (!testCalculationId) {
    console.log('❌ No test calculation available for export');
    return false;
  }

  // Test PDF export
  console.log('Testing PDF export...');
  const pdfResult = await makeRequest('POST', '/exports/pdf', {
    dataType: 'calculation',
    dataId: testCalculationId
  }, premiumUserToken);
  
  if (pdfResult.success) {
    const exportId = pdfResult.data.data.id;
    console.log('✅ PDF export request created:', exportId);
    console.log(`   Status: ${pdfResult.data.data.status}`);
    
    // Test export status check
    const statusResult = await makeRequest('GET', `/exports/${exportId}`, null, premiumUserToken);
    if (statusResult.success) {
      console.log('✅ Export status retrieved successfully');
    }
  } else {
    console.log('❌ PDF export failed:', pdfResult.error);
    return false;
  }

  // Test Excel export
  console.log('Testing Excel export...');
  const excelResult = await makeRequest('POST', '/exports/excel', {
    dataType: 'calculation',
    dataId: testCalculationId
  }, premiumUserToken);
  
  if (excelResult.success) {
    console.log('✅ Excel export request created:', excelResult.data.data.id);
  } else {
    console.log('❌ Excel export failed:', excelResult.error);
    return false;
  }

  // Test CSV export
  console.log('Testing CSV export...');
  const csvResult = await makeRequest('POST', '/exports/csv', {
    dataType: 'calculation',
    dataId: testCalculationId
  }, premiumUserToken);
  
  if (csvResult.success) {
    console.log('✅ CSV export request created:', csvResult.data.data.id);
  } else {
    console.log('❌ CSV export failed:', csvResult.error);
    return false;
  }

  // Test export history
  console.log('Testing export history...');
  const historyResult = await makeRequest('GET', '/exports/history', null, premiumUserToken);
  
  if (historyResult.success) {
    console.log(`✅ Retrieved export history: ${historyResult.data.data.exports.length} exports`);
  } else {
    console.log('❌ Failed to retrieve export history:', historyResult.error);
    return false;
  }

  return true;
}

async function testInputValidation() {
  console.log('\n✅ Testing Input Validation...');
  
  // Test invalid loan comparison (too many loans)
  console.log('Testing loan comparison validation (too many loans)...');
  const invalidComparison = {
    title: 'Invalid Comparison',
    loans: Array(6).fill({
      title: 'Invalid Loan',
      loanAmount: 100000,
      interestRate: 4.0,
      loanTerm: 30
    })
  };

  const invalidResult = await makeRequest('POST', '/comparisons/calculate', invalidComparison, premiumUserToken);
  
  if (!invalidResult.success && invalidResult.status === 400) {
    console.log('✅ Validation properly rejected invalid input');
  } else {
    console.log('❌ Validation failed to reject invalid input:', invalidResult);
    return false;
  }

  // Test invalid loan parameters
  console.log('Testing loan parameter validation...');
  const invalidLoan = {
    title: 'Invalid Parameters',
    loans: [{
      title: 'Bad Loan',
      loanAmount: 100, // Too small
      interestRate: 60, // Too high
      loanTerm: 100 // Too long
    }]
  };

  const paramResult = await makeRequest('POST', '/comparisons/calculate', invalidLoan, premiumUserToken);
  
  if (!paramResult.success && paramResult.status === 400) {
    console.log('✅ Parameter validation working correctly');
  } else {
    console.log('❌ Parameter validation failed:', paramResult);
    return false;
  }

  return true;
}

async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...');
  
  try {
    // Delete test users from Firebase Auth
    const users = await admin.auth().listUsers();
    for (const user of users.users) {
      if (user.email && (user.email.includes('premium-test') || user.email.includes('free-test'))) {
        await admin.auth().deleteUser(user.uid);
        console.log(`✅ Deleted user: ${user.email}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error.message);
  }
}

// Main test runner
async function runPremiumFeaturesTests() {
  console.log('🚀 Starting Premium Features Test Suite with Authentication...');
  console.log('='.repeat(70));
  
  const tests = [
    { name: 'Setup Test Users', fn: setupTestUsers },
    { name: 'Premium Access Control', fn: testPremiumAccessControl },
    { name: 'Calculation Creation', fn: testCalculationCreation },
    { name: 'Loan Comparison Engine', fn: testLoanComparison },
    { name: 'Scenario Modeling', fn: testScenarioModeling },
    { name: 'Export Generation', fn: testExportGeneration },
    { name: 'Input Validation', fn: testInputValidation }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📋 Running: ${test.name}`);
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR -`, error.message);
      failed++;
    }
  }
  
  // Cleanup
  await cleanupTestUsers();
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 Premium Features Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL PREMIUM FEATURES TESTS PASSED!');
    console.log('✅ Premium Features System is working correctly');
    console.log('✅ Authentication and authorization working');
    console.log('✅ All premium endpoints functional');
    console.log('✅ Input validation working');
    console.log('✅ Ready for production use');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPremiumFeaturesTests().catch(console.error);
}

module.exports = {
  runPremiumFeaturesTests,
  setupTestUsers,
  testPremiumAccessControl,
  testLoanComparison,
  testScenarioModeling,
  testExportGeneration
};