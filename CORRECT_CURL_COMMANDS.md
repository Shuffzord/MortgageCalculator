# Correct Curl Commands for Your Setup

Based on your Firebase emulator setup:
- **Authentication**: 127.0.0.1:9099
- **Functions**: 127.0.0.1:5001  
- **Project ID**: `mortgage-firebase-firebase`
- **Region**: `europe-west3`

**Important**: Use 127.0.0.1:5001 for Functions API calls (not 9099)

## Upgrade User to Premium

```bash
curl -X PUT http://127.0.0.1:9099/mortgage-firebase-firebase/europe-west3/api/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiTWF0dGhldyIsInBpY3R1cmUiOiIiLCJlbWFpbCI6ImVubm9ibGVyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3NDg2ODU0MjIsInVzZXJfaWQiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJlbm5vYmxlckBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9LCJpYXQiOjE3NDg2ODU0MjIsImV4cCI6MTc0ODY4OTAyMiwiYXVkIjoibW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJzdWIiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0In0." \
  -d '{"tier": "premium"}'
```

## Verify Premium Status

```bash
curl -X GET http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/users/tier \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiTWF0dGhldyIsInBpY3R1cmUiOiIiLCJlbWFpbCI6ImVubm9ibGVyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3NDg2ODU0MjIsInVzZXJfaWQiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJlbm5vYmxlckBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9LCJpYXQiOjE3NDg2ODU0MjIsImV4cCI6MTc0ODY4OTAyMiwiYXVkIjoibW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJzdWIiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0In0."
```

## Downgrade Back to Free (for testing)

```bash
curl -X PUT http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/users/tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiTWF0dGhldyIsInBpY3R1cmUiOiIiLCJlbWFpbCI6ImVubm9ibGVyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3NDg2ODU0MjIsInVzZXJfaWQiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJlbm5vYmxlckBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9LCJpYXQiOjE3NDg2ODU0MjIsImV4cCI6MTc0ODY4OTAyMiwiYXVkIjoibW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJzdWIiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0In0." \
  -d '{"tier": "free"}'
```

## Login Command (if you need a fresh token)

```bash
curl -X POST http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ennobler@gmail.com", "password": "your-password"}'
```

## After Running the Upgrade Command

1. **Refresh your browser** - The frontend will show premium status
2. **Test Premium Features**:
   - Navigate to `/en/premium/loan-comparison`
   - Navigate to `/en/premium/scenario-modeling`
   - Navigate to `/en/premium/export-center`
   - Check `/en/subscription` for subscription management
3. **Verify UI Changes**:
   - Premium dropdown menu accessible in navigation
   - Premium badge in user profile
   - No usage limits on calculator
   - Subscription tab in profile page

## Port Clarification

- **127.0.0.1:9099** = Firebase Auth Emulator (for authentication)
- **127.0.0.1:5001** = Firebase Functions Emulator (for API calls)

Use port **5001** for all API calls to upgrade user tier and access premium features.

## Success Response

When the upgrade works, you should see:
```json
{"message":"User tier updated successfully","tier":"premium"}