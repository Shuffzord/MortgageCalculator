# Plan Step 1: Data Structure Review and Enhancement (`client/src/lib/types.ts`)

## Goal
Review and enhance the data structures used by the mortgage calculation engine, focusing on the `LoanDetails` interface.

### 1.1. Review Existing `LoanDetails` Interface
- **Check**: Verify the current definition of the `LoanDetails` interface.
- **Expected**:
    ```typescript
    export interface LoanDetails {
      principal: number;
      interestRatePeriods: InterestRatePeriod[];
      loanTerm: number;
      overpaymentPlans: OverpaymentDetails[];
      startDate: Date;
      name: string;
      currency?: string;
      dateCreated?: string;
      interestRate: number;
    }
    ```

### 1.2. Enhance `LoanDetails` Interface
- **Action**: Modify the `LoanDetails` interface to remove the single `interestRate` property and rely solely on `interestRatePeriods` for defining interest rates.
- **Reason**: This ensures consistency and avoids ambiguity when handling variable rates.
- **New Definition**:
    ```typescript
    export interface LoanDetails {
      principal: number;
      interestRatePeriods: InterestRatePeriod[];
      loanTerm: number;
      overpaymentPlans: OverpaymentDetails[];
      startDate: Date;
      name: string;
      currency?: string;
      dateCreated?: string;
    }
    ```
- **Safe Check**: After this change, ensure that all existing code that uses `LoanDetails` is updated to use `interestRatePeriods` instead of `interestRate`.

### 1.3. Review `InterestRatePeriod` Interface
- **Check**: Verify the current definition of the `InterestRatePeriod` interface.
- **Expected**:
    ```typescript
    export interface InterestRatePeriod {
      startMonth: number;
      interestRate: number;
    }
    ```
- **Action**: No changes needed.

## Test Update Plan

1.  **Update Tests to Use `interestRatePeriods`:** Modify all tests to pass an array of `interestRatePeriods` to the `calculateLoanDetails` function. For tests that use a single, fixed interest rate, create an array with a single `interestRatePeriod` object.
2.  **Review and Update Expected Values:** Carefully review the expected values in each test and update them as necessary to reflect the changes in the `calculateLoanDetails` function. This might involve manually calculating the expected values or using a known-good mortgage calculator to generate the expected values.
3.  **Fix `LoanDetails` Object in `client/src/lib/comprehensive-tests/interest-rate-changes.test.ts`:** Modify the `LoanDetails` object to correctly use the `interestRatePeriods` array.
4.  **Add Tests for `calculateComplexScenario`:** Add more tests specifically for the `calculateComplexScenario` function to ensure it is working correctly.
5.  **Consider Adding Tests for Variable Interest Rates:** Add new tests to specifically validate the amortization schedule for loans with changing interest rates. This would involve creating test cases with different rate change scenarios and verifying that the calculator produces accurate results.