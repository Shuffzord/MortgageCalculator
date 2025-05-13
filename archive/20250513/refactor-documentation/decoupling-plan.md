# Decoupling and Separation of Concerns Plan

## Phase 1: Breaking the Circular Dependency

The circular dependency between `calculationEngine.ts` and `mortgage-calculator.ts` is a critical architectural issue that needs to be addressed first. This dependency makes the code harder to maintain, test, and reason about.

### Step 1: Create a Core Calculation Module

1. Create a new file `calculationCore.ts` that will contain the shared logic between the two modules.

```typescript
// calculationCore.ts
import { PaymentData, RepaymentModel } from './types';

/**
 * Core calculation functions that are used by both calculationEngine and mortgage-calculator
 */

/**
 * Calculates the monthly payment amount for a loan
 */
export function calculateBaseMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  // Implementation from utils.ts
  // For extremely low rates (near-zero), use simple division
  if (Math.abs(monthlyRate) < 0.0001) {
    return roundToCents(principal / totalMonths);
  }
  
  // For very low rates, use simplified calculation
  if (monthlyRate < 0.001) {
    const totalPayment = principal * (1 + (monthlyRate * totalMonths));
    return roundToCents(totalPayment / totalMonths);
  }
  
  // Standard formula for normal interest rates
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
  return roundToCents(payment);
}

/**
 * Rounds a number to two decimal places (cents)
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Converts legacy schedule format to PaymentData
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

### Step 2: Update mortgage-calculator.ts

Refactor `mortgage-calculator.ts` to use the new core module instead of importing from `calculationEngine.ts`.

```typescript
// mortgage-calculator.ts
import { LoanDetails, OverpaymentDetails, PaymentData } from './types';
import { generateAmortizationSchedule, formatCurrency, formatDate } from './utils';
import { convertScheduleFormat } from './calculationCore';

// Re-export these utilities for backward compatibility
export { formatCurrency, formatDate };

// Use the shared convertScheduleFormat function instead of local implementation
export function convertLegacySchedule(schedule: any): PaymentData {
  return convertScheduleFormat(schedule);
}

// Other mortgage-calculator specific functions...
```

### Step 3: Update calculationEngine.ts

Refactor `calculationEngine.ts` to use the new core module for shared functionality.

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

// Use the shared functions instead of importing from mortgage-calculator
export function convertAndProcessSchedule(rawSchedule: any[]): PaymentData[] {
  const paymentData: PaymentData[] = rawSchedule.map(item => {
    const converted = convertScheduleFormat(item);
    // Rest of the function...
  });
  // ...
}

// Other calculation engine functions...
```

## Phase 2: Separating Calculation from Presentation Logic

After breaking the circular dependency, the next step is to separate calculation logic from presentation concerns.

### Step 1: Create a Formatting Module

Create a new file `formatters.ts` to handle all formatting-related functions.

```typescript
// formatters.ts
import { PaymentData, CalculationResults, YearlyData } from './types';
import { format } from "date-fns";
import { enUS, es, pl } from "date-fns/locale";
import i18n from "@/i18n";

/**
 * Formats a number as currency
 */
export function formatCurrency(
  value: number,
  locale?: string,
  currency: string = "USD",
): string {
  // Implementation from utils.ts
  const currentLocale = locale || (i18n.language === 'pl' ? 'pl-PL' :
                                  i18n.language === 'es' ? 'es-ES' : 'en-US');
  
  return new Intl.NumberFormat(currentLocale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date to a human-readable string with language-specific formatting
 */
export function formatDate(date: Date, formatStr: string = "PPP"): string {
  // Implementation from utils.ts
  const language = i18n.language || 'en';
  const locale = language === 'pl' ? pl : language === 'es' ? es : enUS;
  
  return format(date, formatStr, { locale });
}

/**
 * Formats a time period in months as years and months
 */
export function formatTimePeriod(months: number): string {
  // Implementation from utils.ts
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let formattedString = "";

  if (years > 0) {
    formattedString += `${years} year${years > 1 ? "s" : ""} `;
  }

  if (remainingMonths > 0) {
    formattedString += `${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
  }

  return formattedString.trim();
}

/**
 * Formats an amortization schedule for display or export
 */
export function formatAmortizationSchedule(
  schedule: PaymentData[],
  currency: string = "USD",
  locale?: string
): PaymentData[] {
  return schedule.map(payment => ({
    ...payment,
    formattedValues: {
      monthlyPayment: formatCurrency(payment.monthlyPayment, locale, currency),
      principalPayment: formatCurrency(payment.principalPayment, locale, currency),
      interestPayment: formatCurrency(payment.interestPayment, locale, currency),
      balance: formatCurrency(payment.balance, locale, currency),
      totalInterest: formatCurrency(payment.totalInterest, locale, currency),
      totalPayment: formatCurrency(payment.totalPayment, locale, currency),
      paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : '',
    }
  }));
}

/**
 * Formats calculation results for display
 */
export function formatCalculationResults(
  results: CalculationResults,
  currency: string = "USD",
  locale?: string
): CalculationResults & { formattedValues: Record<string, string> } {
  return {
    ...results,
    formattedValues: {
      monthlyPayment: formatCurrency(results.monthlyPayment, locale, currency),
      totalInterest: formatCurrency(results.totalInterest, locale, currency),
      originalTerm: `${results.originalTerm} years`,
      actualTerm: `${results.actualTerm.toFixed(2)} years`,
      oneTimeFees: results.oneTimeFees ? formatCurrency(results.oneTimeFees, locale, currency) : '',
      recurringFees: results.recurringFees ? formatCurrency(results.recurringFees, locale, currency) : '',
      totalCost: results.totalCost ? formatCurrency(results.totalCost, locale, currency) : '',
      apr: results.apr ? `${results.apr.toFixed(2)}%` : '',
    }
  };
}
```

### Step 2: Update utils.ts

Refactor `utils.ts` to focus on calculation utilities and remove formatting functions.

```typescript
// utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentData, OverpaymentDetails, RepaymentModel } from "./types";
import { calculateBaseMonthlyPayment, roundToCents } from './calculationCore';

// Re-export core functions for backward compatibility
export { calculateBaseMonthlyPayment, roundToCents };

// Re-export formatters for backward compatibility
export { formatCurrency, formatDate, formatTimePeriod } from './formatters';

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
];

export function areMonetaryValuesEqual(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(roundToCents(a) - roundToCents(b)) <= tolerance;
}

// Keep the generateAmortizationSchedule function here for now
// This will be refactored in a later phase
export function generateAmortizationSchedule(
  // ... existing parameters
): PaymentData[] {
  // ... existing implementation
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : CURRENCIES[0].symbol;
}

// Other calculation utility functions...
```

### Step 3: Update calculationEngine.ts

Remove formatting logic from the calculation engine.

```typescript
// calculationEngine.ts
// Remove imports of formatting functions
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
import { generateAmortizationSchedule, areMonetaryValuesEqual } from "./utils";
import { convertScheduleFormat, calculateBaseMonthlyPayment, roundToCents } from './calculationCore';

// Remove any formatting logic from functions
// Focus solely on calculations

// ... rest of the file
```

## Phase 3: Update Import References

After creating the new modules and refactoring the existing ones, we need to update all import references throughout the codebase.

### Step 1: Update UI Components

Update UI components to import formatting functions from the new formatters module.

```typescript
// Example: OverpaymentOptimizationPanel.tsx
import { formatCurrency, formatTimePeriod } from "@/lib/formatters";
import { getCurrencySymbol } from "@/lib/utils";
```

### Step 2: Update Test Files

Update test files to use the new module structure.

```typescript
// Example: calculationEngine.test.ts
import { calculateLoanDetails } from '../calculationEngine';
import { roundToCents } from '../calculationCore';
```

## Testing Strategy

For each step of this refactoring:

1. Write tests for the new modules before refactoring
2. Ensure all existing tests pass after refactoring
3. Add new tests for edge cases
4. Verify that the application still works correctly

## Conclusion

This decoupling plan addresses the two most critical architectural issues:

1. Breaking the circular dependency between calculationEngine.ts and mortgage-calculator.ts
2. Separating calculation logic from presentation concerns

By implementing these changes, we'll establish a more maintainable foundation for further refactoring efforts. The code will be more modular, easier to test, and have clearer separation of concerns.