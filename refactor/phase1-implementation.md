# Phase 1 Implementation Plan: Breaking the Circular Dependency

This document provides a detailed, step-by-step implementation plan for Phase 1 of the refactoring process: breaking the circular dependency between `calculationEngine.ts` and `mortgage-calculator.ts`.

## Prerequisites

Before starting the implementation, ensure:

1. All tests are passing in the current state
2. You have a backup of the original files
3. You understand the current dependencies and functionality

## Step 1: Create the Core Calculation Module

### 1.1 Create calculationCore.ts

Create a new file `client/src/lib/calculationCore.ts` with the following content:

```typescript
/**
 * Core calculation functions shared between calculationEngine and mortgage-calculator
 * This module helps break the circular dependency between these components
 */

import { PaymentData } from './types';

/**
 * Rounds a number to two decimal places (cents)
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculates the monthly payment amount for a loan
 *
 * Formula: M = P[r(1+r)^n]/[(1+r)^n-1] where:
 * M = monthly payment
 * P = loan principal
 * r = monthly interest rate (annual rate / 12 / 100)
 * n = number of monthly payments (term * 12)
 */
export function calculateBaseMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // For extremely low rates (near-zero), use simple division
  if (Math.abs(monthlyRate) < 0.0001) { // 0.01% annual rate threshold
    return roundToCents(principal / totalMonths);
  }
  
  // For very low rates, use simplified calculation
  if (monthlyRate < 0.001) { // 0.12% annual rate threshold
    const totalPayment = principal * (1 + (monthlyRate * totalMonths));
    return roundToCents(totalPayment / totalMonths);
  }
  
  // Standard formula for normal interest rates
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  return roundToCents(payment);
}

/**
 * Converts legacy schedule format to PaymentData
 * This function is used by both calculationEngine and mortgage-calculator
 */
export function convertScheduleFormat(schedule: any): PaymentData {
  return {
    payment: schedule.paymentNum || schedule.payment,
    monthlyPayment: schedule.monthlyPayment || schedule.payment,
    principalPayment: schedule.principalPayment,
    interestPayment: schedule.interestPayment,
    balance: schedule.remainingPrincipal || schedule.balance,
    isOverpayment: schedule.isOverpayment || false,
    overpaymentAmount: schedule.overpaymentAmount || 0,
    totalInterest: schedule.totalInterest || 0,
    totalPayment: schedule.totalPayment || schedule.payment,
    paymentDate: schedule.paymentDate,
    currency: schedule.currency
  };
}
```

### 1.2 Create Unit Tests for calculationCore.ts

Create a new file `client/src/lib/calculationCore.test.ts` with the following content:

```typescript
import { roundToCents, calculateBaseMonthlyPayment, convertScheduleFormat } from './calculationCore';

describe('calculationCore', () => {
  describe('roundToCents', () => {
    test('rounds to two decimal places', () => {
      expect(roundToCents(123.456)).toBe(123.46);
      expect(roundToCents(123.454)).toBe(123.45);
      expect(roundToCents(0.001)).toBe(0);
      expect(roundToCents(0.005)).toBe(0.01);
    });
  });

  describe('calculateBaseMonthlyPayment', () => {
    test('calculates payment for standard interest rate', () => {
      // $300,000 loan at 5% for 30 years
      const principal = 300000;
      const monthlyRate = 0.05 / 12; // 5% annual rate
      const totalMonths = 30 * 12; // 30 years
      
      const result = calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(1610.46, 2);
    });

    test('calculates payment for very low interest rate', () => {
      // $300,000 loan at 0.1% for 30 years
      const principal = 300000;
      const monthlyRate = 0.001 / 12; // 0.1% annual rate
      const totalMonths = 30 * 12; // 30 years
      
      const result = calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(834.75, 2);
    });

    test('calculates payment for zero interest rate', () => {
      // $300,000 loan at 0% for 30 years
      const principal = 300000;
      const monthlyRate = 0;
      const totalMonths = 30 * 12; // 30 years
      
      const result = calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
      expect(result).toBeCloseTo(833.33, 2);
    });
  });

  describe('convertScheduleFormat', () => {
    test('converts legacy format to PaymentData', () => {
      const legacySchedule = {
        paymentNum: 1,
        monthlyPayment: 1000,
        principalPayment: 200,
        interestPayment: 800,
        remainingPrincipal: 99800,
        isOverpayment: false,
        overpaymentAmount: 0
      };
      
      const result = convertScheduleFormat(legacySchedule);
      
      expect(result).toEqual({
        payment: 1,
        monthlyPayment: 1000,
        principalPayment: 200,
        interestPayment: 800,
        balance: 99800,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 0,
        totalPayment: 1000,
        paymentDate: undefined,
        currency: undefined
      });
    });

    test('handles alternative property names', () => {
      const alternativeSchedule = {
        payment: 1,
        payment: 1000,
        principalPayment: 200,
        interestPayment: 800,
        balance: 99800
      };
      
      const result = convertScheduleFormat(alternativeSchedule);
      
      expect(result.payment).toBe(1);
      expect(result.monthlyPayment).toBe(1000);
      expect(result.balance).toBe(99800);
      expect(result.isOverpayment).toBe(false);
    });
  });
});
```

## Step 2: Update mortgage-calculator.ts

### 2.1 Modify mortgage-calculator.ts

Update `client/src/lib/mortgage-calculator.ts` to use the new core module:

```typescript
/**
 * This file contains the core calculation logic for the mortgage calculator.
 * It handles amortization schedules, monthly payments and overpayment scenarios.
 */

// Using the types from types.ts for consistency
import { LoanDetails, OverpaymentDetails, PaymentData } from './types';
import { generateAmortizationSchedule, formatCurrency, formatDate } from './utils';
import { convertScheduleFormat } from './calculationCore';

// Re-export these utilities for backward compatibility
export { formatCurrency, formatDate };

// Convert legacy Schedule format to PaymentData
export function convertLegacySchedule(schedule: any): PaymentData {
  return convertScheduleFormat(schedule);
}

// Other mortgage-calculator specific functions...
```

### 2.2 Update Tests for mortgage-calculator.ts

Ensure any tests for `mortgage-calculator.ts` are updated to use the new structure.

## Step 3: Update calculationEngine.ts

### 3.1 Modify calculationEngine.ts

Update `client/src/lib/calculationEngine.ts` to use the new core module:

```typescript
// calculationEngine.ts
import {
  CalculationResults,
  PaymentData,
  OverpaymentDetails,
  YearlyData,
  LoanDetails,
  RepaymentModel,
  AdditionalCosts,
  FeeType
} from "./types";
import { validateInputs } from "./validation";
import { generateAmortizationSchedule, formatCurrency } from "./utils";
import { convertScheduleFormat, calculateBaseMonthlyPayment, roundToCents } from './calculationCore';

// Remove import from mortgage-calculator.ts
// import { convertLegacySchedule } from "./mortgage-calculator.ts";

/**
 * Calculate monthly payment for decreasing installments model
 * In this model, the principal portion remains constant and the interest portion decreases over time
 */
export function calculateDecreasingInstallment(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  currentMonth: number
): number {
  // Fixed principal portion
  const principalPortion = principal / totalMonths;

  // Remaining balance after previous payments
  const remainingBalance = principal - (principalPortion * (currentMonth - 1));

  // Interest portion based on remaining balance
  const interestPortion = remainingBalance * monthlyRate;

  // Total payment for this month
  return roundToCents(principalPortion + interestPortion);
}

// ... rest of the file

// Update convertAndProcessSchedule to use convertScheduleFormat
export function convertAndProcessSchedule(rawSchedule: any[]): PaymentData[] {
  const paymentData: PaymentData[] = rawSchedule.map(item => {
    const converted = convertScheduleFormat(item);
    return {
      payment: converted.payment || 0,
      isOverpayment: converted.isOverpayment,
      overpaymentAmount: converted.overpaymentAmount || 0,
      monthlyPayment: roundToCents(converted.monthlyPayment),
      interestPayment: roundToCents(converted.interestPayment),
      principalPayment: roundToCents(converted.principalPayment),
      balance: roundToCents(converted.balance),
      totalPayment: roundToCents(converted.totalPayment ?? converted.monthlyPayment),
      totalInterest: 0
    };
  });

  // Calculate cumulative interest
  let cumulativeInterest = 0;
  for (const pd of paymentData) {
    cumulativeInterest += pd.interestPayment;
    pd.totalInterest = roundToCents(cumulativeInterest);
  }

  return paymentData;
}

// Update convertAndProcessScheduleWithFees to use convertScheduleFormat
export function convertAndProcessScheduleWithFees(rawSchedule: any[], additionalCosts?: AdditionalCosts): PaymentData[] {
  const paymentData: PaymentData[] = rawSchedule.map(item => {
    const converted = convertScheduleFormat(item);

    // Calculate recurring fees for this payment
    const fees = additionalCosts ? calculateRecurringFees(converted.balance, additionalCosts) : 0;

    return {
      payment: converted.payment || 0,
      isOverpayment: converted.isOverpayment,
      overpaymentAmount: converted.overpaymentAmount || 0,
      monthlyPayment: roundToCents(converted.monthlyPayment),
      interestPayment: roundToCents(converted.interestPayment),
      principalPayment: roundToCents(converted.principalPayment),
      balance: roundToCents(converted.balance),
      totalPayment: roundToCents((converted.totalPayment ?? converted.monthlyPayment) + fees),
      totalInterest: 0,
      fees: fees
    };
  });

  // Calculate cumulative interest
  let cumulativeInterest = 0;
  for (const pd of paymentData) {
    cumulativeInterest += pd.interestPayment;
    pd.totalInterest = roundToCents(cumulativeInterest);
  }

  return paymentData;
}

// Update calculateMonthlyPaymentInternal to use calculateBaseMonthlyPayment
export function calculateMonthlyPaymentInternal(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // Handle edge cases
  return calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
}

// ... rest of the file
```

### 3.2 Update Tests for calculationEngine.ts

Ensure all tests for `calculationEngine.ts` are updated to use the new structure.

## Step 4: Update utils.ts

### 4.1 Modify utils.ts

Update `client/src/lib/utils.ts` to use the new core module for the calculation functions:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentData, OverpaymentDetails, RepaymentModel } from "./types";
import { format } from "date-fns";
import { enUS, es, pl } from "date-fns/locale";
import i18n from "@/i18n";
import { calculateBaseMonthlyPayment, roundToCents } from './calculationCore';

export const CURRENCIES = [
  // ... existing currencies
];

export function areMonetaryValuesEqual(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(roundToCents(a) - roundToCents(b)) <= tolerance;
}

/**
 * Calculates the monthly payment amount for a loan
 * This is now a wrapper around the core function for backward compatibility
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  return calculateBaseMonthlyPayment(principal, monthlyRate, totalMonths);
}

// Re-export roundToCents for backward compatibility
export { roundToCents };

// ... rest of the file
```

## Step 5: Run Tests and Verify

### 5.1 Run All Tests

Run the test suite to ensure all tests pass with the new structure:

```
npm test
```

### 5.2 Verify Application Functionality

Test the application manually to ensure it still works correctly with the new structure.

## Step 6: Clean Up

### 6.1 Remove Unused Code

Remove any unused code or commented-out imports.

### 6.2 Update Documentation

Update documentation to reflect the new structure.

## Rollback Plan

If issues are encountered during the refactoring:

1. Revert the changes to the original files
2. Run tests to ensure the application is back to its original state
3. Analyze what went wrong and adjust the refactoring plan

## Conclusion

This implementation plan breaks the circular dependency between `calculationEngine.ts` and `mortgage-calculator.ts` by extracting shared logic to a new `calculationCore.ts` module. This is the first step in improving the architecture of the mortgage calculator application.

The next phase will focus on separating calculation logic from presentation concerns by creating a dedicated formatting module.