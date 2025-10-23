import fs from 'fs';
import path from 'path';
import { Plugin } from 'vite';

/**
 * Vite plugin to clean the /screenshots folder before build
 */
export function cleanScreenshotsPlugin(): Plugin {
  console.log('🧪 Plugin file loaded'); // This runs at import time
  return {
    name: 'clean-screenshots',
    apply(config, env) {
      console.log('[clean-screenshots] apply hook:', env.command);
      return env.command === 'build';
    },
    buildStart() {
      const screenshotsPath = path.resolve(__dirname, 'client', 'screenshots');

      if (fs.existsSync(screenshotsPath)) {
        for (const file of fs.readdirSync(screenshotsPath)) {
          const filePath = path.join(screenshotsPath, file);
          fs.rmSync(filePath, { recursive: true, force: true });
        }
        console.log('✔ /screenshots folder cleaned');
      } else {
        console.warn('⚠ /screenshots folder does not exist');
      }
    },
  };
}
