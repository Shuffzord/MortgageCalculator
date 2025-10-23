/**
 * Puppeteer Helper Functions
 *
 * This file contains utility functions for working with Puppeteer.
 * These functions make it easier to interact with the Puppeteer API.
 */
import * as fs from 'fs';
import * as path from 'path';
// Helper function to navigate to a URL
export async function navigateToUrl(url: string) {
  try {
    // Validate URL before navigation
    const validUrl = validateUrl(url);
    console.log(`Navigating to: ${validUrl}`);
    await global.page.goto(validUrl, { waitUntil: 'networkidle2' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Navigation error: ${errorMessage}`);
    throw new Error(`Failed to navigate to ${url}: ${errorMessage}`);
  }
}

// Helper function to validate URLs
function validateUrl(url: string): string {
  try {
    // Check if the URL is valid by creating a URL object
    new URL(url);
    return url;
  } catch (error: unknown) {
    // If the URL is invalid, throw a more descriptive error
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid URL: ${url} - ${errorMessage}`);
  }
}

// Helper function to take a screenshot
export async function takeScreenshot(name: string, selector?: string) {
  // Create screenshots directory if it doesn't exist

  const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  if (selector) {
    const element = await global.page.$(selector);
    if (element) {
      await element.screenshot({ path: `${screenshotsDir}/${name}.png` });
    }
  } else {
    await global.page.screenshot({ path: `${screenshotsDir}/${name}.png` });
  }
}

// Helper function to click an element
export async function clickElement(selector: string) {
  await global.page.waitForSelector(selector);
  await global.page.click(selector);
}

// Helper function to fill a form field
export async function fillFormField(selector: string, value: string) {
  await global.page.waitForSelector(selector);
  // Clear the field first
  await global.page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element && 'value' in element) {
      (element as HTMLInputElement).value = '';
    }
  }, selector);
  // Then type the new value
  await global.page.type(selector, value);
}

// Helper function to select an option from a dropdown
export async function selectOption(selector: string, value: string) {
  await global.page.waitForSelector(selector);
  await global.page.select(selector, value);
}

// Helper function to hover over an element
export async function hoverElement(selector: string) {
  await global.page.waitForSelector(selector);
  await global.page.hover(selector);
}

// Helper function to execute JavaScript in the browser
export async function evaluateInBrowser(script: string) {
  // Create a function that returns the result of the script
  return await global.page.evaluate(function (scriptToEval) {
    // Create a function from the script that returns the result
    const fn = new Function(`
      try {
        ${scriptToEval}
      } catch (e) {
        return null;
      }
    `);
    return fn();
  }, script);
}

// Helper function to wait for an element to be visible
export async function waitForElement(selector: string, timeout = 5000) {
  await global.page.waitForSelector(selector, { timeout });
}

// Helper function to get text content of an element
export async function getElementText(selector: string) {
  await global.page.waitForSelector(selector);
  return await global.page.$eval(selector, (element) => element.textContent);
}

// Helper function to check if an element exists
export async function elementExists(selector: string) {
  const element = await global.page.$(selector);
  return element !== null;
}

// Helper function to wait for page to load completely
export async function waitForPageLoad() {
  await global.page.waitForFunction('document.readyState === "complete"');
}
