/**
 * Standard Puppeteer Setup
 *
 * This file initializes Puppeteer for end-to-end testing.
 * It should be imported at the beginning of each test file.
 */

import * as puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

// Declare global variables for TypeScript
declare global {
  var browser: Browser;
  var page: Page;
}

/**
 * Initialize Puppeteer
 * This function creates a browser and page instance for testing
 */
export async function initPuppeteer() {
  // Launch browser with specified options
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  // Set global variables
  global.browser = browser;
  global.page = page;
  
  return { browser, page };
}

// Setup before tests
beforeAll(async () => {
  await initPuppeteer();
});

// Cleanup after tests
afterAll(async () => {
  if (global.browser) {
    await global.browser.close();
  }
});

// Export the initialization function
export default initPuppeteer;