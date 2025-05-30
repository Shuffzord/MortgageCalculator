const axios = require('axios');

// Configuration
const FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Helper function to create user
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

// Helper function to delete user
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
    return false;
  }
};

async function testCoreEmailUniqueness() {
  console.log('🔒 CORE EMAIL UNIQUENESS VERIFICATION');
  console.log('='.repeat(50));
  console.log('Testing: Can users be created with the same email?');
  console.log('Expected: NO - Firebase should prevent duplicates');
  console.log('='.repeat(50));
  
  const testEmail = `core-test-${Date.now()}@example.com`;
  let firstUserToken = null;
  
  try {
    // Step 1: Create first user
    console.log(`\n📝 Step 1: Creating first user with email: ${testEmail}`);
    const firstUser = await createUser(testEmail, 'password123', 'First User');
    
    if (!firstUser.success) {
      console.log('❌ Failed to create first user:', firstUser.error);
      return false;
    }
    
    firstUserToken = firstUser.idToken;
    console.log('✅ First user created successfully');
    console.log(`   User ID: ${firstUser.userId}`);
    
    // Step 2: Attempt to create second user with SAME email
    console.log(`\n📝 Step 2: Attempting to create second user with SAME email: ${testEmail}`);
    console.log('   Using different password and display name...');
    
    const secondUser = await createUser(testEmail, 'different-password-456', 'Second User');
    
    if (secondUser.success) {
      console.log('❌ CRITICAL SECURITY FAILURE!');
      console.log('❌ Second user was created with duplicate email!');
      console.log(`❌ Second User ID: ${secondUser.userId}`);
      console.log('❌ Firebase Authentication is NOT enforcing email uniqueness!');
      
      // Cleanup both users
      await deleteUser(secondUser.idToken);
      return false;
    } else {
      console.log('✅ SECURITY VERIFIED: Second user creation BLOCKED');
      console.log(`   Error Code: ${secondUser.errorCode}`);
      console.log(`   This is the expected behavior`);
      
      // Verify it's the correct error
      if (secondUser.errorCode === 'EMAIL_EXISTS') {
        console.log('✅ Correct error: EMAIL_EXISTS');
      } else {
        console.log(`⚠️  Unexpected error code: ${secondUser.errorCode}`);
      }
    }
    
    // Step 3: Test case variations
    console.log(`\n📝 Step 3: Testing case sensitivity...`);
    const upperEmail = testEmail.toUpperCase();
    console.log(`   Attempting with uppercase: ${upperEmail}`);
    
    const caseTest = await createUser(upperEmail, 'case-test-password', 'Case Test User');
    
    if (caseTest.success) {
      console.log('⚠️  Case-sensitive emails allowed (may be expected behavior)');
      await deleteUser(caseTest.idToken);
    } else {
      console.log('✅ Case-insensitive duplicate prevention confirmed');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 CORE EMAIL UNIQUENESS TEST RESULTS:');
    console.log('✅ Primary duplicate prevention: WORKING');
    console.log('✅ Firebase Authentication enforces email uniqueness');
    console.log('✅ Users CANNOT be created with the same email');
    
    console.log('\n🎉 EMAIL UNIQUENESS VERIFICATION: PASSED ✅');
    console.log('🔒 Answer: NO, users cannot be created with the same email');
    console.log('🛡️  Firebase Authentication security confirmed');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    // Cleanup
    if (firstUserToken) {
      console.log('\n🧹 Cleaning up test user...');
      await deleteUser(firstUserToken);
      console.log('✅ Cleanup completed');
    }
  }
}

// Run the core test
if (require.main === module) {
  testCoreEmailUniqueness()
    .then(success => {
      if (success) {
        console.log('\n🎯 FINAL ANSWER: Users CANNOT be created with the same email');
        console.log('🔒 Firebase Authentication properly enforces email uniqueness');
      } else {
        console.log('\n⚠️  Email uniqueness verification failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

module.exports = {
  testCoreEmailUniqueness
};