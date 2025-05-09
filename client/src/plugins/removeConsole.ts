import type { Plugin } from 'vite';
import { transformWithEsbuild } from 'vite';

export function removeConsolePlugin(): Plugin {
  return {
    name: 'remove-console',
    enforce: 'post',
    apply: 'build',
    async transform(code, id) {
      // Skip node_modules and test files
      if (id.includes('node_modules') || id.includes('.test.') || id.includes('.spec.')) {
        return;
      }

      // Process all JavaScript/TypeScript files
      if (id.endsWith('.ts') || id.endsWith('.tsx') || id.endsWith('.js') || id.endsWith('.jsx')) {
        return await transformWithEsbuild(code, id, {
          target: 'esnext',
          format: 'esm',
          drop: ['console'], // Removes all console.* calls
          minify: false,
          sourcemap: true,
          legalComments: 'none'
        });
      }
    },
  };
}
