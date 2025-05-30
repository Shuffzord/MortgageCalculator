# Payment Integration System - Phase 4 Implementation

## Overview

This document describes the complete Stripe payment integration system implemented for the mortgage calculator application. The system provides subscription management, payment processing, and customer portal integration.

## Architecture

### Core Components

1. **Stripe Service** (`src/services/stripeService.ts`)
   - Handles all Stripe API interactions
   - Customer management
   - Subscription operations
   - Payment processing
   - Webhook verification

2. **Subscription Service** (`src/services/subscriptionService.ts`)
   - Business logic for subscription management
   - Database operations for subscriptions and payments
   - User tier management
   - Grace period handling

3. **Payment Routes** (`src/routes/payments.ts`)
   - Checkout session creation
   - Webhook endpoint
   - Payment history
   - Configuration endpoints

4. **Subscription Routes** (`src/routes/subscription.ts`)
   - Subscription status and details
   - Customer portal access
   - Subscription cancellation/reactivation
   - Invoice and payment method management

5. **Webhook Middleware** (`src/middleware/stripeWebhook.ts`)
   - Webhook signature verification
   - Raw body handling for Stripe webhooks

## API Endpoints

### Payment Endpoints (`/payments`)

#### `POST /payments/create-checkout-session`
Creates a Stripe checkout session for subscription purchase.

**Authentication:** Required  
**Request Body:**
```json
{
  "priceId": "price_premium_monthly",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "mode": "subscription"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

#### `POST /payments/webhook`
Handles Stripe webhook events for real-time payment processing.

**Authentication:** Webhook signature verification  
**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

#### `GET /payments/history`
Retrieves payment history for the authenticated user.

**Authentication:** Required  
**Query Parameters:**
- `limit` (optional): Number of records to return (max 50, default 10)

#### `GET /payments/plans`
Returns available subscription plans.

**Authentication:** None  

#### `GET /payments/config`
Returns Stripe publishable key for frontend integration.

**Authentication:** None  

### Subscription Endpoints (`/subscription`)

#### `GET /subscription/status`
Gets current subscription status with grace period information.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_...",
      "status": "active",
      "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
    },
    "isActive": true,
    "daysUntilExpiry": 15,
    "gracePeriodActive": false
  }
}
```

#### `POST /subscription/cancel`
Cancels or schedules cancellation of subscription.

**Authentication:** Required  
**Request Body:**
```json
{
  "cancelAtPeriodEnd": true
}
```

#### `POST /subscription/reactivate`
Reactivates a subscription scheduled for cancellation.

**Authentication:** Required  

#### `GET /subscription/portal`
Creates and returns customer portal URL for subscription management.

**Authentication:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/..."
  }
}
```

#### `GET /subscription/details`
Gets detailed subscription information including Stripe data.

**Authentication:** Required  

#### `GET /subscription/payment-methods`
Returns customer's saved payment methods.

**Authentication:** Required  

#### `GET /subscription/invoices`
Returns customer's invoice history.

**Authentication:** Required  
**Query Parameters:**
- `limit` (optional): Number of invoices to return (max 50, default 10)

## Data Models

### Subscription
```typescript
interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  priceId?: string;
  quantity?: number;
}
```

### Payment History
```typescript
interface PaymentHistory {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_action';
  description?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
```

## Subscription Plans

### Premium Monthly
- **Price ID:** `price_premium_monthly`
- **Amount:** $9.99/month
- **Features:**
  - Unlimited calculations
  - Advanced comparison tools
  - Export to PDF
  - Priority support
  - Advanced analytics

### Premium Yearly
- **Price ID:** `price_premium_yearly`
- **Amount:** $99.99/year (2 months free)
- **Features:** Same as monthly plus 2 months free

## Webhook Events

The system handles the following Stripe webhook events:

1. **customer.subscription.created**
   - Creates new subscription record
   - Upgrades user to premium tier

2. **customer.subscription.updated**
   - Updates subscription status
   - Handles plan changes

3. **customer.subscription.deleted**
   - Marks subscription as cancelled
   - Downgrades user to free tier

4. **invoice.payment_succeeded**
   - Records successful payment
   - Ensures premium tier activation

5. **invoice.payment_failed**
   - Records failed payment
   - Initiates grace period

## Grace Period Handling

When a payment fails, the system provides a grace period:

- **Duration:** 7 days after payment failure
- **Behavior:** User retains premium access during grace period
- **Cleanup:** Automatic downgrade after grace period expires

## Security Features

1. **Webhook Verification**
   - Stripe signature verification for all webhooks
   - Raw body preservation for signature validation

2. **Authentication**
   - Firebase token verification for all user endpoints
   - User context validation

3. **Input Validation**
   - Request body validation using express-validator
   - Price ID validation against configured plans

## Environment Configuration

Required environment variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...

# Application URLs
CLIENT_URL=http://localhost:5173
```

## Testing

### Test Script
Run the payment system tests:
```bash
node src/test-payment-endpoints.js
```

### Test Coverage
- Payment configuration retrieval
- Subscription plans listing
- Checkout session creation
- Subscription status checking
- Payment history retrieval
- Customer portal access
- Webhook processing (manual testing required)

### Manual Testing Steps

1. **Setup Stripe Test Environment**
   - Create Stripe test account
   - Configure webhook endpoint
   - Set up test price IDs

2. **Test Subscription Flow**
   - Create checkout session
   - Complete test payment
   - Verify subscription activation
   - Test customer portal

3. **Test Webhook Events**
   - Use Stripe CLI to forward webhooks
   - Trigger subscription events
   - Verify database updates

## Integration Points

### Frontend Integration
```javascript
// Create checkout session
const response = await fetch('/api/payments/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    priceId: 'price_premium_monthly',
    successUrl: window.location.origin + '/success',
    cancelUrl: window.location.origin + '/cancel'
  })
});

const { data } = await response.json();
window.location.href = data.url;
```

### User Tier Management
The system automatically manages user tiers based on subscription status:
- **Free Tier:** Default for all users
- **Premium Tier:** Activated on successful subscription
- **Grace Period:** Maintains premium during payment failures

## Error Handling

### Common Error Scenarios
1. **Invalid Price ID:** Returns 400 with validation error
2. **Missing Email:** Returns 400 for customer creation
3. **Webhook Verification Failure:** Returns 400 with signature error
4. **Subscription Not Found:** Returns appropriate error message
5. **Stripe API Errors:** Logged and converted to user-friendly messages

### Logging
All operations are logged with appropriate levels:
- **Info:** Successful operations
- **Warn:** Non-critical issues
- **Error:** Failures requiring attention

## Deployment Considerations

1. **Environment Variables**
   - Ensure all Stripe keys are properly configured
   - Use production keys for production deployment

2. **Webhook Endpoints**
   - Configure Stripe webhook URL in dashboard
   - Ensure webhook secret matches environment

3. **Database Indexes**
   - Index on `userId` for subscriptions collection
   - Index on `userId` for paymentHistory collection

4. **Monitoring**
   - Monitor webhook delivery success
   - Track subscription lifecycle events
   - Alert on payment failures

## Future Enhancements

1. **Proration Handling**
   - Support for mid-cycle plan changes
   - Prorated billing calculations

2. **Multiple Payment Methods**
   - Support for additional payment methods
   - Payment method management UI

3. **Dunning Management**
   - Advanced retry logic for failed payments
   - Email notifications for payment issues

4. **Analytics**
   - Revenue tracking
   - Subscription metrics
   - Churn analysis

## Support and Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Verify webhook URL configuration
   - Check webhook secret
   - Ensure endpoint is accessible

2. **Subscription Not Activating**
   - Check webhook event processing
   - Verify user tier update logic
   - Review Firestore permissions

3. **Customer Portal Not Working**
   - Verify customer exists in Stripe
   - Check return URL configuration
   - Ensure proper authentication

### Debug Tools
- Stripe Dashboard for event monitoring
- Application logs for error tracking
- Test endpoints for system verification

This payment system provides a robust foundation for subscription management and can be extended to support additional payment scenarios as needed.