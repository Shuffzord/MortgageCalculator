// Global type declarations for e2e tests

declare global {
  namespace NodeJS {
    interface Global {
      BASE_URL: string;
      HEADLESS: boolean;
      browser: import('puppeteer').Browser;
      page: import('puppeteer').Page;
    }
  }

  var BASE_URL: string;
  var HEADLESS: boolean;
  var browser: import('puppeteer').Browser;
  var page: import('puppeteer').Page;
}

export {};