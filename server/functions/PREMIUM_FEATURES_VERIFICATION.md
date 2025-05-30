# Premium Features System - Verification Guide

This guide provides step-by-step instructions to verify that the Premium Features System is working correctly.

## 🚀 Quick Start Verification

### 1. Build and Start the Server

```bash
cd server/functions
npm run build
npm run serve
```

The server should start without errors and display:
```
✅ Server running on port 5001
✅ All premium routes registered
```

### 2. Run the Premium Features Test Suite

```bash
cd server/functions/src
node test-premium-endpoints.js
```

Expected output:
```
🚀 Starting Premium Features Test Suite...
==================================================
🔐 Testing Authentication...
✅ Authentication successful
📊 Creating test calculation...
✅ Test calculation created
🔄 Testing Loan Comparison...
✅ Comparison calculation successful
✅ Comparison saved
📈 Testing Scenario Modeling...
✅ Generated rate change scenarios
✅ Scenario analysis saved
📄 Testing Export Generation...
✅ PDF export request created
✅ Excel export request created
✅ CSV export request created
==================================================
📊 Test Results:
✅ Passed: 6
❌ Failed: 0
📈 Success Rate: 100.0%
🎉 All premium features tests passed!
```

## 🔍 Manual Verification Steps

### Step 1: Verify Premium Access Control

#### Test Premium User Access
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "premium@test.com", "password": "testpassword123"}'
```

Save the returned token and test premium endpoint access:
```bash
curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: `200 OK` with comparison data

#### Test Free User Access (Should Fail)
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "free@test.com", "password": "testpassword123"}'

curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "free@test.com", "password": "testpassword123"}'

curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons \
  -H "Authorization: Bearer FREE_USER_TOKEN"
```

Expected: `403 Forbidden` with message "Premium subscription required"

### Step 2: Verify Loan Comparison Engine

#### Test Comparison Calculation
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Comparison",
    "loans": [
      {
        "title": "Loan A",
        "loanAmount": 500000,
        "interestRate": 4.5,
        "loanTerm": 30
      },
      {
        "title": "Loan B",
        "loanAmount": 500000,
        "interestRate": 4.0,
        "loanTerm": 30
      }
    ]
  }'
```

Expected Response Structure:
```json
{
  "success": true,
  "data": {
    "loans": [...],
    "summary": {
      "bestLoan": {
        "id": "...",
        "title": "Loan B",
        "reason": "Lowest total cost: $..."
      },
      "totalSavings": 50000
    },
    "charts": {
      "monthlyPayments": [...],
      "totalCosts": [...]
    }
  }
}
```

#### Test Comparison Limits
Try with 6 loans (should fail):
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Too Many Loans",
    "loans": [/* 6 loan objects */]
  }'
```

Expected: `400 Bad Request` with validation error

### Step 3: Verify Scenario Modeling

#### Test Rate Change Scenarios
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/scenarios/rate-change \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Array of 5 predefined rate change scenarios

#### Test Stress Test Scenarios
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/scenarios/stress-test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Array of 3 stress test scenarios (mild, moderate, severe)

#### Test Custom What-If Analysis
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/scenarios/what-if \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom Analysis",
    "baseCalculationId": "YOUR_CALCULATION_ID",
    "scenarios": [
      {
        "name": "Rate +1%",
        "type": "rate-change",
        "parameters": {"rateChange": 1.0}
      }
    ]
  }'
```

Expected: Detailed scenario analysis with risk assessment

### Step 4: Verify Export Generation

#### Test PDF Export
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/exports/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "calculation",
    "dataId": "YOUR_CALCULATION_ID"
  }'
```

Expected: Export request with status "pending"

#### Test Export Status
```bash
curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/exports/EXPORT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Export status (pending/processing/completed/failed)

#### Test Export History
```bash
curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/exports/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: List of user's export requests

## 📊 Performance Verification

### Test Comparison Performance
Time a 5-loan comparison:
```bash
time curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Performance Test", "loans": [/* 5 loans */]}'
```

Expected: Response time < 2 seconds

### Test Scenario Calculation Performance
Time a complex scenario analysis:
```bash
time curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/scenarios/what-if \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Performance Test", "baseCalculationId": "...", "scenarios": [/* 10 scenarios */]}'
```

Expected: Response time < 3 seconds

## 🔒 Security Verification

### Test Authentication Requirements
All premium endpoints should require authentication:
```bash
curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons
```

Expected: `401 Unauthorized`

### Test Premium Tier Requirements
All premium endpoints should require premium tier:
```bash
curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons \
  -H "Authorization: Bearer FREE_USER_TOKEN"
```

Expected: `403 Forbidden`

### Test Data Isolation
Users should only access their own data:
```bash
curl -X GET http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons/OTHER_USER_COMPARISON_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: `403 Access denied`

## 📝 Validation Verification

### Test Input Validation
Try invalid loan amounts:
```bash
curl -X POST http://localhost:5001/mortgage-firebase-firebase/europe-west3/api/comparisons/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Test",
    "loans": [
      {
        "title": "Invalid Loan",
        "loanAmount": 100,
        "interestRate": 60,
        "loanTerm": 100
      }
    ]
  }'
```

Expected: `400 Bad Request` with validation errors

## ✅ Success Criteria

The Premium Features System is working correctly if:

1. ✅ **Build Success**: `npm run build` completes without errors
2. ✅ **Server Starts**: Server starts and all routes are registered
3. ✅ **Authentication Works**: Premium users can access features, free users cannot
4. ✅ **Comparisons Work**: Can compare 2-5 loans with accurate calculations
5. ✅ **Scenarios Work**: Can generate and analyze various scenarios
6. ✅ **Exports Work**: Can create PDF, Excel, and CSV exports
7. ✅ **Validation Works**: Invalid inputs are properly rejected
8. ✅ **Performance**: Responses are fast (< 3 seconds)
9. ✅ **Security**: Proper access control and data isolation
10. ✅ **Test Suite Passes**: All automated tests pass

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
- Check TypeScript compilation errors
- Ensure all dependencies are installed: `npm install`

#### Authentication Errors
- Verify Firebase configuration
- Check environment variables
- Ensure user has premium tier

#### Calculation Errors
- Verify input validation
- Check loan parameter ranges
- Ensure base calculation exists for scenarios

#### Export Errors
- Check Puppeteer installation for PDF generation
- Verify file permissions
- Check export limits (20 per day)

### Debug Mode
Enable debug logging:
```bash
DEBUG=* npm run serve
```

This will show detailed logs for troubleshooting.

## 📞 Support

If verification fails:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase project is properly configured
4. Run the test suite to identify specific failing components