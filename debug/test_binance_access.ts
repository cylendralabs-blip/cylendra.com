/**
 * Test Binance Geographic Access
 * 
 * Quick script to test if Binance API is accessible from current server location
 * Run with: deno run --allow-net test_binance_access.ts
 */

async function testBinanceAccess() {
    console.log('Testing Binance API Access...\n');

    const tests = [
        { name: 'Binance Live', url: 'https://api.binance.com/api/v3/ping' },
        { name: 'Binance Testnet', url: 'https://testnet.binance.vision/api/v3/ping' },
        { name: 'Binance Futures', url: 'https://fapi.binance.com/fapi/v1/ping' },
    ];

    for (const test of tests) {
        try {
            console.log(`Testing ${test.name}...`);
            const startTime = Date.now();
            const response = await fetch(test.url);
            const endTime = Date.now();

            if (response.ok) {
                console.log(`✅ ${test.name}: Accessible (${endTime - startTime}ms)`);
            } else {
                console.log(`❌ ${test.name}: Failed (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: Error - ${error.message}`);
        }
        console.log('');
    }

    console.log('Test completed!');
    console.log('\nRecommendation:');
    console.log('- If Binance Live fails: Use Binance Testnet for testing');
    console.log('- If all fail: Server may be in restricted region');
}

if (import.meta.main) {
    testBinanceAccess();
}
