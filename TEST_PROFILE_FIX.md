# Test Profile Fix

## The Issue Was Fixed
The `/users/profile` endpoint wasn't returning the `tier` field, so the frontend couldn't see the premium status. I've updated the `getUserProfile` function in `authService.ts` to include the tier.

## Test the Fix

1. **Restart your Firebase Functions emulator** (if it's running):
   ```bash
   # Stop the emulator and restart it
   cd server/functions
   npm run serve
   ```

2. **Test the profile endpoint** to see if it now includes the tier:
   ```bash
   curl -X GET http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/users/profile \
     -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiTWF0dGhldyIsInBpY3R1cmUiOiIiLCJlbWFpbCI6ImVubm9ibGVyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3NDg2ODU0MjIsInVzZXJfaWQiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJlbm5vYmxlckBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9LCJpYXQiOjE3NDg2ODU0MjIsImV4cCI6MTc0ODY4OTAyMiwiYXVkIjoibW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9ydGdhZ2UtZmlyZWJhc2UtZmlyZWJhc2UiLCJzdWIiOiJ2S0IyTlhTRFBzOEZ6RFJoZ3Z2U1pmeDZXS3B0In0."
   ```

3. **Expected Response** should now include the tier:
   ```json
   {
     "uid": "vKB2NXSDPs8FzDRhgvvSZfx6WKpt",
     "email": "ennobler@gmail.com",
     "displayName": "Matthew",
     "tier": "premium",
     "profile": {}
   }
   ```

4. **Refresh your browser** and the frontend should now see the premium status!

## What Was Changed

In `server/functions/src/services/authService.ts`, the `getUserProfile` function now:

1. **Fetches the full user document** from Firestore (not just the profile)
2. **Extracts the tier** from the document data
3. **Includes the tier** in the response to the frontend
4. **Defaults to 'free'** if no tier is set

## After the Fix

Once you restart the emulator and refresh your browser, you should see:

- ✅ Premium dropdown menu accessible in navigation
- ✅ Premium badge in user profile dropdown  
- ✅ Access to `/en/premium/loan-comparison`
- ✅ Access to `/en/premium/scenario-modeling`
- ✅ Access to `/en/premium/export-center`
- ✅ Subscription management at `/en/subscription`
- ✅ No usage limits on calculator
- ✅ Premium tab in profile page

The integration is now complete and should work perfectly!