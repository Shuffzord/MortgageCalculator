#!/usr/bin/env node

/**
 * E2E Test Runner Script
 *
 * This script runs the Puppeteer end-to-end tests.
 * It handles starting the development server if needed and configuring the test environment.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration interface
interface TestConfig {
  devServerPort: number;
  startDevServer: boolean;
  headless: boolean;
  specs: string[];
  generateReport: boolean;
}

// Configuration
const config: TestConfig = {
  // Default port for the development server
  devServerPort: 3000,
  // Whether to start the dev server (set to false if you already have one running)
  startDevServer: true,
  // Whether to run tests in headless mode
  headless: true,
  // Test specs to run (empty means all specs)
  specs: [],
  // Whether to generate HTML report
  generateReport: false,
};

// Parse command line arguments
process.argv.slice(2).forEach((arg: string) => {
  if (arg === '--no-server') {
    config.startDevServer = false;
  } else if (arg === '--no-headless') {
    config.headless = false;
  } else if (arg.startsWith('--spec=')) {
    config.specs.push(arg.replace('--spec=', ''));
  } else if (arg === '--report') {
    config.generateReport = true;
  }
});

// Store child processes to clean up later
const childProcesses: ChildProcess[] = [];

// Function to start the development server
function startDevServer(): void {
  console.log('Starting development server...');
  
  // Variable to store the detected port
  let detectedPort: number | null = null;
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });
  
  childProcesses.push(serverProcess);
  
  serverProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    console.log(`[Dev Server] ${output}`);
    
    // Extract port from server output
    // Look for patterns like "Local: http://localhost:3001/"
    const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
    if (portMatch && portMatch[1]) {
      detectedPort = parseInt(portMatch[1], 10);
      console.log(`Detected dev server running on port: ${detectedPort}`);
    }
    
    // Also check for port change messages
    const portChangeMatch = output.match(/Port\s+(\d+)\s+is\s+in\s+use,\s+trying\s+another\s+one/);
    if (portChangeMatch && portChangeMatch[1]) {
      const unavailablePort = parseInt(portChangeMatch[1], 10);
      console.log(`Port ${unavailablePort} is in use, server will use another port`);
      
      // If the default port is unavailable, we'll need to wait for the Local: message
      if (unavailablePort === config.devServerPort) {
        console.log(`Default port ${config.devServerPort} is unavailable, waiting for new port detection`);
      }
    }
    
    // Check if server is ready
    if (output.includes('ready in')) {
      // If we've detected a port, use it
      if (detectedPort) {
        console.log(`Development server is ready on port ${detectedPort}!`);
        runTests(detectedPort);
      } else {
        // If we haven't detected a port but the server is ready, use the default port
        // This is a fallback and might not work if the port has changed
        console.log('Development server is ready, but port not detected. Using default port.');
        runTests(config.devServerPort);
      }
    }
  });
  
  serverProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[Dev Server Error] ${data.toString()}`);
  });
  
  serverProcess.on('close', (code: number | null) => {
    console.log(`Development server process exited with code ${code}`);
  });
  
  // Set a timeout in case the server doesn't start properly
  setTimeout(() => {
    console.log('Timeout waiting for dev server, attempting to run tests anyway...');
    runTests();
  }, 10000);
}

// Function to run the tests
function runTests(detectedPort?: number | null): void {
  console.log('Running Puppeteer end-to-end tests...');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Use detected port if available, otherwise fall back to config port
  const port = detectedPort || config.devServerPort;
  console.log(`Using port ${port} for BASE_URL`);
  
  // Store the server output for port detection in setup.ts
  let serverOutput = '';
  if (detectedPort) {
    serverOutput = `Local: http://localhost:${detectedPort}/`;
  }
  
  // Set environment variables for the tests
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    BASE_URL: `http://localhost:${port}`, // Use the dynamically detected port
    DEV_SERVER_OUTPUT: serverOutput, // Pass server output to setup.ts
    HEADLESS: config.headless.toString(),
    NODE_OPTIONS: '--experimental-vm-modules', // Enable ES modules in Jest
    GENERATE_REPORT: config.generateReport.toString(),
  };
  
  // Use Jest to run the tests
  const jestConfigPath = path.resolve(__dirname, 'config', 'jest.config.ts');
  
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
  
  testProcess.on('close', (code: number | null) => {
    console.log(`Test process exited with code ${code}`);
    cleanup();
    process.exit(code || 0);
  });
}

// Function to clean up child processes
function cleanup(): void {
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
  runTests(null);
}