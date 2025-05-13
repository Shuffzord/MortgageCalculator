# Outdated Files and Methods to Remove

This document provides a detailed list of files and methods that are now outdated after the refactoring work and can be safely removed once all components have been updated to use the new architecture.

## Outdated Files

No outdated files were found that can be immediately removed. The refactoring has focused on restructuring the codebase rather than replacing entire files.

## Outdated Methods

### In utils.ts

These methods should be removed from utils.ts as they have been moved to dedicated modules:

1. **Calculation Methods (moved to calculationCore.ts)**
   ```typescript
   // Remove these after ensuring all components use calculationCore or calculationService
   export function calculateMonthlyPayment(principal: number, monthlyRate: number, totalMonths: number): number
   export function roundToCents(amount: number): number
   ```

2. **Overpayment Methods (moved to overpaymentCalculator.ts)**
   ```typescript
   // Remove these after ensuring all components use overpaymentCalculator or calculationService
   export function calculateReducedTermSchedule(balance: number, interestRatePeriods: { startMonth: number; interestRate: number; }[], monthlyPayment: number, startPaymentNumber: number): PaymentData[]
   export function calculateReducedPaymentSchedule(balance: number, interestRatePeriods: { startMonth: number; interestRate: number; }[], remainingMonths: number, originalPayment: number, startPaymentNumber: number): PaymentData[]
   ```

3. **Complex Logic (should be moved to a dedicated module)**
   ```typescript
   // Move this to calculationEngine.ts or a dedicated module
   export function generateAmortizationSchedule(principal: number, interestRatePeriods: { startMonth: number; interestRate: number; }[], termYears: number, overpaymentAmount?: number | OverpaymentDetails, overpaymentMonth?: number | Date, reduceTermNotPayment?: boolean, startDate?: Date, repaymentModel?: RepaymentModel): PaymentData[]
   ```

### In calculationEngine.ts

These methods should be updated or removed as they have been replaced by methods in other modules:

1. **Core Calculation Methods (moved to calculationCore.ts)**
   ```typescript
   // Remove these after ensuring all components use calculationCore or calculationService
   export function calculateMonthlyPaymentInternal(principal: number, monthlyRate: number, totalMonths: number): number
   export function convertAndProcessSchedule(rawSchedule: any[]): PaymentData[]
   ```

2. **Overpayment Methods (moved to overpaymentCalculator.ts)**
   ```typescript
   // Remove these after ensuring all components use overpaymentCalculator or calculationService
   export function applyOverpayment(schedule: PaymentData[], overpaymentAmount: number, afterPayment: number, loanDetails: LoanDetails, effect: 'reduceTerm' | 'reducePayment'): CalculationResults
   export function applyMultipleOverpayments(schedule: PaymentData[], overpaymentPlans: OverpaymentDetails[], startDate?: Date, loanDetails?: LoanDetails): PaymentData[]
   ```

### In mortgage-calculator.ts

These methods should be updated or removed as they have been replaced by methods in other modules:

1. **Conversion Methods (moved to calculationCore.ts)**
   ```typescript
   // Remove these after ensuring all components use calculationCore or calculationService
   export function convertLegacySchedule(schedule: any): PaymentData
   ```

## UI Component Updates Needed

The following components need to be updated to use the calculationService instead of directly importing from utils.ts, calculationEngine.ts, or mortgage-calculator.ts:

1. **HomePage.tsx**
   ```typescript
   // Change this:
   import { calculateLoanDetails } from "@/lib/calculationEngine";
   
   // To this:
   import { calculationService } from "@/lib/services/calculationService";
   ```

2. **ScenarioComparison.tsx, visualization.tsx, etc.**
   ```typescript
   // Change this:
   import { formatCurrency, formatTimePeriod } from '@/lib/utils';
   
   // To this:
   import { formatCurrency, formatTimePeriod } from '@/lib/formatters';
   // Or preferably:
   import { calculationService } from "@/lib/services/calculationService";
   // Then use calculationService.formatCurrency() and calculationService.formatTimePeriod()
   ```

## Implementation Plan

1. **Phase 1: Update UI Components**
   - Update all UI components to use the calculationService or formatters module
   - Test each component after updating to ensure functionality is preserved

2. **Phase 2: Remove Redundant Methods**
   - Once all components are updated, remove the redundant methods from utils.ts
   - Keep the re-export statements for backward compatibility if needed

3. **Phase 3: Clean Up Remaining Code**
   - Move generateAmortizationSchedule to a more appropriate module
   - Remove any remaining redundant code

## Testing Strategy

For each component update:
1. Run the existing test suite to ensure functionality is preserved
2. Manually test the component to verify visual and functional correctness
3. Add new tests for the updated component if needed

## Rollback Plan

If issues are encountered during the cleanup:
1. Revert the changes to the affected component
2. Analyze what went wrong
3. Adjust the approach and try again