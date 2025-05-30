# Firebase Functions Quick Setup Guide
## Immediate Next Steps for Backend Integration

### 🎯 **Current Status**
✅ Firebase Functions project initialized  
✅ Firebase project configured: `mortgage-firebase-firebase`  
✅ Express API code ready in `server/src/`  
🔄 **NEXT**: Integrate Express app with Firebase Functions

---

## 🚀 **Step 1: Move Express App to Firebase Functions**

### 1.1 Copy Express App Structure
```bash
# Navigate to server directory
cd server

# Copy your Express app to Firebase Functions
cp -r src/* functions/src/
```

### 1.2 Update Firebase Functions Entry Point
Replace `server/functions/src/index.ts` with:

```typescript
import * as functions from 'firebase-functions/v2/https';
import app from './app';

export const api = functions.onRequest({
  region: 'europe-west3',
  memory: '512MiB',
  timeoutSeconds: 60,
  cors: true
}, app);
```

### 1.3 Update Dependencies
Update `server/functions/package.json` to include your Express dependencies:

```json
{
  "name": "functions",
  "scripts": {
    "lint": "eslint --ext .js,.ts .",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "22"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.0.1",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^8.1.0",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.12.0",
    "@typescript-eslint/parser": "^5.12.0",
    "eslint": "^8.9.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.25.4",
    "firebase-functions-test": "^3.1.0",
    "typescript": "^4.9.0"
  },
  "private": true
}
```

---

## 🔧 **Step 2: Configure Environment Variables**

### 2.1 Set Firebase Functions Config
```bash
# Navigate to server directory
cd server

# Set Firebase Functions environment variables
firebase functions:config:set \
  firebase.project_id="mortgage-firebase-firebase" \
  firebase.client_email="firebase-adminsdk-fbsvc@mortgage-firebase-firebase.iam.gserviceaccount.com"

# Set private key (replace with your actual private key)
firebase functions:config:set \
  firebase.private_key="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 2.2 Update Firebase Config File
Update `server/functions/src/config/firebase.ts`:

```typescript
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  // In Firebase Functions, use functions.config()
  const config = functions.config();
  
  app = initializeApp({
    credential: cert({
      projectId: config.firebase.project_id,
      clientEmail: config.firebase.client_email,
      privateKey: config.firebase.private_key.replace(/\\n/g, '\n'),
    }),
    projectId: config.firebase.project_id,
  });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
```

---

## 🧪 **Step 3: Test Locally**

### 3.1 Install Dependencies
```bash
cd server/functions
npm install
```

### 3.2 Start Firebase Emulator
```bash
# From server directory
cd server
npm run serve

# This will start the Firebase Functions emulator
# Your API will be available at:
# http://localhost:5001/mortgage-firebase-firebase/europe-west3/api
```

### 3.3 Test Health Endpoint
```bash
# Test the health endpoint
curl http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-23T15:00:00.000Z","version":"1.0.0"}
```

---

## 🚀 **Step 4: Deploy to Production**

### 4.1 Build and Deploy
```bash
cd server
npm run build
firebase deploy --only functions
```

### 4.2 Production URLs
After deployment, your API will be available at:
```
Base URL: https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api
Health: https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/health
```

---

## 🔍 **Step 5: Verify Deployment**

### 5.1 Test Production Endpoints
```bash
# Test health endpoint
curl https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/health

# Test version endpoint
curl https://europe-west3-mortgage-firebase-firebase.cloudfunctions.net/api/version
```

### 5.2 Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `mortgage-firebase-firebase`
3. Navigate to Functions section
4. Verify your `api` function is deployed and running

---

## 🛠️ **Troubleshooting Common Issues**

### Issue 1: Private Key Format Error
```bash
# If you get private key format errors, ensure newlines are properly escaped
firebase functions:config:set firebase.private_key="$(cat path/to/private-key.pem | tr '\n' '\\n')"
```

### Issue 2: CORS Issues
Update your `app.ts` to include proper CORS configuration:
```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mortgage-firebase-firebase.web.app',
    'https://yourdomain.com'
  ],
  credentials: true
}));
```

### Issue 3: Cold Start Performance
Add keep-warm function (optional):
```typescript
// In functions/src/index.ts
export const keepWarm = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Keep-warm ping');
    return null;
  });
```

---

## 📊 **Expected Performance**

### Local Development
- **Emulator Start Time**: ~10-15 seconds
- **Response Time**: <100ms
- **Hot Reload**: Automatic with `--watch`

### Production
- **Cold Start**: ~1-3 seconds (first request)
- **Warm Response**: <200ms
- **Auto-scaling**: 0 to 1000+ instances
- **Uptime**: 99.9%+ (Firebase SLA)

---

## 💰 **Cost Expectations**

### Free Tier (Development)
- **Invocations**: 2M/month
- **Compute Time**: 400K GB-seconds/month
- **Outbound Data**: 5GB/month

### Production Costs
- **Low Traffic** (10K requests/month): **FREE**
- **Medium Traffic** (500K requests/month): **~$5-10**
- **High Traffic** (2M+ requests/month): **~$15-25**

---

## 🎯 **Next Steps After Setup**

1. ✅ **Complete this setup guide**
2. 🔄 **Test all API endpoints locally**
3. 🔄 **Deploy to production**
4. 🔄 **Update frontend to use Firebase Functions API**
5. 🔄 **Implement user authentication**
6. 🔄 **Add payment processing**

---

## 📞 **Support Resources**

- **Firebase Functions Docs**: https://firebase.google.com/docs/functions
- **Firebase Console**: https://console.firebase.google.com/
- **Firebase CLI Reference**: https://firebase.google.com/docs/cli
- **Express.js Docs**: https://expressjs.com/

This guide will get your Firebase Functions backend up and running quickly. Once completed, you'll have a serverless, auto-scaling API deployed in the Europe West 3 region with excellent performance and cost efficiency.