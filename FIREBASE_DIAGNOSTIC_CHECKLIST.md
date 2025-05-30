# Firebase Functions Diagnostic Checklist
## Troubleshooting Guide for Backend Issues

### 🔍 **Pre-Deployment Diagnostics**

#### ✅ **1. Firebase Project Configuration**
```bash
# Check Firebase project status
firebase projects:list

# Verify current project
firebase use --add

# Expected output: mortgage-firebase-firebase should be listed and active
```

**Common Issues:**
- ❌ Project not found → Run `firebase login` and verify project access
- ❌ Wrong project selected → Run `firebase use mortgage-firebase-firebase`
- ❌ Insufficient permissions → Check IAM roles in Firebase Console

#### ✅ **2. Firebase Functions Structure**
```bash
# Verify directory structure
ls -la server/
ls -la server/functions/
ls -la server/functions/src/

# Expected structure:
server/
├── firebase.json
├── .firebaserc
└── functions/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── app.ts
        └── [other Express files]
```

**Common Issues:**
- ❌ Missing `firebase.json` → Run `firebase init functions`
- ❌ Wrong source directory in `firebase.json` → Should point to `functions`
- ❌ Missing Express app files → Copy from `server/src/` to `server/functions/src/`

#### ✅ **3. Dependencies Check**
```bash
cd server/functions
npm list --depth=0

# Required dependencies should include:
# ├── firebase-admin@^12.6.0
# ├── firebase-functions@^6.0.1
# ├── express@^4.18.2
# └── [other Express dependencies]
```

**Common Issues:**
- ❌ Missing dependencies → Run `npm install`
- ❌ Version conflicts → Check `package.json` and update versions
- ❌ Node version mismatch → Ensure Node 22 is used (check `engines` in package.json)

---

### 🧪 **Local Testing Diagnostics**

#### ✅ **4. TypeScript Compilation**
```bash
cd server/functions
npm run build

# Expected: No compilation errors
# Check for TypeScript errors in output
```

**Common Issues:**
- ❌ TypeScript errors → Fix type issues in your code
- ❌ Missing type definitions → Install `@types/` packages
- ❌ Import path issues → Update relative imports for Firebase Functions structure

#### ✅ **5. Firebase Emulator Testing**
```bash
cd server
firebase emulators:start --only functions

# Expected output:
# ✔  functions: Emulator started at http://localhost:5001
# ✔  functions[europe-west3-api]: http function initialized
```

**Test Endpoints:**
```bash
# Health check
curl http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/health

# Version check
curl http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/version

# Expected responses:
# Health: {"status":"ok","timestamp":"...","version":"1.0.0"}
# Version: {"version":"1.0.0","environment":"development"}
```

**Common Issues:**
- ❌ Emulator won't start → Check port 5001 availability
- ❌ Function not found → Verify export in `index.ts`
- ❌ CORS errors → Check CORS configuration in Express app
- ❌ 500 errors → Check Firebase Functions logs

---

### 🔧 **Environment Configuration Diagnostics**

#### ✅ **6. Firebase Functions Config**
```bash
# Check current config
firebase functions:config:get

# Expected output should include:
# {
#   "firebase": {
#     "project_id": "mortgage-firebase-firebase",
#     "client_email": "firebase-adminsdk-...",
#     "private_key": "-----BEGIN PRIVATE KEY-----..."
#   }
# }
```

**Set Missing Config:**
```bash
firebase functions:config:set \
  firebase.project_id="mortgage-firebase-firebase" \
  firebase.client_email="your-service-account-email" \
  firebase.private_key="your-private-key-with-newlines-escaped"
```

**Common Issues:**
- ❌ Missing config values → Set using `firebase functions:config:set`
- ❌ Private key format errors → Ensure newlines are escaped as `\\n`
- ❌ Wrong service account → Verify email matches your Firebase project

#### ✅ **7. Service Account Verification**
```bash
# Test Firebase Admin initialization
node -e "
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const config = functions.config();
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.project_id,
      clientEmail: config.firebase.client_email,
      privateKey: config.firebase.private_key.replace(/\\\\n/g, '\n')
    })
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
}
"
```

**Common Issues:**
- ❌ Invalid private key → Re-download service account key
- ❌ Wrong project ID → Verify project ID matches Firebase Console
- ❌ Service account permissions → Check IAM roles in Google Cloud Console

---

### 🚀 **Deployment Diagnostics**

#### ✅ **8. Pre-Deployment Checks**
```bash
# Build check
cd server/functions
npm run build

# Lint check
npm run lint

# Expected: No errors in either command
```

#### ✅ **9. Deployment Process**
```bash
cd server
firebase deploy --only functions --debug

# Monitor deployment output for errors
# Expected: "✔ Deploy complete!"
```

**Common Deployment Issues:**
- ❌ Build failures → Fix TypeScript/lint errors
- ❌ Timeout during deployment → Check internet connection, retry
- ❌ Permission denied → Verify Firebase project access
- ❌ Quota exceeded → Check Firebase billing/usage limits

#### ✅ **10. Post-Deployment Verification**
```bash
# Test production endpoints
curl https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/health
curl https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/version

# Check Firebase Console
# Go to: https://console.firebase.google.com/project/mortgage-firebase-firebase/functions
```

**Expected Production Responses:**
```json
// Health endpoint
{
  "status": "ok",
  "timestamp": "2025-01-23T15:00:00.000Z",
  "version": "1.0.0"
}

// Version endpoint
{
  "version": "1.0.0",
  "environment": "production"
}
```

---

### 🐛 **Common Error Messages & Solutions**

#### **Error: "Function failed on loading user code"**
**Cause**: TypeScript compilation or import errors
**Solution**:
```bash
cd server/functions
npm run build
# Fix any TypeScript errors shown
```

#### **Error: "Firebase Admin SDK initialization failed"**
**Cause**: Invalid service account configuration
**Solution**:
```bash
# Re-set Firebase config with correct values
firebase functions:config:set firebase.private_key="$(cat path/to/service-account.json | jq -r .private_key | sed 's/\n/\\n/g')"
```

#### **Error: "CORS policy blocked the request"**
**Cause**: CORS not configured for your frontend domain
**Solution**: Update CORS in your Express app:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mortgage-firebase-firebase.web.app'
  ],
  credentials: true
}));
```

#### **Error: "Function timeout"**
**Cause**: Function taking too long to respond
**Solution**: Increase timeout in function configuration:
```typescript
export const api = functions.onRequest({
  region: 'europe-west3',
  memory: '512MiB',
  timeoutSeconds: 120, // Increased from 60
  cors: true
}, app);
```

#### **Error: "Memory limit exceeded"**
**Cause**: Function using too much memory
**Solution**: Increase memory allocation:
```typescript
export const api = functions.onRequest({
  region: 'europe-west3',
  memory: '1GiB', // Increased from 512MiB
  timeoutSeconds: 60,
  cors: true
}, app);
```

---

### 📊 **Performance Diagnostics**

#### ✅ **11. Cold Start Monitoring**
```bash
# Monitor function logs
firebase functions:log --only api

# Look for initialization times in logs
# Cold starts should be < 3 seconds
```

#### ✅ **12. Response Time Testing**
```bash
# Test response times
time curl https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/health

# Expected:
# - Cold start: 1-3 seconds
# - Warm requests: <200ms
```

#### ✅ **13. Memory Usage Monitoring**
Check Firebase Console → Functions → api → Metrics
- Monitor memory usage patterns
- Check for memory leaks
- Verify memory allocation is appropriate

---

### 🔒 **Security Diagnostics**

#### ✅ **14. Authentication Testing**
```bash
# Test protected endpoints (should return 401 without token)
curl https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/users/profile

# Test with valid token
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/users/profile
```

#### ✅ **15. HTTPS Verification**
```bash
# Verify SSL certificate
curl -I https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/health

# Expected: HTTP/2 200 with valid SSL
```

---

### 📋 **Diagnostic Checklist Summary**

**Pre-Deployment:**
- [ ] Firebase project configured correctly
- [ ] Functions directory structure is correct
- [ ] All dependencies installed
- [ ] TypeScript compiles without errors
- [ ] Local emulator runs successfully
- [ ] Environment variables configured

**Deployment:**
- [ ] Build process completes successfully
- [ ] Deployment completes without errors
- [ ] Production endpoints respond correctly
- [ ] Firebase Console shows function as active

**Post-Deployment:**
- [ ] Health endpoint returns 200
- [ ] Authentication works correctly
- [ ] CORS allows frontend requests
- [ ] Performance is acceptable
- [ ] Logs show no critical errors

**Performance:**
- [ ] Cold start time < 3 seconds
- [ ] Warm response time < 200ms
- [ ] Memory usage within limits
- [ ] No timeout errors

This diagnostic checklist will help you identify and resolve any Firebase Functions configuration issues quickly and systematically.