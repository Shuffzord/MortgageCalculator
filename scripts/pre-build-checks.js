import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
