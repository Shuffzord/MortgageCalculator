const axios = require('axios');

// Configuration for Firebase Emulator
const BASE_URL = 'http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Test data
const testData = {
  priceId: 'price_premium_monthly', // This should match your Stripe price ID
  successUrl: 'http://localhost:5173/success',
  cancelUrl: 'http://localhost:5173/cancel'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testPaymentConfig = async () => {
  console.log('\n=== Testing Payment Config ===');
  try {
    const result = await makeRequest('GET', '/payments/config');
    console.log('✅ Payment config retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Payment config test failed');
    return false;
  }
};

const testSubscriptionPlans = async () => {
  console.log('\n=== Testing Subscription Plans ===');
  try {
    const result = await makeRequest('GET', '/payments/plans');
    console.log('✅ Subscription plans retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Subscription plans test failed');
    return false;
  }
};

const testPaymentSystem = async () => {
  console.log('\n=== Testing Payment System (Authenticated) ===');
  try {
    const result = await makeRequest('GET', '/payments/test');
    console.log('✅ Payment system test passed:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Payment system test failed');
    return false;
  }
};

const testSubscriptionSystem = async () => {
  console.log('\n=== Testing Subscription System (Authenticated) ===');
  try {
    const result = await makeRequest('GET', '/subscription/test');
    console.log('✅ Subscription system test passed:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Subscription system test failed');
    return false;
  }
};

const testSubscriptionStatus = async () => {
  console.log('\n=== Testing Subscription Status ===');
  try {
    const result = await makeRequest('GET', '/subscription/status');
    console.log('✅ Subscription status retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Subscription status test failed');
    return false;
  }
};

const testPaymentHistory = async () => {
  console.log('\n=== Testing Payment History ===');
  try {
    const result = await makeRequest('GET', '/payments/history');
    console.log('✅ Payment history retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Payment history test failed');
    return false;
  }
};

const testCreateCheckoutSession = async () => {
  console.log('\n=== Testing Create Checkout Session ===');
  try {
    const result = await makeRequest('POST', '/payments/create-checkout-session', testData);
    console.log('✅ Checkout session created:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Create checkout session test failed');
    return false;
  }
};

const testCustomerPortal = async () => {
  console.log('\n=== Testing Customer Portal ===');
  try {
    const result = await makeRequest('GET', '/subscription/portal');
    console.log('✅ Customer portal URL retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Customer portal test failed');
    return false;
  }
};

const testSubscriptionDetails = async () => {
  console.log('\n=== Testing Subscription Details ===');
  try {
    const result = await makeRequest('GET', '/subscription/details');
    console.log('✅ Subscription details retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Subscription details test failed');
    return false;
  }
};

const testPaymentMethods = async () => {
  console.log('\n=== Testing Payment Methods ===');
  try {
    const result = await makeRequest('GET', '/subscription/payment-methods');
    console.log('✅ Payment methods retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Payment methods test failed');
    return false;
  }
};

const testInvoices = async () => {
  console.log('\n=== Testing Invoices ===');
  try {
    const result = await makeRequest('GET', '/subscription/invoices');
    console.log('✅ Invoices retrieved:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Invoices test failed');
    return false;
  }
};

// Authentication helper
const authenticateUser = async () => {
  console.log('\n=== Authenticating Test User ===');
  try {
    // First try to register the user
    try {
      await makeRequest('POST', '/auth/register', {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        displayName: 'Test User'
      });
      console.log('✅ Test user registered');
    } catch (error) {
      // User might already exist, that's okay
      console.log('ℹ️ User might already exist, continuing...');
    }

    // Login to get token
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (loginResult.success && loginResult.data.token) {
      authToken = loginResult.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Payment System Tests...');
  console.log(`Base URL: ${BASE_URL}`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const runTest = async (testName, testFunction) => {
    results.total++;
    try {
      const success = await testFunction();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
    }
  };

  // Run unauthenticated tests first
  await runTest('Payment Config', testPaymentConfig);
  await runTest('Subscription Plans', testSubscriptionPlans);

  // Authenticate user
  const authSuccess = await authenticateUser();
  
  if (authSuccess) {
    // Run authenticated tests
    await runTest('Payment System', testPaymentSystem);
    await runTest('Subscription System', testSubscriptionSystem);
    await runTest('Subscription Status', testSubscriptionStatus);
    await runTest('Payment History', testPaymentHistory);
    await runTest('Create Checkout Session', testCreateCheckoutSession);
    await runTest('Customer Portal', testCustomerPortal);
    await runTest('Subscription Details', testSubscriptionDetails);
    await runTest('Payment Methods', testPaymentMethods);
    await runTest('Invoices', testInvoices);
  } else {
    console.log('⚠️ Skipping authenticated tests due to authentication failure');
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All payment system tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }

  process.exit(results.failed === 0 ? 0 : 1);
};

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});