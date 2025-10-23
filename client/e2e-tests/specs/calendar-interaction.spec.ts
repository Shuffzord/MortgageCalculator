/**
 * Calendar Interaction Tests
 *
 * This file contains tests for verifying the calendar functionality
 * in the mortgage calculator application.
 */

import '../utils/setup-puppeteer';
import { LoanForm } from '../page-objects/LoanForm';
import * as selectors from '../utils/selectors';
import { createBasicLoanData } from '../test-data/loan-data';

describe('Calendar Interaction Tests', () => {
  let loanForm: LoanForm;

  // Before all tests, initialize page objects and navigate to the application
  beforeAll(async () => {
    loanForm = new LoanForm();
    await loanForm.navigate();
  });

  // Take a screenshot after all tests for reference
  afterAll(async () => {
    await loanForm.takeScreenshot('calendar-tests-final');
  });

  // Test loan start date calendar
  describe('Loan Start Date Calendar Tests', () => {
    test('should open and select a date from the loan start date calendar', async () => {
      // Open the loan start date calendar
      await loanForm.openLoanStartDateCalendar();

      // Take a screenshot of the open calendar
      await loanForm.takeScreenshot('loan-start-date-calendar-open');

      // Select a date
      await loanForm.selectDate();

      // Take a screenshot after date selection
      await loanForm.takeScreenshot('loan-start-date-selected');

      // Verify the form can be submitted after date selection
      await loanForm.clickCalculate();

      // Verify calculation was successful
      const summaryVisible = await loanForm.elementExists(selectors.LOAN_SUMMARY);
      expect(summaryVisible).toBe(true);
    });

    test('should navigate between years in the loan start date calendar', async () => {
      // Open the loan start date calendar
      await loanForm.openLoanStartDateCalendar();

      // Navigate to next year
      await loanForm.navigateToNextYear();

      // Take a screenshot after navigation
      await loanForm.takeScreenshot('loan-start-date-next-year');

      // Navigate to previous year
      await loanForm.navigateToPreviousYear();

      // Take a screenshot after navigation
      await loanForm.takeScreenshot('loan-start-date-previous-year');

      // Select a date
      await loanForm.selectDate();

      // Verify the form can be submitted after year navigation
      await loanForm.clickCalculate();

      // Verify calculation was successful
      const summaryVisible = await loanForm.elementExists(selectors.LOAN_SUMMARY);
      expect(summaryVisible).toBe(true);
    });
  });

  // Test interest rate period calendars
  describe('Interest Rate Period Calendar Tests', () => {
    test('should open and select dates for interest rate periods', async () => {
      // Add an interest rate period
      await loanForm.clickElement(selectors.ADD_INTEREST_RATE_PERIOD_BUTTON);

      // Open the interest rate period start date calendar
      await loanForm.openInterestRatePeriodStartDateCalendar(1);

      // Take a screenshot of the open calendar
      await loanForm.takeScreenshot('interest-rate-start-date-calendar-open');

      // Select a date
      await loanForm.selectDate();

      // Open the interest rate period end date calendar
      await loanForm.openInterestRatePeriodEndDateCalendar();

      // Take a screenshot of the open calendar
      await loanForm.takeScreenshot('interest-rate-end-date-calendar-open');

      // Select a date
      await loanForm.selectDate();

      // Verify the form can be submitted after date selection
      await loanForm.clickCalculate();

      // Verify calculation was successful
      const summaryVisible = await loanForm.elementExists(selectors.LOAN_SUMMARY);
      expect(summaryVisible).toBe(true);
    });

    test('should navigate between years in interest rate period calendars', async () => {
      // Open the interest rate period end date calendar
      await loanForm.openInterestRatePeriodEndDateCalendar();

      // Navigate to next year
      await loanForm.navigateToNextYear();

      // Take a screenshot after navigation
      await loanForm.takeScreenshot('interest-rate-end-date-next-year');

      // Navigate to previous year
      await loanForm.navigateToPreviousYear();

      // Take a screenshot after navigation
      await loanForm.takeScreenshot('interest-rate-end-date-previous-year');

      // Select a date
      await loanForm.selectDate();

      // Verify the form can be submitted after year navigation
      await loanForm.clickCalculate();

      // Verify calculation was successful
      const summaryVisible = await loanForm.elementExists(selectors.LOAN_SUMMARY);
      expect(summaryVisible).toBe(true);
    });
  });
});
