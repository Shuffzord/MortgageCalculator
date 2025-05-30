# Tier Management Security Implementation

## Overview

This document outlines the security implementation for user tier management in the Premium Features System. The system has been designed with multiple layers of security to prevent unauthorized tier upgrades.

## Security Architecture

### 🔒 **Current Implementation: Multi-Layer Security**

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER MANAGEMENT SECURITY                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development/Testing:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PUT /api/users/tier (Development Only)              │   │
│  │ ├── developmentOnlyMiddleware                       │   │
│  │ ├── authMiddleware                                  │   │
│  │ └── updateUserTier                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Production:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Stripe Webhook → TierManagementService             │   │
│  │ Internal Functions → TierManagementService         │   │
│  │ Admin Operations → TierManagementService           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. **Development-Only Endpoint Protection**

**File:** `server/functions/src/middleware/developmentOnly.ts`

```typescript
export const developmentOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const functionsEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  
  // Allow in development, testing, or when using Firebase emulator
  if (nodeEnv === 'development' || nodeEnv === 'test' || functionsEmulator) {
    next();
  } else {
    throw new CustomError(
      'This endpoint is only available in development/testing environments. ' +
      'In production, tier upgrades are handled via payment processing.',
      403
    );
  }
};
```

**Protection Applied:**
- ✅ Blocks access in production environments
- ✅ Allows access in development/testing
- ✅ Allows access when using Firebase emulator
- ✅ Returns clear error message explaining production restrictions

### 2. **Internal Tier Management Service**

**File:** `server/functions/src/services/tierManagementService.ts`

**Purpose:** Secure, server-side functions for tier management that are NOT exposed as public API endpoints.

**Key Functions:**
```typescript
// Internal tier update with logging and validation
TierManagementService.updateUserTierInternal(userId, tier, reason)

// Payment-triggered upgrades
TierManagementService.upgradeUserToPremium(userId, subscriptionId)

// Subscription cancellation downgrades
TierManagementService.downgradeUserToFree(userId, reason)

// Admin bulk operations
TierManagementService.bulkUpdateTiers(updates)
```

**Security Features:**
- ✅ No public API endpoints
- ✅ Comprehensive logging with reasons
- ✅ Input validation
- ✅ Audit trail with timestamps
- ✅ Batch operations for admin use

### 3. **Payment Integration Security**

**File:** `server/functions/src/services/subscriptionService.ts`

**Secure Tier Updates via Payment Events:**
```typescript
// Subscription created → Premium upgrade
await TierManagementService.upgradeUserToPremium(userId, subscriptionId);

// Subscription cancelled → Free downgrade  
await TierManagementService.downgradeUserToFree(userId, 'Subscription cancelled');

// Subscription expired → Free downgrade
await TierManagementService.downgradeUserToFree(userId, 'Subscription expired');
```

**Security Features:**
- ✅ Only triggered by verified Stripe webhooks
- ✅ Webhook signature validation
- ✅ Customer metadata verification
- ✅ Automatic tier management based on payment status

## Environment-Based Access Control

### **Development Environment**
```bash
NODE_ENV=development
FUNCTIONS_EMULATOR=true
```
- ✅ Direct tier upgrade endpoint available
- ✅ Used for testing and development
- ✅ Manual tier management for testing scenarios

### **Production Environment**
```bash
NODE_ENV=production
FUNCTIONS_EMULATOR=false
```
- ❌ Direct tier upgrade endpoint blocked
- ✅ Only payment-triggered tier changes allowed
- ✅ Internal functions available for admin operations

## API Endpoint Security

### **Public Endpoints (Authenticated Users)**
```
GET  /api/users/tier          ✅ Read user's current tier
GET  /api/users/profile       ✅ Read user profile
GET  /api/users/limits        ✅ Read usage limits
```

### **Development-Only Endpoints**
```
PUT  /api/users/tier          🔒 Development/Testing only
```

### **Internal Functions (No Public Access)**
```
TierManagementService.*       🔒 Server-side only
```

### **Payment-Triggered Operations**
```
POST /api/stripe-webhook      🔒 Stripe signature required
```

## Security Testing

### **Test Coverage**
- ✅ Development environment allows tier upgrades
- ✅ Production environment blocks tier upgrades
- ✅ Payment webhooks trigger tier changes
- ✅ Internal functions work correctly
- ✅ Audit logging captures all changes

### **Test File:** `server/functions/src/test-complete-premium-flow.js`
- Tests complete user journey: Login → Grant Premium → Verify Features
- Uses development environment for testing
- Validates tier upgrade functionality
- Confirms premium features work after upgrade

## Production Deployment Checklist

### **Before Production Deployment:**
- [ ] Set `NODE_ENV=production`
- [ ] Verify Stripe webhook endpoints configured
- [ ] Test payment flow in Stripe test mode
- [ ] Confirm tier upgrade endpoint returns 403 in production
- [ ] Validate internal tier management functions
- [ ] Set up monitoring for tier change events

### **Production Security Verification:**
```bash
# This should return 403 Forbidden in production
curl -X PUT https://your-api.com/api/users/tier \
  -H "Authorization: Bearer <token>" \
  -d '{"tier": "premium"}'

# Expected response:
{
  "status": "error",
  "message": "This endpoint is only available in development/testing environments. In production, tier upgrades are handled via payment processing."
}
```

## Monitoring and Auditing

### **Tier Change Logging**
All tier changes are logged with:
- ✅ User ID
- ✅ Old tier → New tier
- ✅ Timestamp
- ✅ Reason for change
- ✅ Source (payment, admin, etc.)

### **Security Monitoring**
- Monitor for unauthorized tier upgrade attempts
- Alert on production tier upgrade endpoint access
- Track payment webhook processing
- Audit admin tier management operations

## Summary

The tier management system implements defense-in-depth security:

1. **Environment-based access control** - Development vs Production
2. **Internal service architecture** - No public tier upgrade APIs in production
3. **Payment integration security** - Only verified payments trigger upgrades
4. **Comprehensive auditing** - All changes logged with reasons
5. **Clear separation of concerns** - Testing vs Production workflows

This ensures that in production, users can only upgrade to premium tiers through legitimate payment processing, while maintaining flexibility for development and testing scenarios.