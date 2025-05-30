#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Payment System Local Testing Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created from .env.example');
    console.log('⚠️  Please edit .env file with your actual Stripe keys\n');
  } else {
    console.log('❌ .env.example not found');
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check for required environment variables
console.log('🔍 Checking environment configuration...');

require('dotenv').config();

const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
  'FB_PROJECT_ID'
];

const missingVars = [];
const configuredVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName] && !process.env[varName].includes('...')) {
    configuredVars.push(varName);
  } else {
    missingVars.push(varName);
  }
});

if (configuredVars.length > 0) {
  console.log('✅ Configured variables:');
  configuredVars.forEach(varName => {
    const value = process.env[varName];
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`   ${varName}: ${displayValue}`);
  });
  console.log('');
}

if (missingVars.length > 0) {
  console.log('⚠️  Missing or incomplete variables:');
  missingVars.forEach(varName => {
    console.log(`   ${varName}`);
  });
  console.log('');
}

// Provide setup instructions
console.log('📋 Setup Instructions:');
console.log('======================\n');

console.log('1. Get Stripe Test Keys:');
console.log('   → Go to https://dashboard.stripe.com/test/apikeys');
console.log('   → Copy your Secret Key (sk_test_...) and Publishable Key (pk_test_...)');
console.log('   → Add them to your .env file\n');

console.log('2. Create Stripe Products:');
console.log('   → Go to https://dashboard.stripe.com/test/products');
console.log('   → Create "Premium Monthly" product with $9.99/month recurring price');
console.log('   → Create "Premium Yearly" product with $99.99/year recurring price');
console.log('   → Copy the Price IDs (price_...) to your .env file\n');

console.log('3. Set up Webhook (Optional for basic testing):');
console.log('   → Install Stripe CLI: https://stripe.com/docs/stripe-cli');
console.log('   → Run: stripe login');
console.log('   → Run: stripe listen --forward-to http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/webhook');
console.log('   → Copy the webhook secret (whsec_...) to your .env file\n');

console.log('4. Start Firebase Emulators:');
console.log('   → Run: npm run serve:emulators\n');

console.log('5. Test the Payment System:');
console.log('   → Run: node src/test-payment-endpoints.js\n');

// Test Stripe connection if keys are available
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('...')) {
  console.log('🔌 Testing Stripe connection...');
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    stripe.prices.list({ limit: 3 })
      .then(prices => {
        console.log(`✅ Stripe connected successfully! Found ${prices.data.length} prices.`);
        
        if (prices.data.length > 0) {
          console.log('   Available prices:');
          prices.data.forEach(price => {
            const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'Free';
            const interval = price.recurring ? `/${price.recurring.interval}` : '';
            console.log(`   → ${price.id}: ${amount}${interval}`);
          });
        }
        console.log('');
        
        // Check if our configured price IDs exist
        const monthlyPriceId = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
        const yearlyPriceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;
        
        if (monthlyPriceId && !monthlyPriceId.includes('...')) {
          const monthlyExists = prices.data.some(p => p.id === monthlyPriceId);
          console.log(`${monthlyExists ? '✅' : '❌'} Monthly price ID (${monthlyPriceId}) ${monthlyExists ? 'found' : 'not found'}`);
        }
        
        if (yearlyPriceId && !yearlyPriceId.includes('...')) {
          const yearlyExists = prices.data.some(p => p.id === yearlyPriceId);
          console.log(`${yearlyExists ? '✅' : '❌'} Yearly price ID (${yearlyPriceId}) ${yearlyExists ? 'found' : 'not found'}`);
        }
      })
      .catch(error => {
        console.log('❌ Stripe connection failed:', error.message);
      });
  } catch (error) {
    console.log('❌ Error testing Stripe connection:', error.message);
  }
} else {
  console.log('⚠️  Stripe keys not configured - skipping connection test');
}

console.log('\n🎯 Quick Test Commands:');
console.log('=======================');
console.log('# Test basic endpoints (no auth required):');
console.log('curl http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/config');
console.log('curl http://127.0.0.1:5001/mortgage-firebase-firebase/europe-west3/api/payments/plans\n');

console.log('# Run full test suite:');
console.log('node src/test-payment-endpoints.js\n');

console.log('📚 For detailed instructions, see: LOCAL_TESTING_GUIDE.md');