# Robust Step-by-Step Plan for Mortgage Calculation Engine Enhancement

## Goal
Enhance the mortgage calculation engine to correctly handle variable interest rates using the `interestRatePeriods` property in the `LoanDetails` interface.

**1. Prioritize Data Structure Changes (plan-step-1.md):**

*   **Rationale:** Modifying the `LoanDetails` interface is a foundational change. It affects how loan data is passed throughout the application.
*   **Orchestration:**
    *   Delegate to: `code` mode
    *   Instructions:
        *   Implement the changes outlined in `plan-step-1.md` to modify the `LoanDetails` interface in `client/src/lib/types.ts`.
        *   Specifically, remove the `interestRate` property and ensure that the `interestRatePeriods` property is used for defining interest rates.
        *   After making these changes, run `npm test` to identify any immediate type errors or broken tests.
        *   Use `attempt_completion` to signal completion, including a summary of changes and any test results.

**2. Implement Core Calculation Logic (plan-step-2.md):**

*   **Rationale:** This step modifies the core calculation logic to handle variable interest rates. It's crucial to ensure that this logic is implemented correctly and that it doesn't break existing functionality.
*   **Orchestration:**
    *   Delegate to: `code` mode
    *   Instructions:
        *   Implement the changes outlined in `plan-step-2.md` to modify the `calculateLoanDetails` function in `client/src/lib/calculationEngine.ts`.
        *   Update the function signature to accept a `LoanDetails` object.
        *   Implement the variable interest rate logic as described in the plan.
        *   Add logging statements to verify the calculated monthly payments and total interest for different interest rate periods.
        *   After making these changes, run `npm test` to identify any errors or broken tests.
        *   Use `attempt_completion` to signal completion, including a summary of changes, any test results, and the logging output.

**3. Adjust Existing Test Cases (plan-step-3.md - Part 1):**

*   **Rationale:** Existing tests need to be adapted to the new data structure. This is a critical step to ensure that existing functionality remains intact.
*   **Orchestration:**
    *   Delegate to: `code` mode
    *   Instructions:
        *   Implement the changes outlined in `plan-step-3.md` (only the "Existing Test Cases" part) to modify the existing test cases in `client/src/lib/comprehensive-tests/basic-validation.test.ts` and `client/src/lib/simple-fixes-test.test.ts`.
        *   Create `LoanDetails` objects with the appropriate properties in each test case.
        *   Update the expected values in the test assertions to reflect the new functionality.
        *   After making these changes, run `npm test` to ensure that the existing test cases still pass.
        *   Use `attempt_completion` to signal completion, including a summary of changes and any test results.

**4. Create New Test Cases (plan-step-3.md - Part 2):**

*   **Rationale:** New tests are essential to validate the variable interest rate functionality.
*   **Orchestration:**
    *   Delegate to: `code` mode
    *   Instructions:
        *   Implement the changes outlined in `plan-step-3.md` (only the "New Test Cases" part) to create a new test file `client/src/lib/comprehensive-tests/variable-rate.test.ts` with the specified test cases.
        *   Ensure that the new test cases cover all the different scenarios and edge cases for variable interest rates.
        *   After making these changes, run `npm test` to ensure that the new test cases pass.
        *   Use `attempt_completion` to signal completion, including a summary of changes and any test results.

**5. Comprehensive Verification (plan-step-4.md):**

*   **Rationale:** This step ensures that all changes are working together correctly and that the engine is functioning as expected.
*   **Orchestration:**
    *   Delegate to: `debug` mode
    *   Instructions:
        *   Perform the unit testing and manual verification steps outlined in `plan-step-4.md`.
        *   Analyze any failing test cases and identify the root cause of the failures.
        *   Provide a detailed report of the verification results, including any identified issues and proposed solutions.
        *   Use `attempt_completion` to signal completion, including the detailed report.

**6. Code Submission (plan-step-5.md):**

*   **Rationale:** This is the final step to submit the changes.
*   **Orchestration:**
    *   Delegate to: `code` mode
    *   Instructions:
        *   Ensure that all test cases pass.
        *   Ensure that the code is well-formatted and easy to read.
        *   Ensure that the code is properly documented.
        *   Submit the changes to the code repository.
        *   Use `attempt_completion` to signal completion.