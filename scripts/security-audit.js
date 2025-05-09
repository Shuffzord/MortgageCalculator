import fs from 'fs';
import path from 'path';

const safePatterns = {
    githubSecrets: /\$\{\{\s*secrets\.[A-Z_]+[A-Z0-9_]*\s*\}\}/,  // GitHub Actions secrets syntax (allow numbers)
    importMeta: /import\.meta\.env/,                               // Vite's import.meta.env usage
    processEnv: /process\.env\.[A-Z_]+/                           // Node.js process.env usage
};

// Patterns for security sensitive items
const securityPatterns = [
    {
        pattern: /api[_-]?key/i,
        exclude: [safePatterns.githubSecrets]
    },
    {
        pattern: /auth[_-]?token/i,
        exclude: [safePatterns.githubSecrets]
    },
    {
        pattern: /password/i,
        exclude: [safePatterns.githubSecrets]
    },
    {
        pattern: /secret/i,
        exclude: [safePatterns.githubSecrets]
    },    {
        pattern: /credential/i,
        exclude: [safePatterns.githubSecrets, /credentials:\s*["']include["']/]
    },
    {
        pattern: /private[_-]?key/i,
        exclude: [safePatterns.githubSecrets]
    },
    {
        pattern: /connection[_-]?string/i,
        exclude: [safePatterns.githubSecrets, /\"connectionStrings\":\s*\[\]/]
    },
    {
        pattern: /(session|access)[_-]?token/i,
        exclude: [safePatterns.githubSecrets]
    },
    {
        pattern: /\.env/i,
        exclude: [safePatterns.importMeta, safePatterns.processEnv]
    }
];

// Console log pattern, handled separately to exclude test files
const consolePattern = /console\.(log|info|debug|warn)\(/;

const excludeDirs = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
];

const excludeFiles = [
    'security-audit.js',
    'check-console-logs.js',
    'package.json',
    'package-lock.json',
    'pre-build-checks.js'
];

function isTestFile(filePath) {
    return filePath.match(/\.(test|spec)\.[jt]sx?$/) ||
           filePath.includes('__tests__') ||
           filePath.includes('/test/') ||
           filePath.includes('/tests/');
}

function isGitHubWorkflow(filePath) {
    return filePath.includes('.github/workflows/') && 
           (filePath.endsWith('.yml') || filePath.endsWith('.yaml'));
}

function scanFile(filePath) {
    // Skip excluded files
    const fileName = path.basename(filePath);
    if (excludeFiles.includes(fileName)) return [];
    
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const isTest = isTestFile(filePath);
    const isWorkflow = isGitHubWorkflow(filePath);

    // Check each line
    content.split('\n').forEach((line, index) => {
        // Check security patterns for all files
        securityPatterns.forEach(({ pattern, exclude }) => {
            if (pattern.test(line)) {
                // Always apply GitHub secrets exclusion in workflow files
                const customExcludes = isWorkflow ? 
                    [...exclude, safePatterns.githubSecrets] : 
                    exclude;
                    
                // Check if this is an allowed usage
                const isExcluded = customExcludes.some(excludePattern => excludePattern.test(line));
                if (!isExcluded) {
                    issues.push({
                        file: filePath,
                        line: index + 1,
                        content: line.trim(),
                        pattern: pattern.toString(),
                        type: 'security'
                    });
                }
            }
        });

        // Check console.log only for non-test files
        if (!isTest && consolePattern.test(line)) {
            issues.push({
                file: filePath,
                line: index + 1,
                content: line.trim(),
                pattern: consolePattern.toString(),
                type: 'console'
            });
        }
    });

    return issues;
}

function scanDir(dir) {
    let issues = [];

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        
        // Skip excluded directories
        if (excludeDirs.includes(item)) continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            issues = issues.concat(scanDir(fullPath));
        } else if (stat.isFile() && /\.(js|ts|jsx|tsx|json|env|yaml|yml)$/.test(item)) {
            issues = issues.concat(scanFile(fullPath));
        }
    }

    return issues;
}

const issues = scanDir(process.cwd());

// Separate issues by type
const securityIssues = issues.filter(issue => issue.type === 'security');
const consoleIssues = issues.filter(issue => issue.type === 'console');

let hasIssues = false;

if (securityIssues.length > 0) {
    console.error('\n🚨 Security issues found:');
    securityIssues.forEach(issue => {
        console.error(`\nFile: ${issue.file}`);
        console.error(`Line ${issue.line}: ${issue.content}`);
        console.error(`Matched pattern: ${issue.pattern}`);
    });
    hasIssues = true;
}

if (consoleIssues.length > 0) {
    console.error('\n⚠️  Console statements found in non-test files:');
    consoleIssues.forEach(issue => {
        console.error(`\nFile: ${issue.file}`);
        console.error(`Line ${issue.line}: ${issue.content}`);
    });
    hasIssues = true;
}

if (hasIssues) {
    process.exit(1);
} else {
    console.log('✅ No security issues or unauthorized console statements found.');
    process.exit(0);
}
