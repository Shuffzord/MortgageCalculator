require('dotenv').config();
const { spawn } = require('child_process');

console.log('Loaded environment variables:', Object.keys(process.env));

const emulator = spawn('firebase', ['emulators:start', '--only', 'functions'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

emulator.on('error', (error) => {
  console.error(`Error starting emulator: ${error}`);
  process.exit(1);
});

emulator.on('close', (code) => {
  console.log(`Emulator process exited with code ${code}`);
  process.exit(code);
});