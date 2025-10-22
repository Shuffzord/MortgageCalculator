import {
  navigateToUrl,
  takeScreenshot,
  waitForPageLoad,
  elementExists,
  getElementText
} from '../utils/puppeteer-helpers';

// Add proper type declaration for the global variables
declare const global: {
  BASE_URL: string;
  HEADLESS: boolean;
  browser: import('puppeteer').Browser;
  page: import('puppeteer').Page;
  [key: string]: any;
};

export abstract class BasePage {
  constructor(protected readonly path: string = '') {}
  
  async navigate(): Promise<void> {
    await navigateToUrl(`${global.BASE_URL}${this.path}`);
    await waitForPageLoad();
  }
  
  async takeScreenshot(name: string): Promise<void> {
    await takeScreenshot(name);
  }
  
  async elementExists(selector: string): Promise<boolean> {
    return await elementExists(selector);
  }
  
  async getElementText(selector: string): Promise<string | null> {
    return await getElementText(selector);
  }
}