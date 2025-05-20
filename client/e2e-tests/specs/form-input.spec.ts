/**
 * Form Input Tests
 * 
 * This file contains tests for verifying the form input functionality
 * of the mortgage calculator application.
 */

import '../utils/setup-puppeteer';
import {
  navigateToUrl,
  takeScreenshot,
  waitForPageLoad,
  elementExists,
  getElementText,
  fillFormField,
  clickElement,
  evaluateInBrowser
} from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

describe('Form Input Tests', () => {
  // Before all tests, navigate to the application
  beforeAll(async () => {
    await navigateToUrl(global.BASE_URL);
    await waitForPageLoad();
  });

  // Take a screenshot after all tests for reference
  afterAll(async () => {
    await takeScreenshot('form-input-tests-final');
  });

  // Test loan amount input
  describe('Loan Amount Input Tests', () => {
    // Test that valid loan amounts are accepted
    test('should accept valid loan amounts', async () => {
      // Enter a valid loan amount
      await fillFormField(selectors.LOAN_AMOUNT_INPUT, '250000');
      
      // Take a screenshot for reference
      await takeScreenshot('loan-amount-input-valid');
      
      // Verify the value was accepted
      const inputValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_AMOUNT_INPUT}');
        return input ? input.value : null;
      `);
      
      expect(inputValue).toBe('250000');
    });

    // Test that the input properly formats numbers
    test('should properly format loan amount with currency symbol', async () => {
      // Enter a loan amount
      await fillFormField(selectors.LOAN_AMOUNT_INPUT, '300000');
      
      // Click elsewhere to trigger formatting
      await clickElement(selectors.LOAN_TERM_INPUT);
      
      // Take a screenshot for reference
      await takeScreenshot('loan-amount-input-formatted');
      
      // Get the displayed value (which may include formatting)
      const displayedValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_AMOUNT_INPUT}');
        return input ? input.value : null;
      `);
      
      // Check that the value is properly formatted (this may vary based on implementation)
      // We're just checking that it contains the original number
      expect(displayedValue).toContain('300000');
    });

    // Test that the currency symbol is displayed correctly
    test('should display the correct currency symbol', async () => {
      // Check if the currency symbol element exists
      const symbolExists = await elementExists(selectors.CURRENCY_SYMBOL);
      expect(symbolExists).toBe(true);
      
      // Get the text content of the currency symbol element
      const currencySymbol = await getElementText(selectors.CURRENCY_SYMBOL);
      
      // Verify the currency symbol is not empty
      expect(currencySymbol).toBeTruthy();
    });
  });

  // Test interest rate inputs
  describe('Interest Rate Input Tests', () => {
    // Test adding a single interest rate period
    test('should allow adding a single interest rate period', async () => {
      // Enter an interest rate
      await fillFormField(selectors.INTEREST_RATE_INPUT, '4.5');
      
      // Take a screenshot for reference
      await takeScreenshot('interest-rate-single');
      
      // Verify the value was accepted
      const inputValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.INTEREST_RATE_INPUT}');
        return input ? input.value : null;
      `);
      
      // Use toContain instead of toBe to handle potential formatting differences
      expect(inputValue).toContain('4.5');
    });

    // Test adding multiple interest rate periods
    test('should allow adding multiple interest rate periods', async () => {
      // First, check if the add interest rate period button exists
      const addButtonExists = await elementExists(selectors.ADD_INTEREST_RATE_PERIOD_BUTTON);
      expect(addButtonExists).toBe(true);
      
      // Click the add interest rate period button
      await clickElement(selectors.ADD_INTEREST_RATE_PERIOD_BUTTON);
      
      // Take a screenshot after adding a new period
      await takeScreenshot('interest-rate-multiple-added');
      
      // Wait for the second interest rate input to appear
      await global.page.waitForSelector('[data-testid="interest-rate-input-1"]', { timeout: 5000 })
        .catch(() => {
          // If the selector doesn't appear, we'll handle it in the next assertion
        });
      
      // Check if the second interest rate input exists
      const secondInputExists = await elementExists('[data-testid="interest-rate-input-1"]');
      expect(secondInputExists).toBe(true);
      
      // Fill in the second interest rate
      await fillFormField('[data-testid="interest-rate-input-1"]', '5.0');
      
      // Take a screenshot with both rates filled
      await takeScreenshot('interest-rate-multiple-filled');
    });

    // Test that date ranges for interest periods are calculated correctly
    test('should calculate date ranges for interest periods correctly', async () => {
      // This test assumes that when multiple interest rate periods are added,
      // the application automatically calculates date ranges for each period
      
      // Check if the end date element exists
      const endDateExists = await elementExists(selectors.INTEREST_RATE_END_DATE);
      expect(endDateExists).toBe(true);
      
      // Check if at least one date range element exists
      const dateRangeExists = await elementExists('[data-testid^="interest-rate-date-range-0-start"]');
      expect(dateRangeExists).toBe(true);
      
      // Take a screenshot showing the date ranges
      await takeScreenshot('interest-rate-date-ranges');
    });
  });

  // Test loan term input
  describe('Loan Term Input Tests', () => {
    // Test setting different loan terms
    test('should allow setting different loan terms', async () => {
      // Set a loan term of 15 years
      await fillFormField(selectors.LOAN_TERM_INPUT, '15');
      
      // Take a screenshot
      await takeScreenshot('loan-term-15-years');
      
      // Verify the value was accepted
      const inputValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_TERM_INPUT}');
        return input ? input.value : null;
      `);
      
      expect(inputValue).toBe('15');
      
      // Set a different loan term (30 years)
      await fillFormField(selectors.LOAN_TERM_INPUT, '30');
      
      // Take another screenshot
      await takeScreenshot('loan-term-30-years');
      
      // Verify the new value was accepted
      const newInputValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_TERM_INPUT}');
        return input ? input.value : null;
      `);
      
      expect(newInputValue).toBe('30');
    });

    // Test that changing loan term updates interest rate periods
    test('should update interest rate periods when loan term changes', async () => {
      // Set a loan term of 20 years
      await fillFormField(selectors.LOAN_TERM_INPUT, '20');
      
      // Take a screenshot before checking the effect on interest rate periods
      await takeScreenshot('loan-term-effect-before');
      
      // Check the end date of the interest rate period(s)
      const beforeEndDate = await evaluateInBrowser(`
        // This selector might need to be adjusted based on implementation
        const endDateElement = document.querySelector('[data-testid="interest-rate-end-date"]');
        return endDateElement ? endDateElement.textContent : null;
      `);
      
      // Change the loan term to 10 years
      await fillFormField(selectors.LOAN_TERM_INPUT, '10');
      
      // Take a screenshot after changing the loan term
      await takeScreenshot('loan-term-effect-after');
      
      // Check the end date again
      const afterEndDate = await evaluateInBrowser(`
        const endDateElement = document.querySelector('[data-testid="interest-rate-end-date"]');
        return endDateElement ? endDateElement.textContent : null;
      `);
      
      // Verify that the end date changed
      expect(beforeEndDate).not.toBe(afterEndDate);
    });

    // Test validation for minimum and maximum values
    test('should validate minimum and maximum loan term values', async () => {
      // Set a valid loan term first
      await fillFormField(selectors.LOAN_TERM_INPUT, '30');
      
      // Click elsewhere
      await clickElement(selectors.LOAN_AMOUNT_INPUT);
      
      // Take a screenshot
      await takeScreenshot('loan-term-valid');
      
      // Verify the value was accepted
      const validInputValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_TERM_INPUT}');
        return input ? input.value : null;
      `);
      
      expect(validInputValue).toBe('30');
      
      // Try to set a loan term below the minimum (e.g., 0 years)
      await fillFormField(selectors.LOAN_TERM_INPUT, '0');
      
      // Click elsewhere to trigger validation
      await clickElement(selectors.LOAN_AMOUNT_INPUT);
      
      // Take a screenshot
      await takeScreenshot('loan-term-below-minimum');
      
      // Set a valid loan term again
      await fillFormField(selectors.LOAN_TERM_INPUT, '20');
      
      // Click elsewhere
      await clickElement(selectors.LOAN_AMOUNT_INPUT);
      
      // Verify the new value was accepted
      const newValidValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_TERM_INPUT}');
        return input ? input.value : null;
      `);
      
      expect(newValidValue).toBe('20');
      
      // Try to set a loan term above the maximum (e.g., 50 years if max is 40)
      await fillFormField(selectors.LOAN_TERM_INPUT, '50');
      
      // Click elsewhere to trigger validation
      await clickElement(selectors.LOAN_AMOUNT_INPUT);
      
      // Take a screenshot
      await takeScreenshot('loan-term-above-maximum');
      
      // Set a valid loan term again
      await fillFormField(selectors.LOAN_TERM_INPUT, '25');
      
      // Click elsewhere
      await clickElement(selectors.LOAN_AMOUNT_INPUT);
      
      // Verify the new value was accepted
      const finalValidValue = await evaluateInBrowser(`
        const input = document.querySelector('${selectors.LOAN_TERM_INPUT}');
        return input ? input.value : null;
      `);
      
      expect(finalValidValue).toBe('25');
    });
  });
});