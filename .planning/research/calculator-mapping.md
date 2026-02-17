# Calculator API to WebMCP Tool Mapping Research

**Date:** 2026-02-17
**Purpose:** Map existing mortgage calculator functions to WebMCP tool interface

---

## 1. Summary of Existing Calculator API

### 1.1 Core Types (from `client/src/lib/types.ts`)

#### Input Types

**LoanDetails** - Primary input for full calculations:
```typescript
interface LoanDetails {
  principal: number;                        // Loan amount
  interestRatePeriods: InterestRatePeriod[]; // Rate periods (supports variable rates)
  loanTerm: number;                         // Term in YEARS
  overpaymentPlans: OverpaymentDetails[];   // Optional overpayments
  startDate: Date;                          // Loan start date
  name: string;                             // Loan name/identifier
  currency?: string;                        // Currency code (default: USD)
  repaymentModel?: RepaymentModel;          // 'equalInstallments' | 'decreasingInstallments' | 'custom'
  additionalCosts?: AdditionalCosts;        // Fees and insurance
}

interface InterestRatePeriod {
  startMonth: number;   // Month when this rate starts (1-based)
  interestRate: number; // Annual interest rate as percentage (e.g., 5.5 for 5.5%)
}

interface OverpaymentDetails {
  amount: number;
  startDate: Date;
  endDate?: Date;
  isRecurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  effect?: 'reduceTerm' | 'reducePayment';
}

interface AdditionalCosts {
  originationFee: number;
  originationFeeType: 'fixed' | 'percentage';
  loanInsurance: number;
  loanInsuranceType: 'fixed' | 'percentage';
  administrativeFees: number;
  administrativeFeesType: 'fixed' | 'percentage';
}

type RepaymentModel = 'equalInstallments' | 'decreasingInstallments' | 'custom';
```

#### Output Types

**CalculationResults** - Primary output:
```typescript
interface CalculationResults {
  monthlyPayment: number;           // First monthly payment amount
  totalInterest: number;            // Total interest over loan life
  amortizationSchedule: PaymentData[]; // Full payment breakdown
  yearlyData: YearlyData[];         // Yearly aggregated data
  originalTerm: number;             // Original term in years
  actualTerm: number;               // Actual term after overpayments (in years)
  timeOrPaymentSaved?: number;      // Savings from overpayments
  oneTimeFees?: number;             // One-time fees total
  recurringFees?: number;           // Total recurring fees
  totalCost?: number;               // Total cost (principal + interest + fees)
  apr?: number;                     // Annual Percentage Rate
}

interface PaymentData {
  payment: number;             // Payment number (1-based)
  monthlyPayment: number;      // Total payment amount
  principalPayment: number;    // Principal portion
  interestPayment: number;     // Interest portion
  balance: number;             // Remaining balance
  totalInterest: number;       // Cumulative interest to date
  totalPayment: number;        // Cumulative payments to date
  isOverpayment: boolean;      // Whether includes overpayment
  overpaymentAmount: number;   // Extra payment amount
  fees?: number;               // Additional fees this period
  paymentDate?: Date;          // Payment date
}

interface YearlyData {
  year: number;
  principal: number;     // Principal paid this year
  interest: number;      // Interest paid this year
  payment: number;       // Total paid this year
  balance: number;       // Balance at year end
  totalInterest: number; // Cumulative interest
}
```

### 1.2 Core Functions

**Primary Entry Point** (`calculationEngine.ts`):
```typescript
function calculateLoanDetails(params: LoanCalculationParams): CalculationResults;

// Alternative with individual parameters (backward compatibility)
function calculateLoanDetails(
  principal: number,
  interestRatePeriods: InterestRatePeriod[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails,
  repaymentModel?: RepaymentModel,
  additionalCosts?: AdditionalCosts,
  overpaymentPlans?: OverpaymentDetails[],
  startDate?: Date,
  loanDetails?: LoanDetails
): CalculationResults;
```

**Simple Helper** (`utils.ts`):
```typescript
// For basic monthly payment calculation only
function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,  // NOTE: This is monthly rate, not annual!
  totalMonths: number
): number;
```

**Validation** (`validation.ts`):
```typescript
function validateLoanDetails(
  loanDetails: LoanDetails,
  options?: ValidationOptions
): { isValid: boolean; errors: string[] };

function normalizeLoanDetails(loanDetails: LoanDetails): LoanDetails;
function normalizeInterestRate(rate: number): number;  // Handles decimal vs percentage
function normalizeLoanTerm(term: number, inMonths?: boolean): number;
```

---

## 2. Proposed WebMCP Tool inputSchema

### 2.1 Basic Mortgage Calculator Tool

For a straightforward WebMCP tool that covers 90% of use cases, the schema should be simplified:

```json
{
  "type": "object",
  "properties": {
    "principal": {
      "type": "number",
      "description": "Loan amount (e.g., 300000 for $300,000)"
    },
    "annualInterestRate": {
      "type": "number",
      "description": "Annual interest rate as percentage (e.g., 6.5 for 6.5%)"
    },
    "loanTermYears": {
      "type": "number",
      "description": "Loan term in years (e.g., 30)"
    },
    "currency": {
      "type": "string",
      "description": "Currency code for formatting",
      "default": "USD",
      "enum": ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "PLN"]
    },
    "repaymentModel": {
      "type": "string",
      "description": "Payment model type",
      "default": "equalInstallments",
      "enum": ["equalInstallments", "decreasingInstallments"]
    },
    "startDate": {
      "type": "string",
      "format": "date",
      "description": "Loan start date (ISO 8601 format: YYYY-MM-DD)"
    }
  },
  "required": ["principal", "annualInterestRate", "loanTermYears"]
}
```

### 2.2 Advanced Tool with Overpayments (Optional Future Extension)

```json
{
  "type": "object",
  "properties": {
    "principal": {
      "type": "number",
      "description": "Loan amount"
    },
    "annualInterestRate": {
      "type": "number",
      "description": "Annual interest rate as percentage"
    },
    "loanTermYears": {
      "type": "number",
      "description": "Loan term in years"
    },
    "currency": {
      "type": "string",
      "default": "USD"
    },
    "repaymentModel": {
      "type": "string",
      "default": "equalInstallments",
      "enum": ["equalInstallments", "decreasingInstallments"]
    },
    "startDate": {
      "type": "string",
      "format": "date"
    },
    "overpayment": {
      "type": "object",
      "description": "Optional one-time or recurring overpayment",
      "properties": {
        "amount": {
          "type": "number",
          "description": "Overpayment amount per occurrence"
        },
        "frequency": {
          "type": "string",
          "enum": ["one-time", "monthly", "quarterly", "annual"],
          "default": "one-time"
        },
        "startMonth": {
          "type": "integer",
          "description": "Month number to start overpayments (1-based)"
        },
        "endMonth": {
          "type": "integer",
          "description": "Month number to end overpayments (optional)"
        },
        "effect": {
          "type": "string",
          "enum": ["reduceTerm", "reducePayment"],
          "default": "reduceTerm"
        }
      },
      "required": ["amount", "frequency"]
    },
    "additionalCosts": {
      "type": "object",
      "description": "Optional fees and insurance",
      "properties": {
        "originationFee": { "type": "number", "default": 0 },
        "originationFeeType": { "type": "string", "enum": ["fixed", "percentage"], "default": "fixed" },
        "loanInsurance": { "type": "number", "default": 0 },
        "loanInsuranceType": { "type": "string", "enum": ["fixed", "percentage"], "default": "fixed" },
        "administrativeFees": { "type": "number", "default": 0 },
        "administrativeFeesType": { "type": "string", "enum": ["fixed", "percentage"], "default": "fixed" }
      }
    }
  },
  "required": ["principal", "annualInterestRate", "loanTermYears"]
}
```

---

## 3. Input Mapping: Agent Input to LoanDetails

### 3.1 Conversion Logic

```typescript
function mapToolInputToLoanDetails(input: ToolInput): LoanDetails {
  // Normalize rate if provided as decimal (0.065) instead of percentage (6.5)
  const normalizedRate = normalizeInterestRate(input.annualInterestRate);

  return {
    principal: input.principal,
    interestRatePeriods: [{
      startMonth: 1,
      interestRate: normalizedRate
    }],
    loanTerm: input.loanTermYears,
    overpaymentPlans: input.overpayment ? [{
      amount: input.overpayment.amount,
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      endDate: input.overpayment.endMonth
        ? calculateEndDate(input.startDate, input.overpayment.endMonth)
        : undefined,
      isRecurring: input.overpayment.frequency !== 'one-time',
      frequency: input.overpayment.frequency || 'one-time',
      startMonth: input.overpayment.startMonth || 1,
      endMonth: input.overpayment.endMonth,
      effect: input.overpayment.effect || 'reduceTerm'
    }] : [],
    startDate: input.startDate ? new Date(input.startDate) : new Date(),
    name: 'WebMCP Calculation',
    currency: input.currency || 'USD',
    repaymentModel: input.repaymentModel || 'equalInstallments',
    additionalCosts: input.additionalCosts ? {
      originationFee: input.additionalCosts.originationFee || 0,
      originationFeeType: input.additionalCosts.originationFeeType || 'fixed',
      loanInsurance: input.additionalCosts.loanInsurance || 0,
      loanInsuranceType: input.additionalCosts.loanInsuranceType || 'fixed',
      administrativeFees: input.additionalCosts.administrativeFees || 0,
      administrativeFeesType: input.additionalCosts.administrativeFeesType || 'fixed'
    } : undefined
  };
}
```

### 3.2 Key Conversions

| Agent Input | LoanDetails Field | Conversion Notes |
|-------------|-------------------|------------------|
| `principal` | `principal` | Direct mapping |
| `annualInterestRate` | `interestRatePeriods[0].interestRate` | Auto-normalize if <0.1 (treat as decimal) |
| `loanTermYears` | `loanTerm` | Direct mapping (already in years) |
| `startDate` (string) | `startDate` (Date) | Parse ISO 8601 string to Date |
| `currency` | `currency` | Default to "USD" |
| `repaymentModel` | `repaymentModel` | Default to "equalInstallments" |

---

## 4. Output Formatting: CalculationResults to Tool Response

### 4.1 Structured Response for AI Agents

AI agents work best with clear, structured data. Recommended response format:

```typescript
interface MortgageToolResponse {
  summary: {
    monthlyPayment: string;        // Formatted with currency
    totalInterest: string;         // Formatted with currency
    totalCost: string;             // Formatted with currency
    termLength: string;            // e.g., "30 years" or "29 years 3 months"
    apr: string;                   // e.g., "6.75%"
  };

  details: {
    monthlyPaymentRaw: number;     // Raw number for calculations
    totalInterestRaw: number;
    totalCostRaw: number;
    termMonths: number;            // Actual term in months
    aprRaw: number;                // APR as decimal
    oneTimeFees: number;
    recurringFeesTotal: number;
  };

  // Condensed yearly breakdown (not full schedule - too verbose)
  yearlyBreakdown: Array<{
    year: number;
    principalPaid: string;
    interestPaid: string;
    totalPaid: string;
    remainingBalance: string;
  }>;

  // Key milestones only
  milestones: {
    halfwayPoint: { month: number; balance: string };
    interestCrossover: { month: number; description: string };
  };

  // Natural language summary for agent to use
  naturalLanguageSummary: string;
}
```

### 4.2 Response Formatting Function

```typescript
function formatToolResponse(
  results: CalculationResults,
  currency: string = 'USD'
): MortgageToolResponse {
  const termMonths = results.amortizationSchedule.length;
  const totalCost = results.principal + results.totalInterest +
                    (results.oneTimeFees || 0) + (results.recurringFees || 0);

  return {
    summary: {
      monthlyPayment: formatCurrency(results.monthlyPayment, undefined, currency),
      totalInterest: formatCurrency(results.totalInterest, undefined, currency),
      totalCost: formatCurrency(totalCost, undefined, currency),
      termLength: formatTimePeriod(termMonths),
      apr: results.apr ? `${results.apr.toFixed(2)}%` : 'N/A'
    },

    details: {
      monthlyPaymentRaw: results.monthlyPayment,
      totalInterestRaw: results.totalInterest,
      totalCostRaw: totalCost,
      termMonths: termMonths,
      aprRaw: results.apr || 0,
      oneTimeFees: results.oneTimeFees || 0,
      recurringFeesTotal: results.recurringFees || 0
    },

    yearlyBreakdown: results.yearlyData.map(year => ({
      year: year.year,
      principalPaid: formatCurrency(year.principal, undefined, currency),
      interestPaid: formatCurrency(year.interest, undefined, currency),
      totalPaid: formatCurrency(year.payment, undefined, currency),
      remainingBalance: formatCurrency(year.balance, undefined, currency)
    })),

    milestones: calculateMilestones(results, currency),

    naturalLanguageSummary: generateNaturalSummary(results, currency)
  };
}

function generateNaturalSummary(results: CalculationResults, currency: string): string {
  const termMonths = results.amortizationSchedule.length;
  const years = Math.floor(termMonths / 12);
  const months = termMonths % 12;
  const termStr = months > 0 ? `${years} years and ${months} months` : `${years} years`;

  return `For this ${termStr} mortgage, your monthly payment would be ` +
    `${formatCurrency(results.monthlyPayment, undefined, currency)}. ` +
    `Over the life of the loan, you would pay ` +
    `${formatCurrency(results.totalInterest, undefined, currency)} in interest, ` +
    `making your total cost ${formatCurrency(results.totalCost || 0, undefined, currency)}.`;
}
```

### 4.3 Important: Schedule Truncation

The full `amortizationSchedule` can have 360+ entries (30-year loan). For WebMCP:

**DO NOT return full schedule.** Instead:
- Return `yearlyBreakdown` (max 30-40 entries)
- Return key milestones
- Offer a separate "detailed schedule" tool if needed

---

## 5. Edge Cases and Validation

### 5.1 Input Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `principal` | Must be > 0 | "Principal amount must be greater than zero" |
| `annualInterestRate` | Must be >= 0 | "Interest rate cannot be negative" |
| `annualInterestRate` | Warn if > 20 | "Interest rate seems unusually high. Did you mean X%?" |
| `loanTermYears` | Must be > 0 | "Loan term must be greater than zero" |
| `loanTermYears` | Warn if > 40 | "Loan terms over 40 years are unusual" |
| `startDate` | Must be valid ISO 8601 | "Invalid date format. Use YYYY-MM-DD" |
| `overpayment.amount` | Must be > 0 if provided | "Overpayment amount must be greater than zero" |

### 5.2 Rate Normalization

The existing `normalizeInterestRate()` function handles ambiguous rate formats:

```typescript
function normalizeInterestRate(rate: number): number {
  // If rate is very small (likely in decimal format), convert to percentage
  if (rate > 0 && rate < 0.1) {
    return rate * 100;  // 0.065 -> 6.5
  }
  return rate;  // 6.5 -> 6.5
}
```

**Agent guidance:** "Provide rate as percentage (e.g., 6.5 for 6.5%), not decimal"

### 5.3 Edge Cases to Handle

1. **Zero interest rate** - Calculator handles this with simplified division
2. **Very large principal** - No upper limit, but formatting may need attention
3. **Short terms** (< 1 year) - Works, but yearly breakdown less useful
4. **Overpayment larger than remaining balance** - Calculator caps at remaining balance
5. **Past start date** - Allow (historical calculations)
6. **Far future start date** - Allow but consider warning

### 5.4 Currency Handling

Supported currencies from `utils.ts`:
```typescript
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "PLN", symbol: "zl", name: "Polish Zloty" },
];
```

---

## 6. Recommended Implementation Approach

### 6.1 Phase 1: Basic Calculator Tool

Start with minimal schema:
- `principal`, `annualInterestRate`, `loanTermYears` (required)
- `currency`, `startDate` (optional)

Response includes:
- Summary with formatted values
- Yearly breakdown
- Natural language summary

### 6.2 Phase 2: Add Repayment Models

Add `repaymentModel` option:
- `equalInstallments` (default, annuity)
- `decreasingInstallments` (linear depreciation)

### 6.3 Phase 3: Overpayments

Add `overpayment` object for scenarios:
- One-time lump sum
- Recurring monthly/quarterly/annual
- Impact comparison (with vs without)

### 6.4 Phase 4: Additional Costs

Add `additionalCosts` for:
- Origination fees
- Insurance
- Administrative fees
- APR calculation improvements

---

## 7. File Locations Summary

| Purpose | File Path |
|---------|-----------|
| Core types | `client/src/lib/types.ts` |
| Main calculation | `client/src/lib/calculationEngine.ts` |
| Core math | `client/src/lib/calculationCore.ts` |
| Utilities | `client/src/lib/utils.ts` |
| Validation | `client/src/lib/validation.ts` |
| Formatting | `client/src/lib/formatters.ts` |
| Overpayments | `client/src/lib/overpaymentCalculator.ts` |

---

## 8. Open Questions for Implementation

1. **Response size limit**: What is the maximum response size for WebMCP? This affects whether yearly breakdown can include all years.

2. **Error handling**: Should validation errors return structured error objects or throw?

3. **Locale support**: Current formatters use i18n. How should locale be determined in WebMCP context?

4. **Comparison mode**: Should there be a separate tool for comparing scenarios, or should the main tool accept multiple inputs?

5. **Schedule export**: Is there demand for full amortization schedule as separate tool or CSV download?
