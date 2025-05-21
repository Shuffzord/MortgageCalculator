import { BasePage } from './BasePage';
import { getElementText, waitForElement } from '../utils/puppeteer-helpers';
import * as selectors from '../utils/selectors';

export class LoanSummary extends BasePage {
  async waitForSummaryToLoad(timeout = 10000): Promise<void> {
    try {
      await waitForElement(selectors.LOAN_SUMMARY, timeout);
      console.log('Loan summary loaded successfully');
    } catch (error) {
      console.error('Failed to load loan summary:', error);
      throw error;
    }
  }

  async getMonthlyPayment(timeout = 10000): Promise<string | null> {
    try {
      await waitForElement(selectors.MONTHLY_PAYMENT, timeout);
      return await getElementText(selectors.MONTHLY_PAYMENT);
    } catch (error) {
      console.error('Failed to get monthly payment:', error);
      return null;
    }
  }
  
  async getTotalInterest(timeout = 10000): Promise<string | null> {
    try {
      await waitForElement(selectors.TOTAL_INTEREST, timeout);
      return await getElementText(selectors.TOTAL_INTEREST);
    } catch (error) {
      console.error('Failed to get total interest:', error);
      return null;
    }
  }
  
  async getTotalCost(timeout = 10000): Promise<string | null> {
    try {
      await waitForElement(selectors.TOTAL_COST, timeout);
      return await getElementText(selectors.TOTAL_COST);
    } catch (error) {
      console.error('Failed to get total cost:', error);
      return null;
    }
  }
  
  async isVisible(): Promise<boolean> {
    return await this.elementExists(selectors.LOAN_SUMMARY);
  }
}