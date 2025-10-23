import fs from 'fs';
import path from 'path';

const excludeDirs = ['node_modules', 'dist', 'build', 'coverage'];

// Files that are allowed to have console logs
const allowedPatterns = [
  /\.(test|spec)\.[jt]sx?$/, // Test files
  /\.(script|config|setup)\.[jt]sx?$/, // Development and config scripts
  /[\\/](test|tests|__tests__)[\\/]/, // Test directories
  /[\\/](e2e|e2e-tests)[\\/]/, // E2E tests
  /[\\/]scripts[\\/]/, // Scripts directory
  /[\\/]cleanscreenshots\.ts$/, // Local dev-only Vite helper
  /[\\/]cypress[\\/]/, // Cypress test files
  /[\\/]jest[\\/]/, // Jest configuration
  /vite\.config\.[jt]s/, // Vite config
  /jest\.config\.[jt]s/, // Jest config
  /tailwind\.config\.[jt]s/, // Tailwind config
  /postcss\.config\.[jt]s/, // PostCSS config
  /webpack\.config\.[jt]s/, // Webpack config
  /next\.config\.[jt]s/, // Next.js config
  /tsconfig\.json$/, // TypeScript config
  /package\.json$/, // Package.json (for scripts)
];

function isAllowedFile(filePath) {
  return allowedPatterns.some((pattern) => pattern.test(filePath));
}

function scanFile(filePath) {
  // Skip files that are allowed to have console logs
  if (isAllowedFile(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  let inHmrBlock = false;
  let previousLine = '';

  lines.forEach((line, index) => {
    // Check for HMR block start
    if (line.includes('if (import.meta.hot)') || line.includes('import.meta.hot')) {
      inHmrBlock = true;
    }

    // Check for block end
    if (inHmrBlock && line.includes('}')) {
      inHmrBlock = false;
    }

    // Skip if we're in an HMR block
    if (inHmrBlock) return;

    // Skip if previous line has an allow comment
    if (
      previousLine.includes('// @allow-console') ||
      previousLine.includes('/* @allow-console */')
    ) {
      previousLine = line;
      return;
    }

    if (
      line.includes('console.log(') ||
      line.includes('console.info(') ||
      line.includes('console.debug(') ||
      line.includes('console.warn(')
    ) {
      issues.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
      });
    }

    previousLine = line;
  });

  return issues;
}

function scanDir(dir) {
  let issues = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (excludeDirs.includes(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      issues = issues.concat(scanDir(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
      issues = issues.concat(scanFile(fullPath));
    }
  }

  return issues;
}

// Start scan from current directory
const issues = scanDir(process.cwd());

if (issues.length > 0) {
  console.error('\nFound console.log statements:');
  issues.forEach((issue) => {
    console.error(`\nFile: ${issue.file}`);
    console.error(`Line ${issue.line}: ${issue.content}`);
  });
  process.exit(1);
} else {
  console.log('No console.log statements found.');
  process.exit(0);
}
