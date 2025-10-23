/**
 * Global Setup for Jest
 *
 * This file runs once before all tests start.
 * It's a good place to set up global resources like the screenshots directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function () {
  console.log('Setting up global test environment...');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    console.log(`Creating screenshots directory: ${screenshotsDir}`);
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Global setup complete');
}
