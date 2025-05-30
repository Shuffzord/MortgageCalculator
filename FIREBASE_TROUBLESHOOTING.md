# Firebase Authentication Troubleshooting Guide

## Network Request Failed Error

If you're encountering `Firebase: Error (auth/network-request-failed)`, this typically indicates a connectivity issue between the client and Firebase services. Here are the steps to resolve this:

### 1. Check Environment Variables

Ensure you have the correct Firebase configuration in your environment variables. Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Use Firebase Emulator for Development
VITE_USE_FIREBASE_EMULATOR=false
VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

### 2. Firebase Project Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Authentication**:
   - In your Firebase project, go to "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider

3. **Get Configuration**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Add app" and select "Web"
   - Register your app and copy the config object

### 3. Development Options

#### Option A: Use Firebase Emulator (Recommended for Development)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**:
   ```bash
   firebase init
   ```
   - Select "Emulators"
   - Choose "Authentication Emulator" and "Firestore Emulator"

4. **Start the emulators**:
   ```bash
   firebase emulators:start
   ```

5. **Update your .env file**:
   ```env
   VITE_USE_FIREBASE_EMULATOR=true
   VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   VITE_FIREBASE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
   ```

#### Option B: Use a Real Firebase Project

1. **Create a Firebase project** (as described above)
2. **Add your domain to authorized domains**:
   - Go to Authentication > Settings > Authorized domains
   - Add `localhost` for development
   - Add your production domain when deploying

3. **Update your .env file** with real Firebase config values

### 4. Network and Firewall Issues

1. **Check Internet Connection**: Ensure you have a stable internet connection

2. **Firewall/Proxy Issues**:
   - If behind a corporate firewall, ensure Firebase domains are whitelisted:
     - `*.googleapis.com`
     - `*.firebaseapp.com`
     - `*.google.com`

3. **Browser Issues**:
   - Clear browser cache and cookies
   - Disable browser extensions that might block requests
   - Try in incognito/private mode

### 5. CORS Issues

If you're getting CORS errors:

1. **For Development**: Make sure you're running on `localhost` or `127.0.0.1`
2. **For Production**: Add your domain to Firebase authorized domains

### 6. Testing the Setup

You can test your Firebase connection with this simple script:

```javascript
// Test Firebase connection
import { auth } from './src/lib/firebase/config';
import { signInAnonymously } from 'firebase/auth';

// Test connection
signInAnonymously(auth)
  .then(() => {
    console.log('✅ Firebase connection successful');
  })
  .catch((error) => {
    console.error('❌ Firebase connection failed:', error);
  });
```

### 7. Common Error Codes and Solutions

- **auth/network-request-failed**: Network connectivity issue
  - Check internet connection
  - Verify Firebase config
  - Check firewall settings

- **auth/api-key-not-valid**: Invalid API key
  - Verify VITE_FIREBASE_API_KEY in .env
  - Regenerate API key in Firebase console

- **auth/app-not-authorized**: Domain not authorized
  - Add domain to Firebase authorized domains

- **auth/project-not-found**: Invalid project ID
  - Verify VITE_FIREBASE_PROJECT_ID in .env

### 8. Quick Setup for Testing

If you want to quickly test the authentication UI without setting up Firebase:

1. **Use Firebase Emulator**:
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Start auth emulator only
   firebase emulators:start --only auth
   ```

2. **Update .env**:
   ```env
   VITE_USE_FIREBASE_EMULATOR=true
   VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

### 9. Debugging Steps

1. **Check Browser Console**: Look for detailed error messages
2. **Check Network Tab**: See if requests are being made to Firebase
3. **Verify Environment Variables**: Use `console.log(import.meta.env)` to check
4. **Test with Minimal Config**: Try with just the required fields

### 10. Production Deployment

When deploying to production:

1. **Update Environment Variables** with production Firebase config
2. **Add Production Domain** to Firebase authorized domains
3. **Enable Required APIs** in Google Cloud Console
4. **Set up Proper CORS** if using custom domains

## Support

If you continue to experience issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs/auth)
2. Visit [Firebase Support](https://firebase.google.com/support)
3. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase-authentication) for similar issues

## Sample Firebase Configuration

Here's a complete example of what your Firebase setup should look like:

```typescript
// firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// For development with emulator
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}
```

This should resolve most Firebase authentication network issues you might encounter.