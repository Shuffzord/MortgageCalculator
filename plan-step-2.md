# Plan Step 2: Core Calculation Logic Modification (`client/src/lib/calculationEngine.ts`)

## Goal
Modify the `calculateLoanDetails` function to handle variable interest rates using the `interestRatePeriods` property.

### 2.1. Modify `calculateLoanDetails` Function Signature
- **Check**: Verify the current signature of the `calculateLoanDetails` function.
- **Expected**:
    ```typescript
    export function calculateLoanDetails(
      principal: number,
      interestRate: number,
      loanTerm: number,
      overpaymentPlan?: OverpaymentDetails
    ): CalculationResults {
    ```
- **Action**: Modify the function signature to accept a `LoanDetails` object instead of separate `principal`, `interestRate`, and `loanTerm` parameters.
- **New Signature**:
    ```typescript
    export function calculateLoanDetails(
      loanDetails: LoanDetails,
      overpaymentPlan?: OverpaymentDetails
    ): CalculationResults {
    ```
- **Safe Check**: Ensure that all calls to `calculateLoanDetails` are updated to pass a `LoanDetails` object.

### 2.2. Implement Variable Interest Rate Logic
- **Action**: Modify the `calculateLoanDetails` function to handle the `interestRatePeriods` property.
    - If `loanDetails.interestRatePeriods` is empty, use a default interest rate (e.g., 0) or throw an error.
    - If `loanDetails.interestRatePeriods` is not empty, iterate over the periods and calculate the monthly payment for each period.
    - Use the `calculateMonthlyPayment` function from `client/src/lib/utils.ts` to calculate the monthly payment for each period.
    - Generate the amortization schedule based on the variable interest rates.
- **Safe Check**: Add logging to verify the calculated monthly payments and total interest for different interest rate periods.

### 2.3. Update Input Validation
- **Action**: Update the `validateInputs` function (if applicable) to validate the `LoanDetails` object, including the `interestRatePeriods` property.
- **Safe Check**: Ensure that the validation logic correctly handles different scenarios, such as empty `interestRatePeriods` or invalid interest rates.