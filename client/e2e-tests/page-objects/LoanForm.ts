import { BasePage } from './BasePage';
import {
  fillFormField,
  clickElement,
  evaluateInBrowser
} from '../utils/puppeteer-helpers';
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
}