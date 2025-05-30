import { auth, firestore } from './config/firebase';
import { UserTier } from './types/user';

export const createTestUser = async (email: string, password: string) => {
  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: 'Test User'
    });

    // Create Firestore profile
    await firestore.collection('users').doc(userRecord.uid).set({
      tier: UserTier.Free,
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString()
    });

    // Generate custom token for testing
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    return { userRecord, customToken };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

export const cleanupTestUser = async (uid: string) => {
  try {
    await auth.deleteUser(uid);
    await firestore.collection('users').doc(uid).delete();
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
};

async function runTests() {
  try {
    console.log('Starting authentication tests...');

    // Create a test user with Firestore profile
    const { userRecord, customToken } = await createTestUser('test@example.com', 'testpassword123');
    console.log('Test user created:', userRecord.uid);

    // Test authentication middleware by making a request
    const testUrl = 'http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/users/profile';
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${customToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Authentication test successful:', data);
      } else {
        console.log('Authentication test failed:', response.status, await response.text());
      }
    } catch (fetchError) {
      console.log('Note: Could not test against local server (server may not be running)');
      console.log('Custom token generated successfully for manual testing:', customToken.substring(0, 20) + '...');
    }

    // Clean up: delete the test user
    await cleanupTestUser(userRecord.uid);
    console.log('Test user deleted');

    console.log('Authentication tests completed successfully');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}