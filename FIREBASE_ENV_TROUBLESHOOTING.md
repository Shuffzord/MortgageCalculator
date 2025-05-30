# Firebase Environment Loading Issue - Troubleshooting Analysis

## Current Issue Analysis

Based on the error message and configuration review, I've identified several potential issues with the current setup:

### Issue 1: Private Key Formatting Problem

The `FIREBASE_PRIVATE_KEY` in the `.env` file has formatting issues:
- The private key spans multiple lines but is stored as a single line with `\n` escape sequences
- Firebase Functions emulator may have trouble parsing this format
- The key should be properly quoted and formatted

### Issue 2: Firebase Configuration Location

While we've moved the `firebase.json` to the functions directory, there may still be path resolution issues with how Firebase loads the environment file.

### Issue 3: Environment File Loading Order

Firebase Functions emulator tries to load environment variables before executing our TypeScript code, which means our programmatic loading approach won't work.

## Recommended Solutions

### Solution 1: Fix Private Key Formatting

Create a new `.env` file with properly formatted private key:

```bash
NODE_ENV=development
PORT=3001
FIREBASE_API_KEY=AIzaSyC3fd4jlfss_HQzyEnxBgQZtqkJnyZqBdQ
FIREBASE_AUTH_DOMAIN=mortgage-firebase-firebase.firebaseapp.com
FIREBASE_PROJECT_ID=mortgage-firebase-firebase
FIREBASE_STORAGE_BUCKET=mortgage-firebase-firebase.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1023280249562
FIREBASE_APP_ID=1:1023280249562:web:1fb9084c17a32c8d0783e3
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mortgage-firebase-firebase.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDCxZsMikqfU5hU
QhFtEYm+GP4yfHnryCh5C5DW7qfGmOf03ca3nrMxBBp2ikI8tDHf/znyDehlW4YO
rg0ePTqBKRDBUH7HaWbQYlq5iyvXf5DzhODTgXAZqFZtO6Vd8KK7niH7kPJ1yQ4D
BP4Z8pLKc04QuC5nEY2G7ZT+tA2gofqZd5l0OsACXMNlJsVwKnkSP123gcgebK+w
8fjBDJQRTtwP/ErjdoCzq9R0wZMXlk2Vl7+dndmwb1PPvLBvG42xYmEQ99jG7Gi2
pQFE9DH16SOIltTCJ6fsBQa+ryEFi6dnPW3rnS2DhsUL7p9fkip9+YOZv4cpt+6n
yJMDIS7VAgMBAAECggEAArFc4H/B99wd7p5KOOM677X56mSbrUBDb6b9Xedcn6Df
ZhyHLI86ZCqtxfvz3fx8ywoaOOfrJwmXUSPOunS3bBqPU34409TNJIOTmbNG9tAE
nEVMSXL67ok2sVnCLR9lqek4suPGYmKrpFbg6ibB06A5UP8G5IsS1UMld0mx0t8c
QLQUt/NCAPKInfgR1nt0GBNYD4WvdiXooEnXStsUauGx19SIkWYyr4h2oMvY04bb
7xKr2wLlXB+NsAM5Fra4i0A0i0lJn9kKkCmVV2oURbtamrokO6a4X5bbsXa5ZZzi
n9Oqch7aZcJ2CIFXVMf+r2DmjKIzp5/fCDR+WIAeeQKBgQDqhXa0yeRMHVwj6H/T
k7T+D7Fb6YhSErsJL8LB3+37IcdurH6vdX8FmUCaa5l+X1L10ghu+EKnJLA+zoVk
gEwGJmFckIMnOzGu5jKQad8pI6kSenvb/dZN3Fc2hOj6Jh1I+ewNHr4lS1do8hDZ
hUzXNYI6uyb6auHsnMggI8nIHQKBgQDUnC9kaMvb4UWXILp+hnZmlrDooEyT+ISs
Z9waT7KFc6EfHpZJfW5VV9P6XlkK4+jNMyelHooofKfBeTlvIFTiOJkmXHrvPcwU
bUJusLlwwNa0Mi1A6zoDHjAHduU/GV19tHVM/THDOcFe+6WkSmRd1+AOBaHo4Jdt
7RfKY6X0GQKBgG/x4zbrBBm9DgVp7tJcuFFpxjxcXiDnJfZ9oNaQgHWWqy7OEe7J
BCf0/lx3rh4ffGcwqavmv1Ivdh2U0SGnCCMLYQAhTymD3PRil5JNpyNpDURvyP26
zff+jHbOvLLjTKlP+vhMS3Fb5E6I9bgPJB26Qf6s5S81o8AhGnoU+zWVAoGABvSV
GFPVV3wnKqqHb1w2w2RqpTGZT73xmTJMoQ+6Z2NBAiOeBwlzcpdM+APeJd0O4Ker
xFsbafeqBUpR9rC4Fi6D1B1yaCE9a+2nHrfpWSb13y9FC7qmSzPRnmzlUwshY9tj
ewFNf3WEPfc9lAJbBjbpvYuxoEy4p3/6J0TbSQECgYAohedpNPAEWEoOFuwN0E4F
Aw84DmVLQ4FmOYYH0dQWzfaRatp2TQcfsNbex/NPlWfbxZ15ivYTG0zS2Rov9WoF
0SBgF7CNBH35WSX60Gjen2UGWiQ7aXgLkSdSROLW7mPl6tkSrawLCZVkXzpl2tXS
3QB2GHtfSTAd6Be69udQTQ==
-----END PRIVATE KEY-----"
```

### Solution 2: Alternative Firebase Configuration

Update `firebase.json` to remove the environment configuration and let Firebase use default loading:

```json
{
  "functions": [
    {
      "source": ".",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm run lint",
        "npm run build"
      ],
      "runtime": "nodejs18"
    }
  ],
  "emulators": {
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}
```

### Solution 3: Use Firebase Service Account Key File

Instead of using environment variables for Firebase credentials, create a service account key file:

1. Create `serviceAccountKey.json` in the functions directory
2. Update the serve script to use `GOOGLE_APPLICATION_CREDENTIALS`
3. Remove Firebase-specific environment variables from `.env`

### Solution 4: Simplify Environment Variables

Create a minimal `.env` file with only essential variables:

```bash
NODE_ENV=development
PORT=3001
```

And handle Firebase configuration through service account key file or Firebase CLI authentication.

## Implementation Priority

1. **Try Solution 1** (Fix private key formatting) - Most likely to resolve the issue
2. **If that fails, try Solution 2** (Remove env config from firebase.json)
3. **If still failing, try Solution 3** (Use service account key file)
4. **Last resort: Solution 4** (Minimal environment variables)

## Testing Steps

After implementing each solution:

1. Run `npm run build` to ensure TypeScript compilation works
2. Run `npm run serve` to start the Firebase emulator
3. Check for successful function loading without environment errors
4. Test API endpoints at `http://localhost:5001/[project-id]/europe-west3/api/`

## Expected Outcome

After implementing the correct solution:
- Firebase Functions emulator should start without environment loading errors
- Functions should be properly loaded and accessible
- Environment variables should be available throughout the application
- API endpoints should respond correctly