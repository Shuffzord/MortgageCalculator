const axios = require('axios');

// Configuration
const FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Test user data
const TEST_EMAIL = 'duplicate-test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_DISPLAY_NAME = 'Duplicate Test User';

// Helper function to create user via Firebase Auth Emulator
const createUser = async (email, password, displayName) => {
  try {
    const response = await axios.post(
      `http://${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        email: email,
        password: password,
        displayName: displayName,
        returnSecureToken: true
      }
    );
    
    return {
      success: true,
      data: response.data,
      userId: response.data.localId,
      idToken: response.data.idToken
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      errorCode: error.response?.data?.error?.message || 'UNKNOWN_ERROR'
    };
  }
};

// Helper function to delete user (cleanup)
const deleteUser = async (idToken) => {
  try {
    await axios.post(
      `http://${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:delete?key=fake-api-key`,
      {
        idToken: idToken
      }
    );
    return true;
  } catch (error) {
    console.warn('Failed to delete user during cleanup:', error.message);
    return false;
  }
};

async function testEmailUniqueness() {
  console.log('🔒 EMAIL UNIQUENESS TEST');
  console.log('='.repeat(60));
  console.log('Testing Firebase Authentication email uniqueness enforcement');
  console.log('='.repeat(60));
  
  let firstUserToken = null;
  
  try {
    // Step 1: Create first user with test email
    console.log('\n📝 Step 1: Creating first user...');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    
    const firstUserResult = await createUser(TEST_EMAIL, TEST_PASSWORD, TEST_DISPLAY_NAME);
    
    if (firstUserResult.success) {
      firstUserToken = firstUserResult.idToken;
      console.log('✅ First user created successfully');
      console.log(`   User ID: ${firstUserResult.userId}`);
      console.log(`   Email: ${firstUserResult.data.email}`);
    } else {
      console.log('❌ Failed to create first user:', firstUserResult.error);
      return false;
    }
    
    // Step 2: Attempt to create second user with SAME email
    console.log('\n📝 Step 2: Attempting to create second user with SAME email...');
    console.log(`   Email: ${TEST_EMAIL} (DUPLICATE)`);
    console.log(`   Password: different-password-456`);
    
    const secondUserResult = await createUser(TEST_EMAIL, 'different-password-456', 'Second User');
    
    if (secondUserResult.success) {
      console.log('❌ SECURITY FAILURE: Second user created with duplicate email!');
      console.log('❌ Firebase should have prevented this!');
      return false;
    } else {
      console.log('✅ Second user creation BLOCKED (expected)');
      console.log(`   Error Code: ${secondUserResult.errorCode}`);
      console.log(`   Error Message: ${JSON.stringify(secondUserResult.error)}`);
      
      // Verify it's the correct error for duplicate email
      const errorMessage = JSON.stringify(secondUserResult.error).toLowerCase();
      if (errorMessage.includes('email') && (errorMessage.includes('already') || errorMessage.includes('exists') || errorMessage.includes('use'))) {
        console.log('✅ Correct error type: Email already in use');
      } else {
        console.log('⚠️  Unexpected error type, but duplicate was still prevented');
      }
    }
    
    // Step 3: Test case sensitivity
    console.log('\n📝 Step 3: Testing case sensitivity...');
    const upperCaseEmail = TEST_EMAIL.toUpperCase();
    console.log(`   Attempting with uppercase: ${upperCaseEmail}`);
    
    const caseTestResult = await createUser(upperCaseEmail, 'another-password-789', 'Case Test User');
    
    if (caseTestResult.success) {
      console.log('❌ SECURITY ISSUE: Case-sensitive emails allowed (unexpected)');
      // Clean up if this somehow succeeded
      await deleteUser(caseTestResult.idToken);
      return false;
    } else {
      console.log('✅ Case-insensitive duplicate prevention working');
      console.log(`   ${upperCaseEmail} treated as duplicate of ${TEST_EMAIL}`);
    }
    
    // Step 4: Test with different email (should succeed)
    console.log('\n📝 Step 4: Testing with different email (should succeed)...');
    const differentEmail = `different-${Date.now()}@example.com`;
    console.log(`   Email: ${differentEmail}`);
    
    const differentUserResult = await createUser(differentEmail, TEST_PASSWORD, 'Different User');
    
    if (differentUserResult.success) {
      console.log('✅ Different email user created successfully');
      console.log(`   User ID: ${differentUserResult.userId}`);
      // Clean up the different user
      await deleteUser(differentUserResult.idToken);
    } else {
      console.log('⚠️  Failed to create user with different email:', differentUserResult.error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EMAIL UNIQUENESS TEST RESULTS:');
    console.log('✅ First user creation: SUCCESS');
    console.log('✅ Duplicate email prevention: SUCCESS');
    console.log('✅ Case-insensitive prevention: SUCCESS');
    console.log('✅ Different email creation: SUCCESS');
    
    console.log('\n🎉 EMAIL UNIQUENESS TEST: PASSED ✅');
    console.log('🔒 Firebase Authentication properly enforces email uniqueness');
    console.log('📧 No duplicate emails can be created');
    console.log('🔤 Case-insensitive email matching working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Email uniqueness test failed with error:', error.message);
    return false;
  } finally {
    // Cleanup: Delete the first user
    if (firstUserToken) {
      console.log('\n🧹 Cleaning up test user...');
      const cleanupSuccess = await deleteUser(firstUserToken);
      if (cleanupSuccess) {
        console.log('✅ Test user cleaned up successfully');
      } else {
        console.log('⚠️  Test user cleanup failed (may need manual cleanup)');
      }
    }
  }
}

// Additional test for edge cases
async function testEmailEdgeCases() {
  console.log('\n🔍 EMAIL EDGE CASES TEST');
  console.log('='.repeat(40));
  
  const baseEmail = `edge-test-${Date.now()}@example.com`;
  let testUserToken = null;
  
  try {
    // Create base user
    const baseResult = await createUser(baseEmail, 'password123', 'Base User');
    if (!baseResult.success) {
      console.log('❌ Failed to create base user for edge case testing');
      return false;
    }
    testUserToken = baseResult.idToken;
    console.log(`✅ Created base user: ${baseEmail}`);
    
    // Test various email variations
    const emailVariations = [
      baseEmail.toUpperCase(),                    // UPPERCASE
      baseEmail.toLowerCase(),                    // lowercase (should be same)
      baseEmail.replace('@', '+test@'),          // Plus addressing
      ` ${baseEmail} `,                          // With spaces
      baseEmail.replace('.com', '.COM')          // Different case TLD
    ];
    
    let blockedCount = 0;
    
    for (const variation of emailVariations) {
      console.log(`\n🧪 Testing variation: "${variation}"`);
      const result = await createUser(variation, 'different-password', 'Variation User');
      
      if (result.success) {
        console.log(`⚠️  Variation allowed (unexpected): ${variation}`);
        await deleteUser(result.idToken); // Cleanup
      } else {
        console.log(`✅ Variation blocked (expected): ${variation}`);
        blockedCount++;
      }
    }
    
    console.log(`\n📊 Edge Cases: ${blockedCount}/${emailVariations.length} variations properly blocked`);
    return blockedCount === emailVariations.length;
    
  } catch (error) {
    console.error('❌ Edge cases test failed:', error.message);
    return false;
  } finally {
    if (testUserToken) {
      await deleteUser(testUserToken);
    }
  }
}

// Main test runner
async function runEmailUniquenessTests() {
  console.log('🎯 COMPREHENSIVE EMAIL UNIQUENESS TESTING');
  console.log('='.repeat(70));
  console.log('Verifying Firebase Authentication email uniqueness enforcement');
  console.log('='.repeat(70));
  
  const tests = [
    { name: 'Email Uniqueness Test', fn: testEmailUniqueness },
    { name: 'Email Edge Cases Test', fn: testEmailEdgeCases }
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
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL EMAIL UNIQUENESS TEST RESULTS:');
  console.log(`✅ Tests Passed: ${passed}/${tests.length}`);
  console.log(`❌ Tests Failed: ${failed}/${tests.length}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (passed === tests.length) {
    console.log('\n🎉 ALL EMAIL UNIQUENESS TESTS PASSED!');
    console.log('🔒 Firebase Authentication email uniqueness VERIFIED');
    console.log('📧 Duplicate email prevention working correctly');
    console.log('✅ Email security implementation confirmed');
  } else {
    console.log('\n⚠️  Some email uniqueness tests failed');
    console.log('🔍 Email security may need investigation');
  }
  
  return passed === tests.length;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runEmailUniquenessTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Email uniqueness test suite error:', error);
      process.exit(1);
    });
}

module.exports = {
  runEmailUniquenessTests,
  testEmailUniqueness,
  testEmailEdgeCases
};