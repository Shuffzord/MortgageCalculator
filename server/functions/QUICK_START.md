# Payment System Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Run Setup Script
```bash
cd server/functions
node setup-payment-testing.js
```

### 2. Configure Stripe Keys
```bash
# Copy the template
cp .env.example .env

# Edit .env file with your Stripe test keys
# Get keys from: https://dashboard.stripe.com/test/apikeys
```

### 3. Start Emulators
```bash
npm run serve:emulators
```

### 4. Test the System
```bash
node src/test-payment-endpoints.js
```

## 📋 Required Stripe Setup

### Get Test API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret Key** (`sk_test_...`)
3. Copy your **Publishable Key** (`pk_test_...`)

### Create Test Products
1. Go to [Products](https://dashboard.stripe.com/test/products)
2. Create **Premium Monthly**: $9.99/month recurring
3. Create **Premium Yearly**: $99.99/year recurring
4. Copy the **Price IDs** (`price_...`)

### Your .env file should look like:
```env
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1ABC123...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1ABC123...
```

## 🧪 Test Endpoints

### Basic Tests (No Auth)
```bash
# Get Stripe config
curl http://127.0.0.1:5001/mortgage-firebase-firebase/us-central1/api/payments/config

# Get subscription plans
curl http://127.0.0.1:5001/mortgage-firebase-firebase/us-central1/api/payments/plans
```

### Authenticated Tests
```bash
# Run the full test suite
node src/test-payment-endpoints.js
```

## 🔧 Webhook Testing (Optional)

### Install Stripe CLI
```bash
# Download from: https://stripe.com/docs/stripe-cli
stripe login
```

### Forward Webhooks
```bash
stripe listen --forward-to http://127.0.0.1:5001/mortgage-firebase-firebase/us-central1/api/payments/webhook
```

## 📚 Documentation

- **Complete Guide**: `LOCAL_TESTING_GUIDE.md`
- **API Documentation**: `PAYMENT_SYSTEM.md`
- **Architecture**: `FIREBASE_AUTH_ARCHITECTURE.md`

## 🎯 Test Payment Flow

1. **Create checkout session** → Get Stripe checkout URL
2. **Complete payment** → Use test card `4242 4242 4242 4242`
3. **Verify subscription** → Check user tier upgraded to Premium
4. **Test customer portal** → Manage subscription

## ⚡ Quick Commands

```bash
# Setup
node setup-payment-testing.js

# Test
node src/test-payment-endpoints.js

# Build
npm run build

# Start emulators
npm run serve:emulators
```

That's it! Your payment system is ready for testing! 🎉