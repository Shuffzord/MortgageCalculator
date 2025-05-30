# How to Get Your Stripe Price IDs

## 🎯 You Need Price IDs, Not Product IDs

Your current `.env` file has **Product IDs** (`prod_SPJ4...`), but you need **Price IDs** (`price_...`).

## 📋 Step-by-Step Instructions

### 1. Go to Your Stripe Dashboard
- Open [Stripe Dashboard](https://dashboard.stripe.com/test/products)
- Make sure you're in **Test mode** (toggle in top left)

### 2. Find Your Products
You should see your products:
- Premium Monthly
- Premium Yearly

### 3. Get the Price IDs
For each product:

1. **Click on the product name** (e.g., "Premium Monthly")
2. You'll see a **Pricing** section
3. Look for the **Price ID** that starts with `price_`
4. **Copy this Price ID** (not the Product ID)

### 4. Update Your .env File
Replace these lines in `server/functions/.env`:

```env
# Replace with your actual Price IDs
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_PRICE_ID_HERE
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_YOUR_YEARLY_PRICE_ID_HERE
```

## 🔍 What to Look For

### ✅ Correct (Price ID):
```
price_1ABC123def456ghi789
```

### ❌ Incorrect (Product ID):
```
prod_SPJ4bmRo4KCEd0
```

## 🧪 Test Your Setup

After updating the Price IDs, test your setup:

```bash
cd server/functions
node setup-payment-testing.js
```

You should see:
- ✅ Stripe connected successfully
- ✅ Monthly price ID found
- ✅ Yearly price ID found

## 🆘 If You Don't Have Prices Yet

If you only created products but no prices:

1. **Go to your product** in Stripe Dashboard
2. **Click "Add pricing"**
3. **Set up recurring pricing:**
   - Monthly: $9.99 every 1 month
   - Yearly: $99.99 every 1 year
4. **Save and copy the Price ID**

## 🎉 Once Complete

Your `.env` should look like:
```env
STRIPE_SECRET_KEY=sk_test_51N3d6v...
STRIPE_PUBLISHABLE_KEY=pk_test_51N3d6v...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1ABC123...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1DEF456...
```

Then you can test the payment system! 🚀