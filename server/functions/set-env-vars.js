const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    acc[key.trim()] = value.trim();
  }
  return acc;
}, {});

Object.entries(envVars).forEach(([key, value]) => {
  try {
    execSync(`firebase functions:config:set ${key.toLowerCase()}="${value}"`);
    console.log(`Set ${key} successfully`);
  } catch (error) {
    console.error(`Failed to set ${key}: ${error.message}`);
  }
});

console.log('Environment variables set in Firebase config');