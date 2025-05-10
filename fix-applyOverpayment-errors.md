# Plan to Fix TypeScript Errors in applyOverpayment Function Calls

## Problem Description

There are TypeScript errors in several test files related to the `applyOverpayment` function. The function signature has been updated to require 5 arguments, but the test files are still calling it with only 4 arguments.

Current function signature in `calculationEngine.ts`:
```typescript
export function applyOverpayment(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
  loanDetails: LoanDetails,
  effect: 'reduceTerm' | 'reducePayment'
): CalculationResults {
  // ...
}
```

The errors occur because the test files are passing the `effect` parameter as the 4th argument, but the function now expects a `loanDetails` object as the 4th argument and the `effect` as the 5th argument.

## Files to Fix

1. `client/src/lib/calculationEngine.test.ts` (lines 153 and 161)
2. `client/src/lib/comprehensive-tests/basic-validation.test.ts` (lines 193 and 223)

## Required Changes

### 1. Fix in calculationEngine.test.ts

```typescript
// Line 153: Add loanDetails parameter
const overpaymentResult = await applyOverpayment(paymentData, 10000, 12, 'reduceTerm');

// Should be changed to:
const overpaymentResult = await applyOverpayment(
  paymentData, 
  10000, 
  12, 
  {
    principal: 100000, 
    interestRatePeriods: [{ startMonth: 1, interestRate: 5 }], 
    loanTerm: 10, 
    overpaymentPlans: [], 
    startDate: new Date(), 
    name: 'Test Loan'
  },
  'reduceTerm'
);

// Line 161: Add loanDetails parameter
const overpaymentResult = await applyOverpayment(paymentData, 10000, 12, 'reducePayment');

// Should be changed to:
const overpaymentResult = await applyOverpayment(
  paymentData, 
  10000, 
  12, 
  {
    principal: 100000, 
    interestRatePeriods: [{ startMonth: 1, interestRate: 5 }], 
    loanTerm: 10, 
    overpaymentPlans: [], 
    startDate: new Date(), 
    name: 'Test Loan'
  },
  'reducePayment'
);
```

### 2. Fix in basic-validation.test.ts

```typescript
// Lines 193-198: Add loanDetails parameter
const result = await engine.applyOverpayment(
  schedule, 
  overpaymentAmount, 
  afterPayment, 
  'reduceTerm'
);

// Should be changed to:
const result = await engine.applyOverpayment(
  schedule, 
  overpaymentAmount, 
  afterPayment, 
  {
    principal: 100000, // Assuming this is the principal used in createSampleSchedule
    interestRatePeriods: [{ startMonth: 1, interestRate: 5 }], // Assuming 5% interest rate
    loanTerm: 10, // Assuming 10 years term
    overpaymentPlans: [], 
    startDate: new Date(), 
    name: 'Test Loan'
  },
  'reduceTerm'
);

// Lines 223-228: Add loanDetails parameter
const result = engine.applyOverpayment(
  schedule, 
  overpaymentAmount, 
  afterPayment, 
  'reducePayment'
);

// Should be changed to:
const result = engine.applyOverpayment(
  schedule, 
  overpaymentAmount, 
  afterPayment, 
  {
    principal: 100000, // Assuming this is the principal used in createSampleSchedule
    interestRatePeriods: [{ startMonth: 1, interestRate: 5 }], // Assuming 5% interest rate
    loanTerm: 10, // Assuming 10 years term
    overpaymentPlans: [], 
    startDate: new Date(), 
    name: 'Test Loan'
  },
  'reducePayment'
);
```

## Implementation Strategy

Since we're in Architect mode, which can only edit Markdown files, we need to switch to Code mode to implement these changes. The implementation should follow these steps:

1. Switch to Code mode
2. Update each file one by one, making the changes outlined above
3. Run the tests to verify that the TypeScript errors are resolved

## Example from Working Code

For reference, here's an example of a working call to `applyOverpayment` from the `overpayment.test.ts` file:

```typescript
const overpaymentResults = await applyOverpayment(
  standardResults.amortizationSchedule,
  overpaymentAmount,
  overpaymentMonth,
  {
    principal, 
    interestRatePeriods: [{ startMonth: 1, interestRate: interestRate }], 
    loanTerm: termYears, 
    overpaymentPlans: [], 
    startDate: new Date(), 
    name: 'Test Loan'
  },
  'reduceTerm'
);
```

This example shows how to properly structure the `loanDetails` object as the 4th parameter.

## Potential Challenges

1. The test files might be using different values for principal, interest rate, and loan term than what we've assumed. It would be best to extract these values from the context of each test if possible.

2. There might be additional calls to `applyOverpayment` in other files that we haven't identified yet. After fixing the known issues, we should run a full TypeScript check to identify any remaining errors.

## Next Steps

1. Switch to Code mode to implement these changes
2. Run TypeScript checks to verify all errors are resolved
3. Run the tests to ensure functionality is maintained