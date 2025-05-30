# Environment Variable Loading Issue - Quick Fix

## Problem
The debug console shows environment variables as `undefined`, which means Vite isn't loading the `.env` file properly.

## Quick Solutions

### 1. Restart Development Server (Most Common Fix)
```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Check .env File Location
Make sure the `.env` file is in the **root directory** (same level as `package.json`), not in the `client/` folder.

### 3. Clear Vite Cache
```bash
# Stop dev server, then:
rm -rf node_modules/.vite
npm run dev
```

### 4. Force Environment Reload
```bash
# Stop dev server
# Delete cache
rm -rf .vite
# Restart
npm run dev
```

### 5. Manual Verification
Add this to your browser console to check if env vars are loaded:
```javascript
console.log('All env vars:', import.meta.env);
console.log('Firebase emulator:', import.meta.env.VITE_USE_FIREBASE_EMULATOR);
```

### 6. Alternative: Hard-code for Testing
If environment variables still don't work, temporarily hard-code the values in `client/src/lib/firebase/config.ts`:

```typescript
// Temporary fix - replace the emulator connection section with:
if (true) { // Force emulator mode
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('🔥 Firebase Auth emulator connected: http://127.0.0.1:9099');
  } catch (error) {
    console.log('Firebase emulator already connected or failed:', error.message);
  }
}
```

## Expected Result
After fixing, the debug console should show:
```
ENV - USE_EMULATOR: true
ENV - AUTH_HOST: 127.0.0.1:9099
ENV - PROJECT_ID: mortgage-firebase-firebase
```

## Test Steps
1. Restart dev server: `npm run dev`
2. Visit: `http://localhost:3000/en/firebase-debug`
3. Check if environment variables are now loaded
4. Run the "Test Email Auth" button
5. Should work without network errors

The most common fix is simply restarting the development server!