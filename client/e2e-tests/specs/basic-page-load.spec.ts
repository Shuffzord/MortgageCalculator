/**
 * Basic Page Load Tests
 * 
 * This file contains tests for verifying that the mortgage calculator application
 * loads correctly and all main components are visible.
 */

import '../utils/setup-puppeteer';
import {
  navigateToUrl,
  takeScreenshot,
  waitForPageLoad,
  elementExists,
  getElementText
} from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

describe('Basic Page Load Tests', () => {
  // Before all tests, navigate to the application
  beforeAll(async () => {
    await navigateToUrl(global.BASE_URL);
    await waitForPageLoad();
  });

  // Take a screenshot after all tests for reference
  afterAll(async () => {
    await takeScreenshot('final-state');
  });

  // Test that the main page loads without errors
  test('should load the application correctly', async () => {
    // Take a screenshot of the initial page load
    await takeScreenshot('initial-page-load');
    
    // Verify that the application container is present
    const appExists = await elementExists(selectors.APP_CONTAINER);
    expect(appExists).toBe(true);
  });

  // Check that the page title is correct
  test('should have the correct page title', async () => {
    const pageTitle = await getElementText(selectors.PAGE_TITLE);
    expect(pageTitle).toContain('Mortgage Calculator');
  });

  // Verify that all main components are visible
  test('should display all main components', async () => {
    // Verify LoanInputForm is visible
    const loanFormExists = await elementExists(selectors.LOAN_INPUT_FORM);
    expect(loanFormExists).toBe(true);
    
    // Verify LoanSummary section is present (even if empty initially)
    const loanSummaryExists = await elementExists(selectors.LOAN_SUMMARY);
    expect(loanSummaryExists).toBe(true);
    
    // Check that the Calculate button is present
    const calculateButtonExists = await elementExists(selectors.CALCULATE_BUTTON);
    expect(calculateButtonExists).toBe(true);
  });

  // Validate initial state of the form
  test('should have the form in a valid initial state', async () => {
    // Verify loan amount input is present
    const loanAmountExists = await elementExists(selectors.LOAN_AMOUNT_INPUT);
    expect(loanAmountExists).toBe(true);
    
    // Verify interest rate input is present
    const interestRateExists = await elementExists(selectors.INTEREST_RATE_INPUT);
    expect(interestRateExists).toBe(true);
    
    // Verify loan term input is present
    const loanTermExists = await elementExists(selectors.LOAN_TERM_INPUT);
    expect(loanTermExists).toBe(true);
    
    // Verify repayment model select is present
    const repaymentModelExists = await elementExists(selectors.REPAYMENT_MODEL_SELECT);
    expect(repaymentModelExists).toBe(true);
  });
});