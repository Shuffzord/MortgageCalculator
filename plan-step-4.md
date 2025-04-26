# Plan Step 4: Verification Steps

## Goal
Verify that the changes have been implemented correctly and that the engine is functioning as expected.

### 4.1. Unit Testing
- **Action**: Run all the unit tests using the `npm test` command.
- **Expected**: All test cases should pass, including the existing test cases and the new test cases for variable interest rates.
- **If Tests Fail**:
    1.  **Analyze Error Messages**: Carefully analyze the error messages to identify the cause of the failure.
    2.  **Debug Code**: Use debugging techniques to step through the code and identify the source of the error.
    3.  **Fix Code**: Fix the code and rerun the tests until all test cases pass.

### 4.2. Manual Verification
- **Action**: Manually verify the calculations using a reference implementation or a trusted online calculator.
- **Scenarios**:
    - **Fixed-Rate Mortgage**: Verify the calculations for a standard fixed-rate mortgage.
    - **Variable-Rate Mortgage**: Verify the calculations for a variable-rate mortgage with multiple interest rate periods.
    - **Overpayments**: Verify the calculations for a loan with overpayments.
- **If Calculations are Incorrect**:
    1.  **Analyze Formulas**: Carefully review the formulas used in the `calculateMonthlyPayment` and `generateAmortizationSchedule` functions.
    2.  **Check Rounding**: Ensure that rounding is handled correctly throughout the calculations.
    3.  **Verify Logic**: Verify the logic for handling different scenarios, such as zero principal or near-zero interest rates.