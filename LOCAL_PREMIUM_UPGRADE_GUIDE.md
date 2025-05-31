# Local Premium Upgrade Guide

This guide shows how to upgrade a user to premium locally using curl commands for testing the premium features integration.

## Prerequisites

1. **Firebase Emulator Running**: Make sure your Firebase Functions emulator is running
2. **User Account**: You need a registered user account to upgrade
3. **Development Environment**: The tier update endpoint is restricted to development/testing only

## Step 1: Start the Local Server

Make sure your Firebase Functions emulator is running:

```bash
cd server/functions
npm run serve
# or
firebase emulators:start --only functions
```

The API should be available at: `http://127.0.0.1:9099/your-project-id/europe-west3/api`

## Step 2: Get User Authentication Token

First, you need to authenticate and get a user token. You can either:

### Option A: Login via API
```bash
# Login to get the authentication token
curl -X POST http://127.0.0.1:9099/your-project-id/europe-west3/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ennobler@gmail.com",
    "password": "i_p5~uU;:,khMag="
  }'
```

### Option B: Get Token from Browser
1. Login to your app in the browser
2. Open browser dev tools → Application → Local Storage
3. Find the Firebase auth token or copy it from the network requests

## Step 3: Upgrade User to Premium

Use the development-only tier update endpoint:

```bash
# Upgrade user to premium
curl -X PUT http://127.0.0.1:9099/your-project-id/europe-west3/api/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -d '{
    "tier": "premium"
  }'
```

### Example with Real Values:
```bash
curl -X PUT http://127.0.0.1:9099/your-project-id/europe-west3/api/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiTWF0dGhldyIsInBpY3R1cmUiOiIiLCJlbWFpbCI6ImVubm9ibGVyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3NDg2ODU0MjIsInVzZXJfaWQiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJlbm5vYmxlckBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9LCJpYXQiOjE3NDg2ODU0MjIsImV4cCI6MTc0ODY4OTAyMiwiYXVkIjoibW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJzdWIiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0In0." \
  -d '{
    "tier": "premium"
  }'
```

## Step 4: Verify Premium Status

Check that the user tier was updated successfully:

```bash
# Get current user tier
curl -X GET http://127.0.0.1:9099/mortgage-firebase-firebase/europe-west3/api/users/tier \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tier": "premium"
  }
}
```

## Step 5: Test Premium Features

Now you can test the premium features in the application:

1. **Refresh the browser** - The frontend should now show premium status
2. **Check Navigation** - Premium features should be accessible
3. **Test Premium Pages**:
   - `/en/premium/loan-comparison`
   - `/en/premium/scenario-modeling` 
   - `/en/premium/export-center`
4. **Check Profile** - Should show premium badge and subscription tab

## Alternative: Direct Database Update (Firebase Emulator)

If you're using Firebase Emulator, you can also directly update the user document:

```bash
# Get user profile first to see current data
curl -X GET http://127.0.0.1:9099/your-project-id/europe-west3/api/users/profile \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE"
```

## Downgrade Back to Free

To test the free user experience again:

```bash
# Downgrade user to free
curl -X PUT http://127.0.0.1:9099/your-project-id/europe-west3/api/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -d '{
    "tier": "free"
  }'
```

## Available User Tiers

Based on the UserTier enum:
- `"free"` - Free tier with limited features
- `"premium"` - Premium tier with full access

## Troubleshooting

### 401 Unauthorized
- Check that your auth token is valid and not expired
- Make sure you're including the `Authorization: Bearer` header

### 403 Forbidden  
- The tier update endpoint is development-only
- Make sure you're running in development mode
- Check that `NODE_ENV` is not set to `production`

### 400 Bad Request
- Verify the tier value is exactly `"premium"` or `"free"`
- Check that the JSON payload is properly formatted

### 404 Not Found
- Verify the API endpoint URL is correct
- Make sure the Firebase Functions emulator is running
- Check that the project ID in the URL matches your Firebase project

## Testing Premium Features

Once upgraded to premium, you should see:

1. **Navigation Changes**:
   - Premium dropdown menu accessible
   - No upgrade prompts in navigation
   - Premium badge in user profile dropdown

2. **Calculator Page**:
   - No usage limits or progress bars
   - No upgrade prompts after calculations
   - Full access to all features

3. **Premium Pages**:
   - Loan Comparison tool fully functional
   - Scenario Modeling accessible
   - Export Center available

4. **Profile Page**:
   - Premium badge displayed
   - Subscription tab shows management options
   - No upgrade prompts

5. **Subscription Page**:
   - Shows premium subscription status
   - Billing and payment management available

## Quick Test Script

Here's a complete test script you can save and run:

```bash
#!/bin/bash

# Configuration
API_BASE="http://127.0.0.1:9099/your-project-id/europe-west3/api"
EMAIL="test@example.com"
PASSWORD="testpassword123"

echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

echo "2. Current tier:"
curl -s -X GET $API_BASE/users/tier \
  -H "Authorization: Bearer $TOKEN" | jq

echo "3. Upgrading to premium..."
curl -s -X PUT $API_BASE/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tier":"premium"}' | jq

echo "4. Verifying premium status:"
curl -s -X GET $API_BASE/users/tier \
  -H "Authorization: Bearer $TOKEN" | jq

echo "Premium upgrade complete! Refresh your browser to see changes."
```

Save this as `upgrade-to-premium.sh`, make it executable with `chmod +x upgrade-to-premium.sh`, and run it.

## Quick Commands for Your Setup

Based on your emulator configuration:

```bash
# Replace YOUR_PROJECT_ID with your actual Firebase project ID

# 1. Login
curl -X POST http://127.0.0.1:9099/YOUR_PROJECT_ID/europe-west3/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'

# 2. Upgrade to Premium (replace TOKEN with the token from step 1)
curl -X PUT http://127.0.0.1:9099/YOUR_PROJECT_ID/europe-west3/api/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"tier": "premium"}'

# 3. Verify
curl -X GET http://127.0.0.1:9099/YOUR_PROJECT_ID/europe-west3/api/users/tier \
  -H "Authorization: Bearer TOKEN"
```

Remember to:
1. Replace `YOUR_PROJECT_ID` with your actual Firebase project ID
2. Replace `TOKEN` with the actual authentication token from the login response
3. Use your actual email and password for the login