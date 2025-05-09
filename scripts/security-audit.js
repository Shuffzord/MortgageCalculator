import fs from 'fs';
import path from 'path';

const sensitivePatterns = [
    /api[_-]?key/i,
    /auth[_-]?token/i,
    /password/i,
    /secret/i,
    /credential/i,
    /private[_-]?key/i,
    /connection[_-]?string/i,
    /(session|access)[_-]?token/i,
    /\.env/i,
    /console\.log\(/,
];

const excludeDirs = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check each line
    content.split('\n').forEach((line, index) => {
        sensitivePatterns.forEach(pattern => {
            if (pattern.test(line)) {
                issues.push({
                    file: filePath,
                    line: index + 1,
                    content: line.trim(),
                    pattern: pattern.toString()
                });
            }
        });
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

if (issues.length > 0) {
    console.error('\nPotential security issues found:');
    issues.forEach(issue => {
        console.error(`\nFile: ${issue.file}`);
        console.error(`Line ${issue.line}: ${issue.content}`);
        console.error(`Matched pattern: ${issue.pattern}`);
    });
    process.exit(1);
} else {
    console.log('No security issues found.');
    process.exit(0);
}
