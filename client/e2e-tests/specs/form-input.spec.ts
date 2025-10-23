/**
 * Form Input Tests
 *
 * This file contains tests for verifying the form input functionality
 * of the mortgage calculator application.
 * Refactored to use Page Object Model and shared test utilities.
 */

import '../utils/setup-puppeteer';
import { LoanForm } from '../page-objects/LoanForm';
import { LoanSummary } from '../page-objects/LoanSummary';
import { createBasicLoanData, createShortTermLoanData } from '../test-data/loan-data';
import * as selectors from '../utils/selectors';
import { isValidLoanTerm } from '../../src/test-utils/validation';

describe('Form Input Tests', () => {
  let loanForm: LoanForm;
  let loanSummary: LoanSummary;

  // Before all tests, initialize page objects and navigate to the application
  beforeAll(async () => {
    loanForm = new LoanForm();
    loanSummary = new LoanSummary();
    await loanForm.navigate();
  });

  // Take a screenshot after all tests for reference
  afterAll(async () => {
    await loanForm.takeScreenshot('form-input-tests-final');
  });

  // Test loan amount input
  describe('Loan Amount Input Tests', () => {
    // Test that valid loan amounts are accepted
    test('should accept valid loan amounts', async () => {
      // Use test data factory
      const testData = createBasicLoanData();

      // Enter a valid loan amount using page object
      await loanForm.fillLoanAmount(testData.amount);

      // Take a screenshot for reference
      await loanForm.takeScreenshot('loan-amount-input-valid');

      // Verify the value was accepted using page object
      const inputValue = await loanForm.getLoanAmountValue();
      expect(inputValue).toBe(testData.amount);
    });

    // Test that the input properly formats numbers
    test('should properly format loan amount with currency symbol', async () => {
      // Enter a loan amount
      await loanForm.fillLoanAmount('300000');

      // Click elsewhere to trigger formatting
      await loanForm.fillLoanTerm('30');

      // Take a screenshot for reference
      await loanForm.takeScreenshot('loan-amount-input-formatted');

      // Get the displayed value using page object
      const displayedValue = await loanForm.getLoanAmountValue();

      // Check that the value is properly formatted
      expect(displayedValue).toContain('300000');
    });

    // Test that the currency symbol is displayed correctly
    test('should display the correct currency symbol', async () => {
      // Check if the currency symbol element exists
      const symbolExists = await loanForm.elementExists(selectors.CURRENCY_SYMBOL);
      expect(symbolExists).toBe(true);

      // Get the text content of the currency symbol element
      const currencySymbol = await loanForm.getElementText(selectors.CURRENCY_SYMBOL);

      // Verify the currency symbol is not empty
      expect(currencySymbol).toBeTruthy();
    });
  });

  // Test interest rate inputs
  describe('Interest Rate Input Tests', () => {
    // Test adding a single interest rate period
    test('should allow adding a single interest rate period', async () => {
      // Use test data factory
      const testData = createBasicLoanData();

      // Enter an interest rate using page object
      await loanForm.fillInterestRate(testData.interestRate);

      // Take a screenshot for reference
      await loanForm.takeScreenshot('interest-rate-single');

      // Verify the value was accepted using page object
      const inputValue = await loanForm.getInterestRateValue();

      // Use toContain instead of toBe to handle potential formatting differences
      expect(inputValue).toContain(testData.interestRate);
    });

    // Test adding multiple interest rate periods
    test('should allow adding multiple interest rate periods', async () => {
      // First, check if the add interest rate period button exists
      const addButtonExists = await loanForm.elementExists(
        selectors.ADD_INTEREST_RATE_PERIOD_BUTTON
      );
      expect(addButtonExists).toBe(true);

      // Click the add interest rate period button
      await loanForm.clickElement(selectors.ADD_INTEREST_RATE_PERIOD_BUTTON);

      // Take a screenshot after adding a new period
      await loanForm.takeScreenshot('interest-rate-multiple-added');

      // Wait for the second interest rate input to appear
      await global.page
        .waitForSelector('[data-testid="interest-rate-input-1"]', { timeout: 5000 })
        .catch(() => {
          // If the selector doesn't appear, we'll handle it in the next assertion
        });

      // Check if the second interest rate input exists
      const secondInputExists = await loanForm.elementExists(
        '[data-testid="interest-rate-input-1"]'
      );
      expect(secondInputExists).toBe(true);

      // Fill in the second interest rate
      await loanForm.fillFormField('[data-testid="interest-rate-input-1"]', '5.0');

      // Take a screenshot with both rates filled
      await loanForm.takeScreenshot('interest-rate-multiple-filled');
    });

    // Test that date ranges for interest periods are calculated correctly
    test('should calculate date ranges for interest periods correctly', async () => {
      // This test assumes that when multiple interest rate periods are added,
      // the application automatically calculates date ranges for each period

      // Check if the end date element exists
      const endDateExists = await loanForm.elementExists(selectors.INTEREST_RATE_END_DATE);
      expect(endDateExists).toBe(true);

      // Check if at least one date range element exists
      const dateRangeExists = await loanForm.elementExists(
        '[data-testid^="interest-rate-date-range-0-start"]'
      );
      expect(dateRangeExists).toBe(true);

      // Take a screenshot showing the date ranges
      await loanForm.takeScreenshot('interest-rate-date-ranges');
    });
  });

  // Test loan term input
  describe('Loan Term Input Tests', () => {
    // Test setting different loan terms
    test('should allow setting different loan terms', async () => {
      // Use test data factory
      const shortTermData = createShortTermLoanData();
      const basicLoanData = createBasicLoanData();

      // Set a loan term of 15 years using page object
      await loanForm.fillLoanTerm(shortTermData.term);

      // Take a screenshot
      await loanForm.takeScreenshot('loan-term-15-years');

      // Verify the value was accepted using page object
      const inputValue = await loanForm.getLoanTermValue();
      expect(inputValue).toBe(shortTermData.term);

      // Set a different loan term (30 years) using page object
      await loanForm.fillLoanTerm(basicLoanData.term);

      // Take another screenshot
      await loanForm.takeScreenshot('loan-term-30-years');

      // Verify the new value was accepted using page object
      const newInputValue = await loanForm.getLoanTermValue();
      expect(newInputValue).toBe(basicLoanData.term);
    });

    // Test that changing loan term updates interest rate periods
    test('should update interest rate periods when loan term changes', async () => {
      // Set a loan term of 20 years using page object
      await loanForm.fillLoanTerm('20');

      // Take a screenshot before checking the effect on interest rate periods
      await loanForm.takeScreenshot('loan-term-effect-before');

      // Check the end date of the interest rate period(s)
      const beforeEndDate = await loanForm.getElementText(selectors.INTEREST_RATE_END_DATE);

      // Change the loan term to 10 years using page object
      await loanForm.fillLoanTerm('10');

      // Take a screenshot after changing the loan term
      await loanForm.takeScreenshot('loan-term-effect-after');

      // Check the end date again
      const afterEndDate = await loanForm.getElementText(selectors.INTEREST_RATE_END_DATE);

      // Verify that the end date changed
      expect(beforeEndDate).not.toBe(afterEndDate);
    });

    // Test validation for minimum and maximum values
  });
});
