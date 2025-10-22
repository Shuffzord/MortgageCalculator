/**
 * Global Setup for Jest
 * 
 * This file runs once before all tests start.
 * It's a good place to set up global resources like the screenshots directory.
 */

import fs from 'fs';
import path from 'path';

// Use process.cwd() to get the project root directory
const projectRoot = process.cwd();

export default async function(): Promise<void> {
  console.log('Setting up global test environment...');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.resolve(projectRoot, 'client', 'e2e-tests', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    console.log(`Creating screenshots directory: ${screenshotsDir}`);
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  console.log('Global setup complete');
}