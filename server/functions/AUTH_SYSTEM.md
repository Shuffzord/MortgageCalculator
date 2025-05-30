# Authentication System Documentation

This document outlines the authentication system implemented for the Firebase Functions backend.

## Features

- JWT token verification using Firebase Admin SDK
- Authentication middleware for protecting routes
- User data management (read/write) through Firebase Auth
- Endpoints for token verification, user profile retrieval, and profile updates

## Endpoints

1. POST /api/auth/verify
   - Verifies the provided JWT token
   - Returns user UID and email if valid

2. GET /api/auth/user
   - Retrieves the current user's profile
   - Requires authentication

3. PUT /api/auth/user
   - Updates the current user's profile (displayName, photoURL)
   - Requires authentication

## Usage

1. Include the authentication middleware in protected routes:

```typescript
import { authMiddleware } from '../middleware/auth';

router.get('/protected-route', authMiddleware, (req, res) => {
  // Route handler
});
```

2. Access user data in route handlers:

```typescript
router.get('/user-data', authMiddleware, (req, res) => {
  const user = req.user;
  // Use user data
});
```

## Testing

A test script (`test-auth.ts`) is provided to verify the functionality of the authentication system. Run it using:

```
npx ts-node server/functions/src/test-auth.ts
```

This script tests user creation, token verification, user profile retrieval, and profile updates.