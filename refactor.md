# Proposed Refactoring for Mortgage Calculator Engine

This document outlines specific refactoring recommendations for the mortgage calculator engine to improve code quality, maintainability, and extensibility.

## 1. Function Size and Complexity Reduction

### Current Issues
- Several functions in `calculationEngine.ts` are overly long and complex
- The `generateAmortizationSchedule` function in `utils.ts` handles too many responsibilities
- Large functions are difficult to test, maintain, and understand

### Proposed Refactoring

#### 1.1 Break Down `generateAmortizationSchedule`

Split this function into smaller, focused functions:

```typescript
// Main orchestration function
export function generateAmortizationSchedule(
  principal: number,
  interestRatePeriods: InterestRatePeriod[],
  termYears: number,
  overpaymentPlan?: OverpaymentDetails,
  // other parameters...
): PaymentData[] {
  // Process parameters and delegate to specialized functions
  const normalizedOverpaymentPlan = normalizeOverpaymentPlan(overpaymentPlan, overpaymentMonth, reduceTermNotPayment, startDate);
  const schedule = generateBaseSchedule(principal, interestRatePeriods, termYears, repaymentModel);
  return applyOverpaymentsToSchedule(schedule, normalizedOverpaymentPlan);
}

// Helper functions
function normalizeOverpaymentPlan(/* parameters */): OverpaymentDetails { /* ... */ }
function generateBaseSchedule(/* parameters */): PaymentData[] { /* ... */ }
function applyOverpaymentsToSchedule(/* parameters */): PaymentData[] { /* ... */ }
```

#### 1.2 Refactor `calculateLoanDetails`

Break down this function into smaller, more focused functions:

```typescript
export function calculateLoanDetails(/* parameters */): CalculationResults {
  // Validate inputs and delegate to specialized functions
  validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);
  
  const oneTimeFees = calculateOneTimeFees(principal, additionalCosts);
  const rawSchedule = generateInitialSchedule(principal, interestRatePeriods, loanTerm, repaymentModel);
  const scheduleWithOverpayments = applyOverpaymentPlans(rawSchedule, overpaymentPlans, overpaymentPlan, startDate);
  const processedSchedule = processScheduleWithFees(scheduleWithOverpayments, additionalCosts);
  
  return buildCalculationResults(processedSchedule, principal, loanTerm, oneTimeFees, loanDetails);
}

// Helper functions
function generateInitialSchedule(/* parameters */): PaymentData[] { /* ... */ }
function applyOverpaymentPlans(/* parameters */): PaymentData[] { /* ... */ }
function processScheduleWithFees(/* parameters */): PaymentData[] { /* ... */ }
function buildCalculationResults(/* parameters */): CalculationResults { /* ... */ }
```

## 2. Improved Type Safety and Domain Modeling

### Current Issues
- Some functions use primitive types where domain-specific types would be clearer
- Optional parameters and backward compatibility code make function signatures complex
- Type definitions could be more precise to prevent errors

### Proposed Refactoring

#### 2.1 Create More Specific Types

```typescript
// Instead of using number for all financial values
type Principal = number;
type InterestRate = number;
type MonthlyPayment = number;
type Balance = number;

// Create more specific interfaces
interface InterestRateChange {
  month: number;
  newRate: InterestRate;
}

// Use discriminated unions for different strategies
type OverpaymentEffect = 
  | { type: 'reduceTerm' }
  | { type: 'reducePayment' };

// Use branded types for validation
type PositiveNumber = number & { readonly brand: unique symbol };
function createPositiveNumber(value: number): PositiveNumber {
  if (value <= 0) throw new Error('Value must be positive');
  return value as PositiveNumber;
}
```

#### 2.2 Simplify Function Signatures

```typescript
// Instead of overloaded functions with many parameters
export function generateAmortizationSchedule(
  loanDetails: LoanDetails,
  options: {
    overpaymentPlan?: OverpaymentDetails;
    startDate?: Date;
    repaymentModel?: RepaymentModel;
  } = {}
): PaymentData[] {
  // Implementation using destructured parameters
  const { principal, interestRatePeriods, loanTerm } = loanDetails;
  const { overpaymentPlan, startDate, repaymentModel = 'equalInstallments' } = options;
  
  // Rest of implementation
}
```

## 3. Separation of Concerns

### Current Issues
- Business logic and data transformation are sometimes mixed
- Some functions handle both calculation and formatting
- Validation logic is scattered across different functions

### Proposed Refactoring

#### 3.1 Create a Clear Layer Structure

```typescript
// Domain layer - pure business logic
namespace Domain {
  export function calculateMonthlyPayment(/* parameters */): number { /* ... */ }
  export function generateAmortizationSchedule(/* parameters */): PaymentData[] { /* ... */ }
}

// Application layer - orchestrates domain operations
namespace Application {
  export function calculateLoanDetails(/* parameters */): CalculationResults { /* ... */ }
  export function applyOverpayment(/* parameters */): CalculationResults { /* ... */ }
}

// Presentation layer - handles formatting and display
namespace Presentation {
  export function formatPaymentData(data: PaymentData): FormattedPaymentData { /* ... */ }
  export function prepareChartData(results: CalculationResults): ChartData { /* ... */ }
}
```

#### 3.2 Centralize Validation

```typescript
// Create a validation module
export namespace Validation {
  export function validateLoanDetails(details: LoanDetails): void {
    validatePrincipal(details.principal);
    validateInterestRatePeriods(details.interestRatePeriods);
    validateLoanTerm(details.loanTerm);
    // Other validations
  }
  
  export function validatePrincipal(principal: number): void {
    if (principal <= 0) throw new Error('Principal must be positive');
  }
  
  // Other validation functions
}

// Use validation in business logic
export function calculateLoanDetails(loanDetails: LoanDetails): CalculationResults {
  Validation.validateLoanDetails(loanDetails);
  // Rest of implementation
}
```

## 4. Improved Error Handling

### Current Issues
- Error messages are sometimes generic or missing
- Some edge cases might not be properly handled
- Error recovery strategies are not always clear

### Proposed Refactoring

#### 4.1 Create Domain-Specific Error Types

```typescript
// Base error class
export class MortgageCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MortgageCalculationError';
  }
}

// Specific error types
export class InvalidInputError extends MortgageCalculationError {
  constructor(parameter: string, reason: string) {
    super(`Invalid ${parameter}: ${reason}`);
    this.name = 'InvalidInputError';
  }
}

export class CalculationError extends MortgageCalculationError {
  constructor(operation: string, reason: string) {
    super(`Error during ${operation}: ${reason}`);
    this.name = 'CalculationError';
  }
}
```

#### 4.2 Implement Consistent Error Handling

```typescript
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number
): number {
  try {
    // Validate inputs
    if (principal <= 0) {
      throw new InvalidInputError('principal', 'must be positive');
    }
    if (totalMonths <= 0) {
      throw new InvalidInputError('totalMonths', 'must be positive');
    }
    
    // Handle edge cases explicitly
    if (Math.abs(monthlyRate) < 0.0001) {
      return roundToCents(principal / totalMonths);
    }
    
    // Standard calculation with error checking
    try {
      const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      if (!isFinite(compoundFactor)) {
        throw new CalculationError('compound factor calculation', 'result is not finite');
      }
      
      const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);
      if (!isFinite(payment)) {
        throw new CalculationError('payment calculation', 'result is not finite');
      }
      
      return roundToCents(payment);
    } catch (error) {
      if (error instanceof MortgageCalculationError) {
        throw error;
      }
      throw new CalculationError('monthly payment', error.message);
    }
  } catch (error) {
    // Log error for debugging
    console.error('Error in calculateMonthlyPayment:', error);
    throw error;
  }
}
```

## 5. Improved Testability

### Current Issues
- Some functions have side effects that make testing difficult
- Dependencies between functions are sometimes implicit
- Test coverage might not include all edge cases

### Proposed Refactoring

#### 5.1 Implement Pure Functions

```typescript
// Before: Function with side effects
export function applyOverpayment(schedule: PaymentData[], /* other params */): CalculationResults {
  // Modifies schedule directly
  schedule[afterPayment - 1].balance -= overpaymentAmount;
  // Rest of implementation
}

// After: Pure function without side effects
export function applyOverpayment(schedule: PaymentData[], /* other params */): CalculationResults {
  // Create a copy of the schedule
  const scheduleCopy = [...schedule];
  
  // Create a new payment object with updated balance
  const targetPayment = scheduleCopy[afterPayment - 1];
  scheduleCopy[afterPayment - 1] = {
    ...targetPayment,
    balance: targetPayment.balance - overpaymentAmount,
    isOverpayment: true,
    overpaymentAmount: overpaymentAmount
  };
  
  // Rest of implementation using scheduleCopy
}
```

#### 5.2 Use Dependency Injection

```typescript
// Before: Hard-coded dependencies
export function calculateLoanDetails(/* parameters */): CalculationResults {
  validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);
  const oneTimeFees = calculateOneTimeFees(principal, additionalCosts);
  // Rest of implementation
}

// After: Dependencies injected
export function calculateLoanDetails(
  /* parameters */,
  dependencies: {
    validateInputs?: typeof defaultValidateInputs;
    calculateOneTimeFees?: typeof defaultCalculateOneTimeFees;
    // Other dependencies
  } = {}
): CalculationResults {
  // Use provided dependencies or defaults
  const {
    validateInputs = defaultValidateInputs,
    calculateOneTimeFees = defaultCalculateOneTimeFees,
    // Other dependencies
  } = dependencies;
  
  validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);
  const oneTimeFees = calculateOneTimeFees(principal, additionalCosts);
  // Rest of implementation
}
```

## 6. Performance Optimizations

### Current Issues
- Some calculations might be repeated unnecessarily
- Large data structures might be inefficient for certain operations
- Potential for memory leaks with large loan terms

### Proposed Refactoring

#### 6.1 Implement Memoization for Expensive Calculations

```typescript
// Create a memoization utility
function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<string, R>();
  
  return (arg: T) => {
    const key = JSON.stringify(arg);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
}

// Apply memoization to expensive calculations
export const calculateMonthlyPaymentMemoized = memoize(
  (params: { principal: number; monthlyRate: number; totalMonths: number }) => {
    const { principal, monthlyRate, totalMonths } = params;
    return calculateMonthlyPayment(principal, monthlyRate, totalMonths);
  }
);
```

#### 6.2 Optimize Data Structures

```typescript
// Use more efficient data structures for rate periods
export class InterestRateSchedule {
  private rateMap: Map<number, number> = new Map();
  
  constructor(periods: InterestRatePeriod[]) {
    // Sort periods by startMonth
    const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);
    
    // Build rate map
    for (const period of sortedPeriods) {
      this.rateMap.set(period.startMonth, period.interestRate);
    }
  }
  
  getRateForMonth(month: number): number {
    // Find the most recent rate change
    let rate = 0;
    for (const [startMonth, interestRate] of this.rateMap.entries()) {
      if (month >= startMonth) {
        rate = interestRate;
      } else {
        break;
      }
    }
    return rate;
  }
}
```

## 7. Enhanced Modularity and Extensibility

### Current Issues
- Adding new repayment models or overpayment strategies requires modifying existing code
- Business rules are sometimes hardcoded
- Configuration options are limited

### Proposed Refactoring

#### 7.1 Implement Strategy Pattern for Repayment Models

```typescript
// Define strategy interface
interface RepaymentStrategy {
  calculatePayment(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    currentMonth: number
  ): {
    monthlyPayment: number;
    principalPayment: number;
    interestPayment: number;
  };
}

// Implement concrete strategies
class EqualInstallmentsStrategy implements RepaymentStrategy {
  calculatePayment(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    currentMonth: number
  ) {
    // Implementation for equal installments
  }
}

class DecreasingInstallmentsStrategy implements RepaymentStrategy {
  calculatePayment(
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    currentMonth: number
  ) {
    // Implementation for decreasing installments
  }
}

// Factory for creating strategies
class RepaymentStrategyFactory {
  static createStrategy(model: RepaymentModel): RepaymentStrategy {
    switch (model) {
      case 'equalInstallments':
        return new EqualInstallmentsStrategy();
      case 'decreasingInstallments':
        return new DecreasingInstallmentsStrategy();
      case 'custom':
        return new CustomRepaymentStrategy();
      default:
        throw new Error(`Unknown repayment model: ${model}`);
    }
  }
}

// Use in amortization schedule generation
export function generateAmortizationSchedule(
  principal: number,
  interestRatePeriods: InterestRatePeriod[],
  termYears: number,
  options: {
    repaymentModel?: RepaymentModel;
    // Other options
  } = {}
): PaymentData[] {
  const { repaymentModel = 'equalInstallments' } = options;
  const strategy = RepaymentStrategyFactory.createStrategy(repaymentModel);
  
  // Use strategy in calculation
  // ...
}
```

#### 7.2 Implement Plugin System for Extensions

```typescript
// Define plugin interface
interface MortgageCalculatorPlugin {
  name: string;
  initialize(): void;
  extendCalculationResults(results: CalculationResults): CalculationResults;
  // Other extension points
}

// Plugin registry
class PluginRegistry {
  private static plugins: MortgageCalculatorPlugin[] = [];
  
  static registerPlugin(plugin: MortgageCalculatorPlugin): void {
    this.plugins.push(plugin);
    plugin.initialize();
  }
  
  static applyPlugins(results: CalculationResults): CalculationResults {
    return this.plugins.reduce(
      (currentResults, plugin) => plugin.extendCalculationResults(currentResults),
      results
    );
  }
}

// Use in calculation engine
export function calculateLoanDetails(/* parameters */): CalculationResults {
  // Perform standard calculations
  const baseResults = /* ... */;
  
  // Apply plugins
  return PluginRegistry.applyPlugins(baseResults);
}
```

## 8. Implementation Plan

To implement these refactoring recommendations effectively, we suggest the following phased approach:

### Phase 1: Code Organization and Basic Refactoring
1. Break down large functions into smaller, focused ones
2. Implement improved error handling
3. Centralize validation logic
4. Add comprehensive documentation

### Phase 2: Enhanced Type Safety and Domain Modeling
1. Create more specific types and interfaces
2. Implement pure functions
3. Simplify function signatures
4. Add runtime type validation

### Phase 3: Advanced Patterns and Optimizations
1. Implement strategy pattern for repayment models
2. Add memoization for expensive calculations
3. Optimize data structures
4. Implement plugin system for extensions

Each phase should include comprehensive testing to ensure that the refactored code maintains the same functionality as the original implementation.

## 9. Conclusion

The proposed refactoring recommendations aim to improve the mortgage calculator engine's maintainability, extensibility, and performance while preserving its core functionality. By implementing these changes, the codebase will become more robust, easier to understand, and better equipped to handle future enhancements.

The most critical areas to address are:
1. Breaking down large functions into smaller, more focused ones
2. Implementing consistent error handling
3. Enhancing type safety and domain modeling
4. Improving separation of concerns

These changes will provide a solid foundation for future development and ensure that the mortgage calculator engine remains a valuable tool for users.