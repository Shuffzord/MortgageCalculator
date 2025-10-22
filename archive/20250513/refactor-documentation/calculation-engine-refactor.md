# Detailed Refactoring Plan for calculationEngine.ts

## Current State Analysis

The `calculationEngine.ts` file is the core calculation component of the mortgage calculator application. It handles critical functionality including:

1. Monthly payment calculations
2. Amortization schedule generation
3. Overpayment processing
4. Interest rate changes
5. Fee calculations
6. APR calculations

### Key Issues Identified

1. **Complex Parameter Lists**: Functions like `calculateLoanDetails` have many parameters, some optional, making the code harder to understand and maintain.

2. **Circular Dependencies**: There's a circular dependency with `mortgage-calculator.ts` that creates tight coupling.

3. **Mixed Responsibilities**: The engine handles both core calculations and some presentation-related logic.

4. **Inconsistent Error Handling**: Some functions return default values on error while others throw exceptions.

5. **Duplicate Calculation Logic**: Similar calculation logic appears in multiple places.

6. **Complex Overpayment Logic**: The overpayment handling is spread across multiple functions with complex conditional logic.

7. **Limited Modularity**: Functions are tightly coupled, making it difficult to test or modify individual parts.

## Refactoring Strategy

I recommend a phased approach to refactoring the calculation engine to minimize risk while improving the architecture:

### Phase 1: Introduce Parameter Objects and Improve Function Signatures

#### 1.1 Create Parameter Objects

```typescript
// New interfaces for parameter objects
export interface LoanCalculationParams {
  principal: number;
  interestRatePeriods: InterestRatePeriod[];
  loanTerm: number;
  repaymentModel?: RepaymentModel;
  additionalCosts?: AdditionalCosts;
  startDate?: Date;
  name?: string;
}

export interface OverpaymentParams {
  overpaymentPlans: OverpaymentDetails[];
}

export interface CalculationOptions {
  includeFeesInCalculation?: boolean;
  calculateAPR?: boolean;
}
```

#### 1.2 Refactor calculateLoanDetails Function

```typescript
export function calculateLoanDetails(
  params: LoanCalculationParams,
  overpaymentParams?: OverpaymentParams,
  options?: CalculationOptions
): CalculationResults {
  // Implementation using the new parameter objects
}
```

#### 1.3 Update Function Calls

All calls to `calculateLoanDetails` will need to be updated to use the new parameter objects. This can be done incrementally by providing a backward-compatible wrapper function.

### Phase 2: Break Circular Dependencies

#### 2.1 Extract Shared Logic to Common Module

Create a new module `calculationCore.ts` that contains the shared logic between `calculationEngine.ts` and `mortgage-calculator.ts`.

```typescript
// calculationCore.ts
export function calculateBaseMonthlyPayment(principal: number, monthlyRate: number, totalMonths: number): number {
  // Implementation
}

export function generateBaseAmortizationSchedule(params: AmortizationParams): PaymentData[] {
  // Implementation
}
```

#### 2.2 Refactor mortgage-calculator.ts

Update `mortgage-calculator.ts` to use the new core module instead of importing from `calculationEngine.ts`.

#### 2.3 Refactor calculationEngine.ts

Update `calculationEngine.ts` to use the new core module for shared functionality.

### Phase 3: Improve Error Handling and Validation

#### 3.1 Create Standardized Error Types

```typescript
export class CalculationError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'CalculationError';
  }
}

export class ValidationError extends CalculationError {
  constructor(message: string, public field: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
```

#### 3.2 Implement Consistent Error Handling

Update all functions to use the new error types and handle errors consistently.

```typescript
export function calculateLoanDetails(
  params: LoanCalculationParams,
  overpaymentParams?: OverpaymentParams,
  options?: CalculationOptions
): CalculationResults {
  try {
    validateLoanParams(params);
    if (overpaymentParams) validateOverpaymentParams(overpaymentParams);
    
    // Implementation
    
  } catch (error) {
    if (error instanceof CalculationError) {
      throw error;
    } else {
      throw new CalculationError(
        `Failed to calculate loan details: ${error.message}`,
        'CALCULATION_FAILED'
      );
    }
  }
}
```

#### 3.3 Enhance Input Validation

Create comprehensive validation functions for all input parameters.

```typescript
function validateLoanParams(params: LoanCalculationParams): void {
  if (params.principal <= 0) {
    throw new ValidationError('Principal must be greater than 0', 'principal');
  }
  
  if (!params.interestRatePeriods || params.interestRatePeriods.length === 0) {
    throw new ValidationError('Interest rate periods must not be empty', 'interestRatePeriods');
  }
  
  // Additional validation
}
```

### Phase 4: Refactor Overpayment Logic

#### 4.1 Create Dedicated Overpayment Module

Extract all overpayment-related logic to a dedicated module `overpaymentCalculator.ts`.

```typescript
// overpaymentCalculator.ts
export function applyOverpayment(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
  loanDetails: LoanDetails,
  effect: 'reduceTerm' | 'reducePayment'
): CalculationResults {
  // Implementation
}

export function applyMultipleOverpayments(
  schedule: PaymentData[],
  overpaymentPlans: OverpaymentDetails[],
  startDate?: Date,
  loanDetails?: LoanDetails
): PaymentData[] {
  // Implementation
}
```

#### 4.2 Simplify Overpayment Logic

Break down complex functions into smaller, more focused functions.

```typescript
function calculateReducedTermSchedule(
  balance: number,
  interestRatePeriods: InterestRatePeriod[],
  monthlyPayment: number,
  startPaymentNumber: number
): PaymentData[] {
  // Implementation
}

function calculateReducedPaymentSchedule(
  balance: number,
  interestRatePeriods: InterestRatePeriod[],
  remainingMonths: number,
  originalPayment: number,
  startPaymentNumber: number
): PaymentData[] {
  // Implementation
}
```

### Phase 5: Separate Calculation from Presentation Logic

#### 5.1 Extract Formatting Functions

Move all formatting-related functions to a dedicated module `formatters.ts`.

```typescript
// formatters.ts
export function formatAmortizationSchedule(
  schedule: PaymentData[],
  options: FormattingOptions
): FormattedPaymentData[] {
  // Implementation
}

export function formatSummary(
  results: CalculationResults,
  options: FormattingOptions
): FormattedSummary {
  // Implementation
}
```

#### 5.2 Update calculationEngine.ts

Remove formatting logic from the calculation engine and focus solely on calculations.

## Implementation Plan

### Step 1: Create Parameter Objects (1-2 days)

1. Define new interfaces for parameter objects
2. Create backward-compatible wrapper functions
3. Update unit tests to use new parameter objects
4. Verify all tests pass

### Step 2: Break Circular Dependencies (2-3 days)

1. Identify shared logic between calculationEngine.ts and mortgage-calculator.ts
2. Create calculationCore.ts module
3. Update both modules to use the core module
4. Verify all tests pass

### Step 3: Improve Error Handling (1-2 days)

1. Define standardized error types
2. Update functions to use consistent error handling
3. Enhance input validation
4. Add tests for error cases

### Step 4: Refactor Overpayment Logic (2-3 days)

1. Create overpaymentCalculator.ts module
2. Move overpayment logic to the new module
3. Simplify complex functions
4. Update tests for overpayment scenarios

### Step 5: Separate Calculation from Presentation (1-2 days)

1. Create formatters.ts module
2. Move formatting logic to the new module
3. Update calculationEngine.ts to focus on calculations
4. Verify all tests pass

## Testing Strategy

### Unit Tests

1. Create comprehensive tests for each refactored function
2. Test edge cases (zero interest, very short terms, etc.)
3. Test error handling and validation

### Integration Tests

1. Test the interaction between refactored modules
2. Verify results match the original implementation

### Regression Tests

1. Run existing test suite after each refactoring step
2. Compare results with known good values

## Risk Mitigation

1. **Incremental Approach**: Implement changes in small, testable increments
2. **Backward Compatibility**: Maintain backward compatibility during the transition
3. **Comprehensive Testing**: Test thoroughly after each change
4. **Feature Flags**: Use feature flags to enable/disable new implementations if needed

## Expected Benefits

1. **Improved Maintainability**: Clearer function signatures and better organization
2. **Enhanced Testability**: More modular code that's easier to test
3. **Better Error Handling**: Consistent error handling and validation
4. **Reduced Coupling**: Clearer separation of concerns and dependencies
5. **Easier Onboarding**: More intuitive code structure for new developers

## Dependency Analysis

### Current Dependencies

```
calculationEngine.ts
├── types.ts
├── validation.ts
├── utils.ts
└── mortgage-calculator.ts ← Circular dependency
    └── calculationEngine.ts
```

### Target Dependencies After Refactoring

```
calculationCore.ts
├── types.ts
└── validation.ts

calculationEngine.ts
├── calculationCore.ts
├── types.ts
├── validation.ts
└── overpaymentCalculator.ts

mortgage-calculator.ts
├── calculationCore.ts
└── types.ts

overpaymentCalculator.ts
├── calculationCore.ts
└── types.ts

formatters.ts
├── types.ts
└── utils.ts
```

## Critical Areas Requiring Special Attention

1. **Overpayment Calculation Logic**: This is complex and has been the source of bugs in the past. Extra care should be taken when refactoring this logic.

2. **APR Calculation**: The APR calculation is mathematically complex and should be carefully tested after refactoring.

3. **Backward Compatibility**: Ensure that all refactored functions maintain backward compatibility or provide clear migration paths.

4. **Performance**: The calculation engine is performance-critical. Benchmark before and after refactoring to ensure no performance regression.

## Conclusion

This refactoring plan addresses the key issues in the calculation engine while minimizing risk through an incremental approach. By breaking down the refactoring into phases, we can make steady progress while ensuring the system remains functional throughout the process.

The end result will be a more maintainable, testable, and robust calculation engine that will be easier to extend and modify in the future.