# Local Testing Guide for Payment System

## Prerequisites

1. **Stripe Test Account**
   - Sign up at https://stripe.com
   - Get your test API keys from the Stripe Dashboard
   - Create test products and prices

2. **Firebase Emulators Running**
   - Functions: http://127.0.0.1:5001
   - Authentication: http://127.0.0.1:9099
   - Firestore: http://127.0.0.1:8080

## Step 1: Configure Stripe Keys

### Option A: Environment File (Recommended)
Create a `.env` file in `server/functions/` directory:

```bash
# server/functions/.env

# Stripe Test Keys (get these from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1...

# Firebase Configuration (if not already set)
FB_PROJECT_ID=mortgage-firebase-firebase
FB_API_KEY=your_api_key
FB_AUTH_DOMAIN=mortgage-firebase-firebase.firebaseapp.com
FB_STORAGE_BUCKET=mortgage-firebase-firebase.appspot.com
FB_MESSAGING_SENDER_ID=your_sender_id
FB_APP_ID=your_app_id
FB_CLIENT_EMAIL=your_service_account_email
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Application Settings
NODE_ENV=development
APP_PORT=3001
```

### Option B: Firebase Functions Config
```bash
# Set Stripe configuration
firebase functions:config:set stripe.secret_key="sk_test_51..."
firebase functions:config:set stripe.publishable_key="pk_test_51..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase functions:config:set stripe.premium_monthly_price_id="price_1..."
firebase functions:config:set stripe.premium_yearly_price_id="price_1..."
```

## Step 2: Set Up Stripe Test Data

### Create Products and Prices in Stripe Dashboard

1. **Go to Stripe Dashboard** → Products
2. **Create Premium Monthly Product:**
   - Name: "Premium Monthly"
   - Description: "Monthly premium subscription"
   - Pricing: $9.99/month recurring
   - Copy the Price ID (starts with `price_`)

3. **Create Premium Yearly Product:**
   - Name: "Premium Yearly" 
   - Description: "Yearly premium subscription"
   - Pricing: $99.99/year recurring
   - Copy the Price ID (starts with `price_`)

4. **Update your `.env` file** with the actual Price IDs

## Step 3: Set Up Webhook Endpoint (Optional for Basic Testing)

### Using Stripe CLI (Recommended)
```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local emulator
stripe listen --forward-to http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/webhook

# This will give you a webhook secret starting with whsec_
# Add this to your .env file as STRIPE_WEBHOOK_SECRET
```

### Manual Webhook Setup
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/webhook`
3. Select events: `customer.subscription.*`, `invoice.payment_*`
4. Copy the webhook secret to your `.env` file

## Step 4: Start the Local Environment

### Terminal 1: Start Firebase Emulators
```bash
cd server/functions
npm run serve:emulators
```

### Terminal 2: Start Stripe Webhook Forwarding (if using Stripe CLI)
```bash
stripe listen --forward-to http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/webhook
```

## Step 5: Test the Payment System

### Update Test Script Configuration
Edit `server/functions/src/test-payment-endpoints.js`:

```javascript
// Update the BASE_URL to point to your emulator
const BASE_URL = 'http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api';

// Update test data with your actual Stripe Price IDs
const testData = {
  priceId: 'price_1...', // Your actual monthly price ID
  successUrl: 'http://localhost:5173/success',
  cancelUrl: 'http://localhost:5173/cancel'
};
```

### Run the Test Suite
```bash
cd server/functions
node src/test-payment-endpoints.js
```

## Step 6: Manual Testing Workflow

### 1. Test Basic Endpoints
```bash
# Test payment config
curl http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/config

# Test subscription plans
curl http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/plans
```

### 2. Test with Authentication
```bash
# First, register a test user
curl -X POST http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","displayName":"Test User"}'

# Login to get token
curl -X POST http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Use the returned token for authenticated requests
export TOKEN="your_jwt_token_here"

# Test payment system
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/test

# Test subscription status
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/subscription/status
```

### 3. Test Checkout Session Creation
```bash
curl -X POST http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1...",
    "successUrl": "http://localhost:5173/success",
    "cancelUrl": "http://localhost:5173/cancel"
  }'
```

## Step 7: Test Complete Payment Flow

### 1. Create Checkout Session
Use the API or test script to create a checkout session

### 2. Complete Test Payment
- Open the returned checkout URL in your browser
- Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date and CVC
- Complete the payment

### 3. Verify Subscription Creation
```bash
# Check subscription status
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/subscription/status

# Check payment history
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/history
```

## Troubleshooting

### Common Issues

1. **"STRIPE_SECRET_KEY is required" Error**
   - Ensure your `.env` file is in the correct location (`server/functions/.env`)
   - Restart the emulator after adding environment variables

2. **"Invalid price ID" Error**
   - Verify your Price IDs in Stripe Dashboard
   - Ensure they start with `price_` not `prod_`

3. **Webhook Verification Failed**
   - Make sure Stripe CLI is running and forwarding to the correct URL
   - Check that the webhook secret matches

4. **Authentication Errors**
   - Ensure Firebase Auth emulator is running
   - Check that the JWT token is valid and not expired

### Debug Commands

```bash
# Check environment variables
cd server/functions
node -e "require('dotenv').config(); console.log(process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...')"

# Test Stripe connection
node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
stripe.prices.list({limit: 3}).then(prices => console.log('Stripe connected:', prices.data.length, 'prices found'));
"

# Check Firebase emulator status
curl http://127.0.0.1:4000/
```

## Test Cards for Different Scenarios

```bash
# Successful payment
4242 4242 4242 4242

# Payment requires authentication
4000 0025 0000 3155

# Payment is declined
4000 0000 0000 0002

# Insufficient funds
4000 0000 0000 9995
```

## Frontend Integration Example

Once the backend is working, you can test frontend integration:

```javascript
// In your React component
const handleSubscribe = async () => {
  try {
    const response = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: 'price_1...', // Your price ID
        successUrl: window.location.origin + '/success',
        cancelUrl: window.location.origin + '/cancel'
      })
    });
    
    const { data } = await response.json();
    window.location.href = data.url;
  } catch (error) {
    console.error('Subscription error:', error);
  }
};
```

This guide should get you up and running with local testing of the payment system!