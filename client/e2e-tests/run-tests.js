#!/usr/bin/env node

/**
 * E2E Test Runner Script
 *
 * This script runs the Puppeteer end-to-end tests.
 * It handles starting the development server if needed and configuring the test environment.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Default port for the development server
  devServerPort: 5173,
  // Whether to start the dev server (set to false if you already have one running)
  startDevServer: true,
  // Whether to run tests in headless mode
  headless: true,
  // Test specs to run (empty means all specs)
  specs: [],
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg === '--no-server') {
    config.startDevServer = false;
  } else if (arg === '--no-headless') {
    config.headless = false;
  } else if (arg.startsWith('--spec=')) {
    config.specs.push(arg.replace('--spec=', ''));
  }
});

// Store child processes to clean up later
const childProcesses = [];

// Function to start the development server
function startDevServer() {
  console.log('Starting development server...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });
  
  childProcesses.push(serverProcess);
  
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Dev Server] ${output}`);
    
    // Check if server is ready
    if (output.includes('Local:') || output.includes('ready in')) {
      console.log('Development server is ready!');
      runTests();
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[Dev Server Error] ${data.toString()}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Development server process exited with code ${code}`);
  });
  
  // Set a timeout in case the server doesn't start properly
  setTimeout(() => {
    console.log('Timeout waiting for dev server, attempting to run tests anyway...');
    runTests();
  }, 10000);
}

// Function to run the tests
function runTests() {
  console.log('Running Puppeteer end-to-end tests...');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Set environment variables for the tests
  const env = {
    ...process.env,
    BASE_URL: `http://localhost:3000`, // Use the port that the dev server is actually using
    HEADLESS: config.headless.toString(),
    NODE_OPTIONS: '--experimental-vm-modules', // Enable ES modules in Jest
  };
  
  // Use Jest to run the tests
  const jestConfigPath = path.resolve(__dirname, 'config', 'jest.config.js');
  
  // Build the Jest command
  let command = `npx jest --config ${jestConfigPath}`;
  
  // Add specific test files if provided
  if (config.specs.length > 0) {
    const specPaths = config.specs.map(spec => path.resolve(__dirname, spec));
    command += ` ${specPaths.join(' ')}`;
  }
  
  console.log(`Executing: ${command}`);
  
  // Run the tests
  const testProcess = spawn(command, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env,
  });
  
  childProcesses.push(testProcess);
  
  testProcess.on('close', (code) => {
    console.log(`Test process exited with code ${code}`);
    cleanup();
    process.exit(code);
  });
}

// Function to clean up child processes
function cleanup() {
  console.log('Cleaning up...');
  childProcesses.forEach(proc => {
    if (!proc.killed) {
      proc.kill();
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Cleaning up and exiting...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Cleaning up and exiting...');
  cleanup();
  process.exit(0);
});

// Start the process
if (config.startDevServer) {
  startDevServer();
} else {
  console.log('Skipping dev server start, assuming it\'s already running...');
  runTests();
}