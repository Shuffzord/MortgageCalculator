import { BasePage } from './BasePage';
import { fillFormField, clickElement, evaluateInBrowser } from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

export class LoanForm extends BasePage {
  // Selectors are already defined in selectors.ts

  async fillLoanAmount(amount: string): Promise<void> {
    await fillFormField(selectors.LOAN_AMOUNT_INPUT, amount);
  }

  async fillInterestRate(rate: string): Promise<void> {
    await fillFormField(selectors.INTEREST_RATE_INPUT, rate);
  }

  async fillLoanTerm(term: string): Promise<void> {
    await fillFormField(selectors.LOAN_TERM_INPUT, term);
  }

  async selectRepaymentModel(model: string): Promise<void> {
    await clickElement(selectors.REPAYMENT_MODEL_SELECT);
    // Add code to select the option
  }

  async clickCalculate(): Promise<void> {
    await clickElement(selectors.CALCULATE_BUTTON);
  }

  async fillCompleteForm(amount: string, rate: string, term: string): Promise<void> {
    await this.fillLoanAmount(amount);
    await this.fillInterestRate(rate);
    await this.fillLoanTerm(term);
    await this.clickCalculate();
  }

  async getLoanAmountValue(): Promise<string> {
    return await evaluateInBrowser(`
      const input = document.querySelector('${selectors.LOAN_AMOUNT_INPUT}');
      return input ? input.value : null;
    `);
  }

  async getInterestRateValue(): Promise<string> {
    return await evaluateInBrowser(`
      const input = document.querySelector('${selectors.INTEREST_RATE_INPUT}');
      return input ? input.value : null;
    `);
  }

  async getLoanTermValue(): Promise<string> {
    return await evaluateInBrowser(`
      const input = document.querySelector('${selectors.LOAN_TERM_INPUT}');
      return input ? input.value : null;
    `);
  }

  // Additional methods needed for the refactored tests
  async clickElement(selector: string): Promise<void> {
    await clickElement(selector);
  }

  async fillFormField(selector: string, value: string): Promise<void> {
    await fillFormField(selector, value);
  }

  // Calendar interaction methods
  async openLoanStartDateCalendar(): Promise<void> {
    await clickElement('[data-testid="loan-start-date-button"]');
  }

  // Open an interest rate period start date calendar
  async openInterestRatePeriodStartDateCalendar(index: number): Promise<void> {
    const selector = `[data-testid="interest-rate-date-range-${index}-start"]`;
    await clickElement(selector);
  }

  // Open an interest rate period end date calendar
  async openInterestRatePeriodEndDateCalendar(): Promise<void> {
    await clickElement(selectors.INTEREST_RATE_END_DATE);
  }

  // Navigate to previous year in calendar
  async navigateToPreviousYear(): Promise<void> {
    await clickElement('[data-testid="previous-year-button"]');
  }

  // Navigate to next year in calendar
  async navigateToNextYear(): Promise<void> {
    await clickElement('[data-testid="next-year-button"]');
  }

  // Select a date in the calendar
  async selectDate(): Promise<void> {
    await clickElement('[data-testid="calendar-select-date"]');
  }

  // Get the selected date from a calendar button
  async getSelectedDate(selector: string): Promise<string> {
    return await evaluateInBrowser(`
      const button = document.querySelector('${selector}');
      return button ? button.textContent.trim() : null;
    `);
  }
}
