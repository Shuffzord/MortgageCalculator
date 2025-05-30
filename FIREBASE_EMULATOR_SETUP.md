# Firebase Emulator Setup & Troubleshooting

## Current Setup Status

Based on your configuration, you have:
- ✅ Firebase emulators running on port 9099 (Auth) and 5001 (Functions)
- ✅ Environment variables configured correctly
- ❌ Network request failed error when trying to sign up

## Quick Debugging Steps

### 1. Access the Debug Console

Navigate to: `http://localhost:3000/en/firebase-debug`

This will show you:
- Firebase configuration details
- Environment variable values
- Connection test results

### 2. Check Browser Console

Open your browser's developer tools and look for:
- Firebase configuration logs
- Emulator connection messages
- Any network errors

### 3. Verify Emulator Status

Make sure your Firebase emulators are running:
```bash
firebase emulators:start
```

You should see:
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000/               │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
└────────────────┴────────────────┴─────────────────────────────────┘
```

### 4. Test Direct Connection

Try accessing the emulator directly:
- Auth Emulator UI: http://127.0.0.1:4000/auth
- Functions Emulator UI: http://127.0.0.1:4000/functions

### 5. Common Issues & Solutions

#### Issue: "network-request-failed"
**Possible Causes:**
1. **Emulator not running**: Restart Firebase emulators
2. **Port conflicts**: Check if ports 9099/5001 are available
3. **Firewall blocking**: Allow localhost connections
4. **Browser cache**: Clear cache and hard refresh
5. **CORS issues**: Emulator should handle this automatically

**Solutions:**
```bash
# 1. Restart emulators
firebase emulators:start --only auth

# 2. Check port availability
netstat -an | findstr :9099
netstat -an | findstr :5001

# 3. Try different ports (if needed)
firebase emulators:start --only auth --port 9098
```

#### Issue: Emulator connection timing out
**Solution:** Update your .env file:
```env
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
# or try
VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

#### Issue: Environment variables not loading
**Solution:** Restart your development server:
```bash
npm run dev
```

### 6. Manual Test

You can test the emulator directly with curl:
```bash
# Test if auth emulator is responding
curl -X POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","returnSecureToken":true}'
```

### 7. Alternative: Use Production Firebase

If emulator issues persist, you can temporarily use a real Firebase project:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication > Email/Password
3. Get your config from Project Settings
4. Update your .env:
```env
VITE_USE_FIREBASE_EMULATOR=false
VITE_FIREBASE_API_KEY=your-real-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other real config values
```

### 8. Debug Output

When you visit `/en/firebase-debug`, you should see output like:
```
🔧 Firebase configuration:
  projectId: mortgage-firebase-firebase
  authDomain: mortgage-firebase-firebase.firebaseapp.com
  useEmulator: true
  authEmulatorHost: 127.0.0.1:9099
  isDev: true
  mode: development

🔥 Firebase Auth emulator connected: http://127.0.0.1:9099
✅ Firebase emulators already connected
```

### 9. Next Steps

1. **Visit the debug page**: `/en/firebase-debug`
2. **Run the tests** in the debug console
3. **Check browser console** for detailed error messages
4. **Try anonymous auth first** (simpler test)
5. **If that works, try email auth**

### 10. If All Else Fails

Create a minimal test:
```javascript
// In browser console
import { auth } from './src/lib/firebase/config';
import { signInAnonymously } from 'firebase/auth';

signInAnonymously(auth)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

## Expected Behavior

When working correctly:
1. Navigate to `/en/auth`
2. Click "Sign Up"
3. Fill in email/password
4. Should create account in emulator
5. Check http://127.0.0.1:4000/auth to see the created user

Let me know what you see in the debug console and browser console!