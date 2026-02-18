const { dispatchProcessing } = require('./services/universalProcessor');
const path = require('path');
const fs = require('fs').promises;

async function verify() {
    console.log('--- Universal Pipeline Verification ---');

    // Create a dummy text file
    const testPath = path.join(__dirname, 'temp', 'verify_test.txt');
    try {
        await fs.mkdir(path.dirname(testPath), { recursive: true });
        await fs.writeFile(testPath, 'This is a test document for verification.');

        console.log('1. Testing Text Processing...');
        const results = await dispatchProcessing(testPath, 'text/plain');
        console.log('   Status: SUCCESS');
        console.log('   Result Pages:', results.length);
        console.log('   Sample Text:', results[0].text.substring(0, 30));

        console.log('\n2. Testing Fallback (Unknown Format)...');
        const binaryPath = path.join(__dirname, 'temp', 'verify_test.bin');
        await fs.writeFile(binaryPath, Buffer.from([0x00, 0x01, 0x02, 0x03]));
        const resultsFallback = await dispatchProcessing(binaryPath, 'application/octet-stream');
        console.log('   Status: SUCCESS');
        console.log('   Sample Text:', resultsFallback[0].text.substring(0, 50).replace(/\n/g, ' '));

        console.log('\n--- Status: System Verified ---');

        // Clean up
        await fs.unlink(testPath);
        await fs.unlink(binaryPath);
    } catch (error) {
        console.error('\n--- Status: Verification FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

verify();
