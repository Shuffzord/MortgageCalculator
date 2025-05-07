# Mortgage Calculator Implementation Plan

## Overview

This document provides a comprehensive technical plan for implementing missing features in the mortgage calculator application. Based on our analysis of requirements, current implementation, and failing tests, we've identified several gaps that need to be addressed to create a fully-featured mortgage calculator that meets all specified requirements.

## 1. Gap Analysis

### 1.1. Repayment Model Flexibility ✅

**Current State:**
- ~~The application currently implements only the equal installments (annuity) repayment model~~
- ~~No support for decreasing installments or custom repayment models~~
- ~~No ability to switch between repayment models during the loan term~~

**Required Implementation:**
- ✅ Add support for decreasing installments model
- ✅ Create a framework for custom repayment models
- ✅ Implement model switching logic

### 1.2. Additional Costs Handling ✅

**Current State:**
- ~~No implementation for loan origination fees~~
- ~~No support for loan insurance~~
- ~~No early repayment fee calculation~~
- ~~No administrative fee handling~~

**Required Implementation:**
- ✅ Add data structures for various fee types
- ✅ Implement fee calculation logic
- ✅ Integrate fees into total cost calculations
- ✅ Update UI to allow fee input

### 1.3. APR Calculation

**Current State:**
- No implementation for Annual Percentage Rate (APR) calculation
- No compliance with legal requirements for loan simulations

**Required Implementation:**
- Implement APR calculation algorithm
- Include all fees in APR calculation
- Display APR in loan summary

### 1.4. Comparative Analysis ✅

**Current State:**
- ~~Limited ability to compare scenarios~~
- ~~No visualization of differences between scenarios~~
- ~~No break-even point calculation~~

**Required Implementation:**
- ✅ Enhance scenario comparison engine
- ✅ Implement differential calculator
- ✅ Add break-even point computation
- ✅ Create comparative visualizations

### 1.5. Overpayment Optimization ✅

**Current State:**
- ~~Basic overpayment handling is implemented~~
- ~~No optimization algorithms for overpayment strategies~~
- ~~No analysis of different overpayment approaches~~

**Required Implementation:**
- ✅ Develop savings maximization algorithm
- ✅ Implement cost-benefit analyzer
- ✅ Create optimization value calculator
### 1.6. Data Export ✅

**Current State:**
- ~~No export functionality for schedules or reports~~
- ~~No ability to save calculations in portable formats~~

**Required Implementation:**
- ✅ Add export to CSV/Excel functionality
- ✅ Implement PDF report generation
- ✅ Create JSON export/import capability

### 1.7. Educational Components ✅

**Current State:**
- ~~Basic tooltips are implemented~~
- ~~No comprehensive explanations of loan concepts~~
- ~~No glossary of financial terms~~

**Required Implementation:**
- ✅ Enhance tooltips with more detailed information
- ✅ Add interactive examples showing parameter impacts
- ✅ Create a financial terms glossary

## 2. Implementation Priorities

Based on dependencies and importance, we recommend the following implementation order:

1. **Repayment Model Flexibility** - This is a core functionality that affects many other calculations
2. **Additional Costs Handling** - Required for accurate APR calculation
3. **APR Calculation** - Depends on additional costs implementation
4. **Overpayment Optimization** - Enhances existing overpayment functionality
5. **Comparative Analysis** - Builds on the above implementations
6. **Data Export** - Provides utility once core calculations are solid
7. **Educational Components** - Can be implemented incrementally alongside other features

## 3. Technical Implementation Plan

### 3.1. Repayment Model Flexibility

#### 3.1.1. Data Structure Updates

**File:** `client/src/lib/types.ts`

Add a new type for repayment model:

```typescript
export type RepaymentModel = 'equalInstallments' | 'decreasingInstallments' | 'custom';

export interface LoanDetails {
  // Existing properties
  principal: number;
  interestRatePeriods: InterestRatePeriod[];
  loanTerm: number;
  overpaymentPlans: OverpaymentDetails[];
  startDate: Date;
  name: string;
  currency?: string;
  dateCreated?: string;
  
  // New property
  repaymentModel: RepaymentModel;
  
  // For custom repayment models
#### 3.1.2. Calculation Engine Updates

**File:** `client/src/lib/calculationEngine.ts`

Implement decreasing installments calculation:

```typescript
/**
 * Calculate monthly payment for decreasing installments model
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
```

Modify the main calculation function to support different repayment models:

```typescript
export function generateAmortizationSchedule(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel: RepaymentModel = 'equalInstallments'
): PaymentData[] {
  // Existing code...
  
  // Modify to use different calculation methods based on repaymentModel
  let monthlyPayment: number;
  
  if (repaymentModel === 'equalInstallments') {
    monthlyPayment = calculateMonthlyPayment(principal, monthlyRate, totalMonths);
    // Existing equal installments logic...
  } 
  else if (repaymentModel === 'decreasingInstallments') {
    // For decreasing installments, the payment changes each month
    // so we calculate it inside the loop
    for (let i = 0; i < totalMonths && balance > 0.01; i++) {
      const payment = i + 1;
      monthlyPayment = calculateDecreasingInstallment(principal, monthlyRate, totalMonths, payment);
      
      // Rest of the calculation logic...
    }
  }
  else if (repaymentModel === 'custom') {
    // Custom repayment model logic
    // ...
  }
  
  // Return the schedule
}
```

#### 3.1.3. UI Updates

**File:** `client/src/components/LoanInputForm.tsx`

Add repayment model selection to the form:

```tsx
<FormField
  control={form.control}
  name="repaymentModel"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="flex items-center">
        {t('form.repaymentModel')}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{t('form.repaymentModelTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </FormLabel>
      <FormControl>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={field.value}
          onChange={field.onChange}
        >
          <option value="equalInstallments">{t('form.equalInstallments')}</option>
          <option value="decreasingInstallments">{t('form.decreasingInstallments')}</option>
          <option value="custom">{t('form.customRepayment')}</option>
        </select>
      </FormControl>
    </FormItem>
  )}
/>
```

#### 3.1.4. Testing

**File:** `client/src/lib/comprehensive-tests/repayment-models.test.ts` (new file)

Create tests for different repayment models:

```typescript
import { calculateLoanDetails } from '../calculationEngine';
import { LoanDetails } from '../types';

describe('Repayment Model Tests', () => {
  test('RM1: Decreasing Installments Model', async () => {
    // Inputs
    const principal = 200000;
    const termYears = 15;
    const interestRate = 3.5;
    
    const loanDetails: LoanDetails = {
      principal,
      interestRatePeriods: [{ startMonth: 1, interestRate }],
      loanTerm: termYears,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan',
      repaymentModel: 'decreasingInstallments'
    };
    
    // Calculate loan details
    const results = await calculateLoanDetails(
      loanDetails.principal,
      loanDetails.interestRatePeriods,
      loanDetails.loanTerm,
      undefined,
      loanDetails.repaymentModel
    );
    
    const schedule = results.amortizationSchedule;
    
    // 1) First payment should be higher than last payment
    expect(schedule[0].monthlyPayment).toBeGreaterThan(schedule[schedule.length - 1].monthlyPayment);
    
    // 2) Principal portion should be constant
    const principalPortion = principal / (termYears * 12);
### 3.2. Additional Costs Handling

#### 3.2.1. Data Structure Updates

**File:** `client/src/lib/types.ts`

Add types for additional costs:

```typescript
export interface AdditionalCosts {
  originationFee: number;           // One-time fee at loan start
  originationFeeType: 'fixed' | 'percentage';
  loanInsurance: number;            // Recurring fee
  loanInsuranceType: 'fixed' | 'percentage';
  earlyRepaymentFee: number;        // Applied to overpayments
  earlyRepaymentFeeType: 'fixed' | 'percentage';
  administrativeFees: number;       // Other recurring fees
  administrativeFeesType: 'fixed' | 'percentage';
}

export interface LoanDetails {
  // Existing properties...
  
  // New property
  additionalCosts: AdditionalCosts;
}
```

#### 3.2.2. Calculation Engine Updates

**File:** `client/src/lib/calculationEngine.ts`

Implement fee calculation functions:

```typescript
/**
 * Calculate one-time fees
 */
export function calculateOneTimeFees(
  principal: number,
  additionalCosts: AdditionalCosts
): number {
  let totalFees = 0;
  
  // Origination fee
  if (additionalCosts.originationFeeType === 'fixed') {
    totalFees += additionalCosts.originationFee;
  } else {
    totalFees += (principal * additionalCosts.originationFee / 100);
  }
  
  // Administrative fees (if one-time)
  if (additionalCosts.administrativeFeesType === 'fixed') {
    totalFees += additionalCosts.administrativeFees;
  } else {
    totalFees += (principal * additionalCosts.administrativeFees / 100);
  }
  
  return roundToCents(totalFees);
}

/**
 * Calculate recurring fees for a specific payment
 */
export function calculateRecurringFees(
  remainingBalance: number,
  additionalCosts: AdditionalCosts
): number {
  let monthlyFees = 0;
  
  // Loan insurance
  if (additionalCosts.loanInsuranceType === 'fixed') {
    monthlyFees += additionalCosts.loanInsurance;
  } else {
    monthlyFees += (remainingBalance * additionalCosts.loanInsurance / 100 / 12);
  }
  
  return roundToCents(monthlyFees);
}

/**
 * Calculate early repayment fee
 */
export function calculateEarlyRepaymentFee(
  overpaymentAmount: number,
  additionalCosts: AdditionalCosts
): number {
  if (additionalCosts.earlyRepaymentFeeType === 'fixed') {
    return additionalCosts.earlyRepaymentFee;
  } else {
    return roundToCents(overpaymentAmount * additionalCosts.earlyRepaymentFee / 100);
  }
}
```

Modify the main calculation function to include fees:

```typescript
export function calculateLoanDetails(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel: RepaymentModel = 'equalInstallments',
  additionalCosts?: AdditionalCosts
): CalculationResults {
  // Existing code...
  
  // Calculate one-time fees
  const oneTimeFees = additionalCosts ? calculateOneTimeFees(principal, additionalCosts) : 0;
  
  // Generate schedule with recurring fees
  let rawSchedule = generateAmortizationScheduleWithFees(
    principal,
    interestRatePeriods,
    loanTerm,
    overpaymentPlan,
    repaymentModel,
    additionalCosts
  );
  
  // Rest of the function...
  
  return {
    // Existing properties...
    oneTimeFees,
    totalCost: paymentData.length > 0 ? 
      paymentData[paymentData.length - 1].totalPayment + oneTimeFees : 
      oneTimeFees
  };
}
```

#### 3.2.3. UI Updates

**File:** `client/src/components/LoanInputForm.tsx`

Add additional costs section to the form:

```tsx
<FormField
  control={form.control}
  name="additionalCosts"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="flex items-center">
        {t('additionalCosts.title')}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{t('additionalCosts.tooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </FormLabel>
      <FormControl>
        <div className="space-y-4 p-3 border border-gray-200 rounded-md">
          {/* Origination Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel className="text-xs text-gray-500">{t('additionalCosts.originationFee')}</FormLabel>
              <div className="flex items-center">
                <Input
                  type="number"
                  min="0"
                  value={field.value?.originationFee || 0}
                  onChange={(e) => {
                    const newValue = { ...field.value, originationFee: Number(e.target.value) };
                    field.onChange(newValue);
                  }}
                  className="flex-1"
                />
                <select
                  className="ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={field.value?.originationFeeType || 'fixed'}
                  onChange={(e) => {
                    const newValue = { ...field.value, originationFeeType: e.target.value as 'fixed' | 'percentage' };
                    field.onChange(newValue);
                  }}
                >
                  <option value="fixed">{getCurrencySymbol(selectedCurrency)}</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>
            
            {/* Similar inputs for other fee types */}
            {/* ... */}
          </div>
        </div>
      </FormControl>
    </FormItem>
  )}
/>
```

#### 3.2.4. Testing
### 3.3. APR Calculation

#### 3.3.1. Calculation Engine Updates

**File:** `client/src/lib/calculationEngine.ts`

Implement APR calculation:

```typescript
/**
 * Calculate Annual Percentage Rate (APR)
 * Uses iterative approach to find the rate that makes the present value
 * of all cash flows equal to the initial loan amount
 */
export function calculateAPR(
  principal: number,
  monthlyPayment: number,
  loanTermMonths: number,
  oneTimeFees: number,
  recurringFees: number[]
): number {
  // Initial guess: use nominal interest rate
  let guess = 0.05; // 5%
  let step = 0.01;
  let tolerance = 0.0001;
  let maxIterations = 100;
  
  // Newton-Raphson method to find APR
  for (let i = 0; i < maxIterations; i++) {
    // Calculate present value with current guess
    let pv = -principal + oneTimeFees;
    
    for (let month = 0; month < loanTermMonths; month++) {
      const payment = monthlyPayment + (recurringFees[month] || 0);
      pv += payment / Math.pow(1 + guess / 12, month + 1);
    }
    
    // If present value is close enough to zero, we found the APR
    if (Math.abs(pv) < tolerance) {
      break;
    }
    
    // Calculate derivative of present value function
    let pvPrime = 0;
    for (let month = 0; month < loanTermMonths; month++) {
      const payment = monthlyPayment + (recurringFees[month] || 0);
      pvPrime -= payment * (month + 1) / 12 * Math.pow(1 + guess / 12, -month - 2);
    }
    
    // Update guess using Newton-Raphson formula
    const newGuess = guess - pv / pvPrime;
    
    // If new guess is not significantly different, we're done
    if (Math.abs(newGuess - guess) < tolerance) {
      guess = newGuess;
      break;
    }
    
    guess = newGuess;
  }
  
  // Convert to percentage
  return guess * 100;
}
```

Update the main calculation function to include APR:

```typescript
export function calculateLoanDetails(
  // Existing parameters...
): CalculationResults {
  // Existing code...
  
  // Extract recurring fees for APR calculation
  const recurringFees = paymentData.map(p => p.fees || 0);
  
  // Calculate APR
  const apr = calculateAPR(
    principal,
    paymentData[0]?.monthlyPayment || 0,
    paymentData.length,
    oneTimeFees,
    recurringFees
  );
  
  return {
    // Existing properties...
    oneTimeFees,
    totalCost: paymentData.length > 0 ? 
      paymentData[paymentData.length - 1].totalPayment + oneTimeFees : 
      oneTimeFees,
    apr: roundToCents(apr)
  };
}
```

#### 3.3.2. UI Updates

**File:** `client/src/components/LoanSummary.tsx`

Add APR to the loan summary:

```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Existing summary items */}
  
  {/* APR */}
  <div>
    <h3 className="text-sm font-medium text-gray-500">{t('summary.apr')}</h3>
    <p className="mt-1 text-lg font-semibold text-gray-900">
      {results.apr ? `${results.apr.toFixed(2)}%` : '-'}
    </p>
    <p className="mt-1 text-xs text-gray-500">{t('summary.aprDescription')}</p>
  </div>
</div>
```

#### 3.3.3. Testing

**File:** `client/src/lib/comprehensive-tests/apr.test.ts` (new file)

Create tests for APR calculation:

```typescript
import { calculateAPR, calculateLoanDetails } from '../calculationEngine';
import { AdditionalCosts, LoanDetails } from '../types';

describe('APR Calculation Tests', () => {
  test('APR1: Basic APR Calculation', async () => {
    // Inputs
    const principal = 200000;
    const monthlyPayment = 1430.06;
    const loanTermMonths = 180; // 15 years
    const oneTimeFees = 2000;
    const recurringFees = Array(loanTermMonths).fill(0);
    
    // Expected APR should be higher than nominal rate due to fees
    const nominalRate = 3.5;
    
    // Calculate APR
    const apr = calculateAPR(principal, monthlyPayment, loanTermMonths, oneTimeFees, recurringFees);
    
    // Verify APR is higher than nominal rate
    expect(apr).toBeGreaterThan(nominalRate);
    
    // Verify APR is within reasonable range
    expect(apr).toBeLessThan(nominalRate + 1); // Should be less than 1% higher
  });
  
  // Additional tests...
});
```

### 3.4. Overpayment Optimization

#### 3.4.1. Data Structure Updates

**File:** `client/src/lib/types.ts`

Add types for optimization:

```typescript
export interface OptimizationResult {
  optimizedOverpayments: OverpaymentDetails[];
#### 3.4.2. Calculation Engine Updates

**File:** `client/src/lib/optimizationEngine.ts` (new file)

Implement optimization algorithms:

```typescript
import { 
  LoanDetails, 
  OverpaymentDetails, 
  OptimizationResult, 
  OptimizationParameters,
  CalculationResults
} from './types';
import { calculateLoanDetails, roundToCents } from './calculationEngine';

/**
 * Optimize overpayment strategy to maximize interest savings
 */
export function optimizeOverpayments(
  loanDetails: LoanDetails,
  optimizationParams: OptimizationParameters
): OptimizationResult {
  // Get baseline calculation without overpayments
  const baselineDetails = { ...loanDetails, overpaymentPlans: [] };
  const baselineResults = calculateLoanDetails(
    baselineDetails.principal,
    baselineDetails.interestRatePeriods,
    baselineDetails.loanTerm
  );
  
  // Strategy: Front-load overpayments to maximize interest savings
  const optimizedOverpayments: OverpaymentDetails[] = [];
  
  if (optimizationParams.optimizationStrategy === 'maximizeInterestSavings' || 
      optimizationParams.optimizationStrategy === 'balanced') {
    // Add one-time overpayment at the beginning
    if (optimizationParams.maxOneTimeOverpayment > 0) {
      optimizedOverpayments.push({
        amount: optimizationParams.maxOneTimeOverpayment,
        startMonth: 1,
        isRecurring: false,
        frequency: 'one-time',
        effect: 'reduceTerm'
      });
    }
    
    // Add monthly overpayments
    if (optimizationParams.maxMonthlyOverpayment > 0) {
      optimizedOverpayments.push({
        amount: optimizationParams.maxMonthlyOverpayment,
        startMonth: 1,
        isRecurring: true,
        frequency: 'monthly',
        effect: 'reduceTerm'
      });
    }
  } 
  else if (optimizationParams.optimizationStrategy === 'minimizeTime') {
    // Similar strategy but focus on term reduction
    // ...
  }
  
  // Calculate results with optimized overpayments
  const optimizedDetails = { ...loanDetails, overpaymentPlans: optimizedOverpayments };
  const optimizedResults = calculateLoanDetails(
    optimizedDetails.principal,
    optimizedDetails.interestRatePeriods,
    optimizedDetails.loanTerm,
    optimizedOverpayments[0] // For backward compatibility
  );
  
  // Calculate savings
  const interestSaved = baselineResults.totalInterest - optimizedResults.totalInterest;
  const timeOrPaymentSaved = baselineResults.actualTerm - optimizedResults.actualTerm;
  
  // Calculate optimization value and fee
  const optimizationValue = interestSaved;
  const optimizationFee = roundToCents(optimizationValue * optimizationParams.feePercentage / 100);
  
  return {
    optimizedOverpayments,
    interestSaved,
    timeOrPaymentSaved,
    optimizationValue,
    optimizationFee
  };
}
```

#### 3.4.3. UI Updates

**File:** `client/src/components/OptimizationPanel.tsx` (new file)

Create a new component for optimization:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { optimizeOverpayments } from '@/lib/optimizationEngine';
import { LoanDetails, OptimizationParameters, OptimizationResult } from '@/lib/types';
import { useTranslation } from 'react-i18next';

interface OptimizationPanelProps {
  loanDetails: LoanDetails;
  onApplyOptimization: (result: OptimizationResult) => void;
}

export default function OptimizationPanel({
  loanDetails,
  onApplyOptimization
}: OptimizationPanelProps) {
  const { t } = useTranslation();
  const [params, setParams] = useState<OptimizationParameters>({
    maxMonthlyOverpayment: 200,
    maxOneTimeOverpayment: 10000,
    optimizationStrategy: 'maximizeInterestSavings',
    feePercentage: 5
  });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  
  const handleOptimize = () => {
    const optimizationResult = optimizeOverpayments(loanDetails, params);
    setResult(optimizationResult);
  };
  
  const handleApply = () => {
    if (result) {
      onApplyOptimization(result);
    }
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <h2 className="text-lg font-semibold mb-4">{t('optimization.title')}</h2>
      
      <div className="space-y-4">
        {/* Input fields for optimization parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Max monthly overpayment */}
          {/* Max one-time overpayment */}
          {/* Strategy selection */}
          {/* ... */}
        </div>
        
        <Button onClick={handleOptimize} className="w-full">
          {t('optimization.calculate')}
        </Button>
        
        {result && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium">{t('optimization.results')}</h3>
            
            <div className="mt-2 space-y-2">
              <p>
                <span className="text-gray-500">{t('optimization.interestSaved')}:</span>
                <span className="ml-2 font-semibold">{result.interestSaved.toFixed(2)}</span>
              </p>
              <p>
                <span className="text-gray-500">{t('optimization.timeSaved')}:</span>
                <span className="ml-2 font-semibold">{result.timeOrPaymentSaved.toFixed(2)} {t('form.years')}</span>
              </p>
              <p>
                <span className="text-gray-500">{t('optimization.fee')}:</span>
                <span className="ml-2 font-semibold">{result.optimizationFee.toFixed(2)}</span>
              </p>
            </div>
            
            <Button onClick={handleApply} className="mt-4 w-full">
              {t('optimization.apply')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 3.4.4. Testing

**File:** `client/src/lib/comprehensive-tests/optimization.test.ts` (new file)

Create tests for optimization:

```typescript
import { optimizeOverpayments } from '../optimizationEngine';
import { LoanDetails, OptimizationParameters } from '../types';

describe('Overpayment Optimization Tests', () => {
  test('OPT1: Interest Savings Optimization', async () => {
    // Inputs
    const loanDetails: LoanDetails = {
      principal: 300000,
      interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
      loanTerm: 30,
      overpaymentPlans: [],
      startDate: new Date(),
      name: 'Test Loan'
    };
    
    const optimizationParams: OptimizationParameters = {
      maxMonthlyOverpayment: 200,
      maxOneTimeOverpayment: 10000,
      optimizationStrategy: 'maximizeInterestSavings',
      feePercentage: 5
    };
    
    // Run optimization
    const result = optimizeOverpayments(loanDetails, optimizationParams);
    
    // Verify results
    expect(result.optimizedOverpayments.length).toBeGreaterThan(0);
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.timeOrPaymentSaved).toBeGreaterThan(0);
    expect(result.optimizationFee).toBeGreaterThan(0);
    
    // Verify fee calculation
    expect(result.optimizationFee).toBeCloseTo(result.interestSaved * 0.05, 0);
  });
});
```

### 3.5. Comparative Analysis

#### 3.5.1. Data Structure Updates

**File:** `client/src/lib/types.ts`

Add types for scenario comparison:

```typescript
export interface ScenarioComparison {
  scenarios: {
    id: string;
    name: string;
    loanDetails: LoanDetails;
    results: CalculationResults;
  }[];
  differences: {
    totalInterestDiff: number;
    monthlyPaymentDiff: number;
    termDiff: number;
    totalCostDiff: number;
  }[];
  breakEvenPoint?: number; // Month number where scenarios break even
}
```

#### 3.5.2. Calculation Engine Updates

**File:** `client/src/lib/comparisonEngine.ts` (new file)

Implement comparison functions:

```typescript
import { LoanDetails, CalculationResults, ScenarioComparison } from './types';
import { calculateLoanDetails, roundToCents } from './calculationEngine';

/**
 * Compare multiple loan scenarios
 */
export function compareScenarios(
  scenarios: Array<{ id: string; name: string; loanDetails: LoanDetails }>
): ScenarioComparison {
  // Calculate results for each scenario
  const scenariosWithResults = scenarios.map(scenario => ({
    ...scenario,
    results: calculateLoanDetails(
      scenario.loanDetails.principal,
      scenario.loanDetails.interestRatePeriods,
      scenario.loanDetails.loanTerm,
      scenario.loanDetails.overpaymentPlans[0],
      scenario.loanDetails.repaymentModel,
      scenario.loanDetails.additionalCosts
    )
  }));
  
  // Calculate differences between scenarios
  const differences = [];
  
  for (let i = 1; i < scenariosWithResults.length; i++) {
    const base = scenariosWithResults[0];
    const current = scenariosWithResults[i];
    
    differences.push({
      totalInterestDiff: roundToCents(base.results.totalInterest - current.results.totalInterest),
      monthlyPaymentDiff: roundToCents(base.results.monthlyPayment - current.results.monthlyPayment),
      termDiff: base.results.actualTerm - current.results.actualTerm,
      totalCostDiff: roundToCents(
        (base.results.totalInterest + (base.results.oneTimeFees || 0)) - 
        (current.results.totalInterest + (current.results.oneTimeFees || 0))
      )
    });
  }
  
  // Calculate break-even point if applicable
  let breakEvenPoint;
  
### 3.6. Data Export

#### 3.6.1. Data Structure Updates

**File:** `client/src/lib/types.ts`

Add types for export options:

```typescript
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeAmortizationSchedule: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
}
```

#### 3.6.2. Export Engine Implementation

**File:** `client/src/lib/exportEngine.ts` (new file)

Implement export functionality:

```typescript
import { LoanDetails, CalculationResults, ExportOptions } from './types';
import { formatCurrency } from './calculationEngine';

/**
 * Export loan data to CSV format
 */
export function exportToCSV(
  loanDetails: LoanDetails,
  results: CalculationResults,
  options: ExportOptions
): string {
  let csv = '';
  
  // Add summary
  if (options.includeSummary) {
    csv += 'Loan Summary\n';
    csv += `Principal,${loanDetails.principal}\n`;
    csv += `Interest Rate,${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    csv += `Loan Term,${loanDetails.loanTerm} years\n`;
    csv += `Monthly Payment,${results.monthlyPayment}\n`;
    csv += `Total Interest,${results.totalInterest}\n`;
    csv += `Total Cost,${loanDetails.principal + results.totalInterest}\n`;
    csv += '\n';
  }
  
  // Add amortization schedule
  if (options.includeAmortizationSchedule) {
    csv += 'Amortization Schedule\n';
    csv += 'Payment,Date,Payment Amount,Principal,Interest,Balance,Total Interest\n';
    
    results.amortizationSchedule.forEach(payment => {
      const date = payment.paymentDate ? 
        payment.paymentDate.toISOString().split('T')[0] : 
        '';
      
      csv += `${payment.payment},${date},${payment.monthlyPayment},${payment.principalPayment},${payment.interestPayment},${payment.balance},${payment.totalInterest}\n`;
    });
  }
  
  return csv;
}

/**
 * Export loan data to JSON format
 */
export function exportToJSON(
  loanDetails: LoanDetails,
  results: CalculationResults,
  options: ExportOptions
): string {
  const exportData: any = {
    loanDetails: { ...loanDetails },
    summary: {
      monthlyPayment: results.monthlyPayment,
      totalInterest: results.totalInterest,
      totalCost: loanDetails.principal + results.totalInterest,
      originalTerm: results.originalTerm,
      actualTerm: results.actualTerm
    }
  };
  
  if (options.includeAmortizationSchedule) {
    exportData.amortizationSchedule = results.amortizationSchedule;
  }
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate PDF export (using a PDF library)
 */
export async function exportToPDF(
  loanDetails: LoanDetails,
  results: CalculationResults,
  options: ExportOptions
): Promise<Blob> {
  // This would use a PDF generation library like jsPDF
  // Implementation would depend on the chosen library
  
  // Example pseudocode:
  // const doc = new jsPDF();
  // doc.text('Loan Summary', 10, 10);
  // doc.text(`Principal: ${formatCurrency(loanDetails.principal)}`, 10, 20);
  // ...
  // return doc.output('blob');
  
  // For now, return a placeholder
  return new Blob(['PDF generation not implemented'], { type: 'application/pdf' });
}
```

#### 3.6.3. UI Updates

**File:** `client/src/components/ExportPanel.tsx` (new file)

Create a new component for data export:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToCSV, exportToJSON, exportToPDF } from '@/lib/exportEngine';
import { LoanDetails, CalculationResults, ExportOptions, ExportFormat } from '@/lib/types';
import { useTranslation } from 'react-i18next';

interface ExportPanelProps {
  loanDetails: LoanDetails;
  results: CalculationResults;
}

export default function ExportPanel({
  loanDetails,
  results
}: ExportPanelProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeAmortizationSchedule: true,
    includeCharts: false,
    includeSummary: true
  });
  
  const handleExport = async () => {
    let content: string | Blob;
    let filename: string;
    let mimeType: string;
    
    // Generate export content based on format
    switch (options.format) {
      case 'csv':
        content = exportToCSV(loanDetails, results, options);
        filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'json':
        content = exportToJSON(loanDetails, results, options);
        filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
        
      case 'pdf':
        content = await exportToPDF(loanDetails, results, options);
        filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.pdf`;
        mimeType = 'application/pdf';
        break;
        
      default:
        return;
    }
    
    // Create download link
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <h2 className="text-lg font-semibold mb-4">{t('export.title')}</h2>
      
      <div className="space-y-4">
        {/* Format selection */}
        <div>
          <h3 className="text-sm font-medium mb-2">{t('export.format')}</h3>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={options.format === 'csv'}
                onChange={() => setOptions({ ...options, format: 'csv' })}
                className="mr-2"
              />
              CSV
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="json"
                checked={options.format === 'json'}
                onChange={() => setOptions({ ...options, format: 'json' })}
                className="mr-2"
              />
              JSON
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={options.format === 'pdf'}
                onChange={() => setOptions({ ...options, format: 'pdf' })}
                className="mr-2"
              />
              PDF
            </label>
          </div>
        </div>
        
        {/* Content options */}
        <div>
          <h3 className="text-sm font-medium mb-2">{t('export.includeContent')}</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <Checkbox
                checked={options.includeSummary}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includeSummary: checked as boolean })
                }
                className="mr-2"
              />
              {t('export.includeSummary')}
            </label>
            <label className="flex items-center">
              <Checkbox
                checked={options.includeAmortizationSchedule}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includeAmortizationSchedule: checked as boolean })
                }
                className="mr-2"
              />
              {t('export.includeAmortizationSchedule')}
            </label>
            <label className="flex items-center">
              <Checkbox
                checked={options.includeCharts}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, includeCharts: checked as boolean })
                }
                className="mr-2"
              />
              {t('export.includeCharts')}
            </label>
          </div>
        </div>
        
        <Button onClick={handleExport} className="w-full">
          {t('export.download')}
        </Button>
      </div>
    </div>
  );
}
```

### 3.7. Educational Components

#### 3.7.1. Data Structure

**File:** `client/src/lib/educationalContent.ts` (new file)

Create educational content:

```typescript
export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface ConceptExplanation {
  concept: string;
  explanation: string;
  impact: string;
  example?: string;
}

export const financialGlossary: Record<string, GlossaryTerm> = {
  'principal': {
    term: 'Principal',
    definition: 'The original amount of money borrowed in a loan.',
    example: 'If you take out a $200,000 mortgage, the principal is $200,000.'
  },
  'interest': {
    term: 'Interest',
    definition: 'The cost of borrowing money, usually expressed as a percentage of the loan amount.',
    example: 'A 4% interest rate on a $200,000 loan means you pay approximately $8,000 in interest during the first year.'
  },
  'apr': {
    term: 'Annual Percentage Rate (APR)',
    definition: 'The yearly cost of a loan including interest and fees, expressed as a percentage.',
    example: 'While your interest rate might be 4%, your APR could be 4.25% when including loan fees.'
  },
  // Additional terms...
};

export const mortgageConcepts: Record<string, ConceptExplanation> = {
  'repaymentModels': {
    concept: 'Repayment Models',
    explanation: 'Different methods of structuring loan payments over time.',
    impact: 'The repayment model affects how much of each payment goes toward principal versus interest, and how the total payment amount changes over time.',
    example: 'Equal installments keep your payment the same throughout the loan, while decreasing installments start higher but decrease over time.'
  },
  'overpayments': {
    concept: 'Overpayments',
    explanation: 'Additional payments made beyond the required monthly payment.',
    impact: 'Overpayments reduce the principal faster, saving interest and potentially shortening the loan term.',
    example: 'Paying an extra $200 per month on a 30-year mortgage could shorten the term by several years and save thousands in interest.'
  },
  // Additional concepts...
};
```

#### 3.7.2. UI Updates

**File:** `client/src/components/EducationalPanel.tsx` (new file)

Create a new component for educational content:

```tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { financialGlossary, mortgageConcepts } from '@/lib/educationalContent';
import { useTranslation } from 'react-i18next';

export default function EducationalPanel() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter glossary terms based on search
  const filteredGlossary = Object.values(financialGlossary).filter(term => 
    term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    term.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter concepts based on search
  const filteredConcepts = Object.values(mortgageConcepts).filter(concept => 
    concept.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    concept.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <h2 className="text-lg font-semibold mb-4">{t('education.title')}</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('education.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <Tabs defaultValue="glossary">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="glossary" className="flex-1">{t('education.glossary')}</TabsTrigger>
          <TabsTrigger value="concepts" className="flex-1">{t('education.concepts')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="glossary" className="space-y-4">
          {filteredGlossary.length === 0 ? (
            <p className="text-gray-500">{t('education.noResults')}</p>
          ) : (
            filteredGlossary.map(term => (
              <div key={term.term} className="p-3 border border-gray-200 rounded-md">
                <h3 className="font-medium">{term.term}</h3>
                <p className="mt-1 text-sm text-gray-600">{term.definition}</p>
                {term.example && (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">{t('education.example')}:</span> {term.example}
                  </p>
                )}
              </div>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="concepts" className="space-y-4">
          {filteredConcepts.length === 0 ? (
            <p className="text-gray-500">{t('education.noResults')}</p>
          ) : (
            filteredConcepts.map(concept => (
              <div key={concept.concept} className="p-3 border border-gray-200 rounded-md">
                <h3 className="font-medium">{concept.concept}</h3>
                <p className="mt-1 text-sm text-gray-600">{concept.explanation}</p>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{t('education.impact')}:</span> {concept.impact}
                </p>
                {concept.example && (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">{t('education.example')}:</span> {concept.example}
                  </p>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 4. Testing Strategy

### 4.1. Unit Tests

For each new feature, comprehensive unit tests should be created to verify the correctness of calculations and behavior:

1. **Repayment Models Tests**
   - Test equal installments model
   - Test decreasing installments model
   - Test custom repayment models
   - Test model switching during loan term

2. **Additional Costs Tests**
   - Test one-time fee calculations
   - Test recurring fee calculations
   - Test early repayment fee calculations
   - Test fee impact on total cost

3. **APR Calculation Tests**
   - Test APR calculation with various fee structures
   - Test APR calculation with different loan terms
   - Test APR calculation with rate changes
   - Verify APR is always higher than nominal rate when fees are present

4. **Overpayment Optimization Tests**
   - Test interest savings optimization
   - Test term reduction optimization
   - Test balanced optimization strategy
   - Verify optimization fee calculation

5. **Comparative Analysis Tests**
   - Test scenario comparison calculations
   - Test break-even point calculation
   - Test difference calculations between scenarios

6. **Data Export Tests**
   - Test CSV export format
   - Test JSON export format
   - Test PDF export format
   - Verify exported data accuracy

### 4.2. Integration Tests

Integration tests should verify that components work together correctly:

1. **UI and Calculation Integration**
   - Test that UI inputs correctly affect calculation results
   - Test that changes to repayment model update the amortization schedule
   - Test that adding fees updates APR and total cost

2. **Feature Integration**
   - Test that optimization results can be applied to loan details
   - Test that comparison works with different loan configurations
   - Test that export includes all selected components

### 4.3. End-to-End Tests

End-to-end tests should verify complete user workflows:

1. **Complete Loan Calculation Workflow**
   - Configure loan details with various parameters
   - Add overpayments and verify impact
   - Export results in different formats

2. **Optimization and Comparison Workflow**
   - Create multiple loan scenarios
   - Run optimization on scenarios
   - Compare scenarios and verify results

## 5. Conclusion

This implementation plan addresses all the identified gaps in the mortgage calculator application. By following this plan, the development team can systematically implement the missing features to create a comprehensive mortgage calculator that meets all the specified requirements.

The plan prioritizes core calculation functionality first (repayment models, additional costs, APR), followed by advanced features (optimization, comparison), and finally utility features (export, educational content). This approach ensures that the most critical functionality is implemented first, with each subsequent feature building on a solid foundation.

The implementation includes detailed data structure updates, calculation engine enhancements, UI components, and comprehensive testing strategies. By following this plan, the development team can deliver a high-quality mortgage calculator application that provides significant value to users.
  if (scenariosWithResults.length >= 2) {
    breakEvenPoint = calculateBreakEvenPoint(
      scenariosWithResults[0].results.amortizationSchedule,
      scenariosWithResults[1].results.amortizationSchedule
    );
  }
  
  return {
    scenarios: scenariosWithResults,
    differences,
    breakEvenPoint
  };
}

/**
 * Calculate the break-even point between two payment schedules
 */
function calculateBreakEvenPoint(
  schedule1: any[],
  schedule2: any[]
): number | undefined {
  // Find the point where cumulative payments of schedule1 exceed schedule2
  let cumulative1 = 0;
  let cumulative2 = 0;
  
  for (let i = 0; i < Math.min(schedule1.length, schedule2.length); i++) {
    cumulative1 += schedule1[i].monthlyPayment;
    cumulative2 += schedule2[i].monthlyPayment;
    
    if (cumulative1 <= cumulative2) {
      return i + 1;
    }
  }
  
  return undefined; // No break-even point found
}
```

#### 3.5.3. UI Updates

**File:** `client/src/components/ScenarioComparison.tsx` (new file)

Create a new component for scenario comparison:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { compareScenarios } from '@/lib/comparisonEngine';
import { LoanDetails, ScenarioComparison } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/calculationEngine';

interface ScenarioComparisonProps {
  savedScenarios: Array<{ id: string; name: string; loanDetails: LoanDetails }>;
}

export default function ScenarioComparisonComponent({
  savedScenarios
}: ScenarioComparisonProps) {
  const { t } = useTranslation();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  
  const handleCompare = () => {
    if (selectedScenarios.length < 2) return;
    
    const scenariosToCompare = savedScenarios.filter(s => 
      selectedScenarios.includes(s.id)
    );
    
    const result = compareScenarios(scenariosToCompare);
    setComparison(result);
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <h2 className="text-lg font-semibold mb-4">{t('comparison.title')}</h2>
      
      <div className="space-y-4">
        {/* Scenario selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('comparison.selectScenarios')}</h3>
          
          {savedScenarios.map(scenario => (
            <div key={scenario.id} className="flex items-center">
              <input
                type="checkbox"
                id={`scenario-${scenario.id}`}
                checked={selectedScenarios.includes(scenario.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedScenarios([...selectedScenarios, scenario.id]);
                  } else {
                    setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                  }
                }}
                className="mr-2"
              />
              <label htmlFor={`scenario-${scenario.id}`}>{scenario.name}</label>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={handleCompare} 
          disabled={selectedScenarios.length < 2}
          className="w-full"
        >
          {t('comparison.compare')}
        </Button>
        
        {comparison && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">{t('comparison.results')}</h3>
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">{t('comparison.scenario')}</th>
                  <th className="p-2 text-right">{t('comparison.monthlyPayment')}</th>
                  <th className="p-2 text-right">{t('comparison.totalInterest')}</th>
                  <th className="p-2 text-right">{t('comparison.term')}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.scenarios.map(scenario => (
                  <tr key={scenario.id} className="border-b">
                    <td className="p-2">{scenario.name}</td>
                    <td className="p-2 text-right">{formatCurrency(scenario.results.monthlyPayment)}</td>
                    <td className="p-2 text-right">{formatCurrency(scenario.results.totalInterest)}</td>
                    <td className="p-2 text-right">{scenario.results.actualTerm.toFixed(2)} {t('form.years')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {comparison.breakEvenPoint && (
              <p className="mt-4">
                <span className="font-medium">{t('comparison.breakEvenPoint')}:</span>
                <span className="ml-2">
                  {t('comparison.month')} {comparison.breakEvenPoint}
                  ({Math.floor(comparison.breakEvenPoint / 12)} {t('form.years')}, {comparison.breakEvenPoint % 12} {t('comparison.months')})
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```
  interestSaved: number;
  timeOrPaymentSaved: number;
  optimizationValue: number;
  optimizationFee: number;
}

export interface OptimizationParameters {
  maxMonthlyOverpayment: number;
  maxOneTimeOverpayment: number;
  optimizationStrategy: 'maximizeInterestSavings' | 'minimizeTime' | 'balanced';
  feePercentage: number;
}
```

**File:** `client/src/lib/comprehensive-tests/additional-costs.test.ts` (new file)

Create tests for additional costs:

```typescript
import { calculateLoanDetails, calculateOneTimeFees } from '../calculationEngine';
import { AdditionalCosts, LoanDetails } from '../types';

describe('Additional Costs Tests', () => {
  test('AC1: One-Time Fees Calculation', async () => {
    // Inputs
    const principal = 200000;
    
    const additionalCosts: AdditionalCosts = {
      originationFee: 1000,
      originationFeeType: 'fixed',
      loanInsurance: 0.5,
      loanInsuranceType: 'percentage',
      earlyRepaymentFee: 2,
      earlyRepaymentFeeType: 'percentage',
      administrativeFees: 200,
      administrativeFeesType: 'fixed'
    };
    
    // Expected values
    const expectedOneTimeFees = 1200; // 1000 + 200
    
    // Calculate fees
    const oneTimeFees = calculateOneTimeFees(principal, additionalCosts);
    
    // Verify calculation
    expect(oneTimeFees).toBe(expectedOneTimeFees);
  });
  
  // Additional tests...
});
```
    schedule.forEach(payment => {
      expect(payment.principalPayment).toBeCloseTo(principalPortion, 0);
    });
    
    // 3) Final balance is zero
    expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0);
    
    // 4) Sum of principal payments equals original principal
    const principalSum = schedule.reduce((sum, p) => sum + p.principalPayment, 0);
    expect(principalSum).toBeCloseTo(principal, 0);
  });
});
```
  customPaymentSchedule?: number[];
}
```
- Add percentage-based fee computation