import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Function to generate build info file
async function generateBuildInfo() {
    try {
        console.log('\n📝 Generating build information...');
        
        // Get current timestamp in ISO format
        const timestamp = new Date().toISOString();
        
        // Try to read version from package.json
        let version = '1.0.0';
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            version = packageJson.version || '1.0.0';
        } catch (error) {
            console.warn('⚠️ Could not read version from package.json, using default version');
        }
        
        // Create build info content
        const buildInfoContent = `// This file is auto-generated during build. Do not edit directly.
window.BUILD_INFO = {
  timestamp: "${timestamp}",
  version: "${version}"
};`;
        
        // Ensure public directory exists
        try {
            await fs.mkdir('client\\public', { recursive: true });
        } catch (error) {
            // Directory might already exist, ignore error
        }
        
        // Write to output file
        await fs.writeFile(path.join('client\\public', 'build-info.js'), buildInfoContent, 'utf8');
        
        console.log(`✅ Build info generated with timestamp: ${timestamp} and version: ${version}`);
        return true;
    } catch (error) {
        console.error('\n❌ Failed to generate build info:');
        console.error(error.message);
        return false;
    }
}

async function runChecks() {
    try {
        // Run security audit
        console.log('\n🔒 Running security audit...');
        const securityResult = await execAsync('node scripts/security-audit.js').catch(e => ({ stderr: e.message }));
        if (securityResult.stderr) {
            console.error('\n❌ Security audit failed:');
            console.error(securityResult.stderr);
            process.exit(1);
        }
        console.log('✅ Security audit passed');

        // Run console.log check
        console.log('\n🔍 Checking for console.log statements...');
        const logsResult = await execAsync('node scripts/check-console-logs.js').catch(e => ({ stderr: e.message }));
        if (logsResult.stderr) {
            console.error('\n❌ Console.log check failed:');
            console.error(logsResult.stderr);
            console.error('\nPlease remove console.logs from production code.');
            console.error('You can:');
            console.error('1. Remove the console.log statements');
            console.error('2. Move them to test files');
            console.error('3. Add // @allow-console comment above necessary logs');
            process.exit(1);
        }
        console.log('✅ No unauthorized console.log statements found');
        
        // Generate build info file
        const buildInfoSuccess = await generateBuildInfo();
        if (!buildInfoSuccess) {
            console.error('\n❌ Build info generation failed');
            process.exit(1);
        }

        console.log('\n✨ All pre-build checks passed!');
        console.log('🚀 Ready to build...\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Pre-build checks failed with an unexpected error:');
        console.error(error.message);
        process.exit(1);
    }
}

runChecks();