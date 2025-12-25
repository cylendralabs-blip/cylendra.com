/**
 * OKX Demo Mode Test Script
 * 
 * This script tests OKX API connection in demo mode
 * Run with: deno run --allow-net --allow-env test_okx_demo.ts
 */

// OKX Configuration
const OKX_BASE_URL = 'https://www.okx.com';

interface OKXTestConfig {
    apiKey: string;
    secretKey: string;
    passphrase: string;
    demoMode: boolean;
}

/**
 * Create OKX signature
 */
function createOKXSignature(
    timestamp: string,
    method: string,
    requestPath: string,
    body: string,
    secretKey: string
): string {
    const encoder = new TextEncoder();
    const message = timestamp + method + requestPath + body;
    const key = encoder.encode(secretKey);
    const data = encoder.encode(message);

    return btoa(String.fromCharCode(...new Uint8Array(
        crypto.subtle.signSync('HMAC', { name: 'HMAC', hash: 'SHA-256' }, key, data)
    )));
}

/**
 * Test OKX API connection
 */
async function testOKXConnection(config: OKXTestConfig): Promise<void> {
    console.log('\n=================================');
    console.log(`Testing OKX ${config.demoMode ? 'DEMO' : 'LIVE'} Mode`);
    console.log('=================================\n');

    const timestamp = new Date().toISOString();
    const method = 'GET';
    const requestPath = '/api/v5/account/balance';
    const body = '';

    const signature = createOKXSignature(timestamp, method, requestPath, body, config.secretKey);

    const headers: Record<string, string> = {
        'OK-ACCESS-KEY': config.apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': config.passphrase,
        'Content-Type': 'application/json'
    };

    // Add demo mode header
    if (config.demoMode) {
        headers['x-simulated-trading'] = '1';
        console.log('✓ Demo mode header added: x-simulated-trading=1');
    }

    const url = `${OKX_BASE_URL}${requestPath}`;

    console.log('Request Details:');
    console.log('- URL:', url);
    console.log('- Method:', method);
    console.log('- Timestamp:', timestamp);
    console.log('- API Key:', config.apiKey.substring(0, 10) + '...');
    console.log('- Demo Mode:', config.demoMode);
    console.log('\nHeaders:');
    Object.entries(headers).forEach(([key, value]) => {
        if (key.includes('SIGN') || key.includes('PASSPHRASE')) {
            console.log(`- ${key}: ${value.substring(0, 10)}...`);
        } else {
            console.log(`- ${key}: ${value}`);
        }
    });

    try {
        console.log('\nSending request...\n');

        const response = await fetch(url, {
            method,
            headers
        });

        const responseText = await response.text();

        console.log('Response Status:', response.status);
        console.log('Response Headers:');
        response.headers.forEach((value, key) => {
            console.log(`- ${key}: ${value}`);
        });

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { raw: responseText };
        }

        console.log('\nResponse Body:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok && data.code === '0') {
            console.log('\n✅ SUCCESS: Connection test passed!');
            if (config.demoMode) {
                console.log('✅ Demo mode is working correctly');
            }
        } else {
            console.log('\n❌ FAILED: Connection test failed');
            console.log('Error Code:', data.code);
            console.log('Error Message:', data.msg);

            // Common error codes
            if (data.code === '50111') {
                console.log('\n💡 Tip: Invalid API key or signature');
            } else if (data.code === '50113') {
                console.log('\n💡 Tip: Invalid passphrase');
            } else if (data.code === '50102') {
                console.log('\n💡 Tip: Timestamp error - check system time');
            }
        }
    } catch (error) {
        console.log('\n❌ ERROR:', error.message);
    }

    console.log('\n=================================\n');
}

/**
 * Main test function
 */
async function main() {
    console.log('OKX Demo Mode Connection Test');
    console.log('=============================\n');

    // Get credentials from environment or prompt
    const apiKey = Deno.env.get('OKX_API_KEY') || prompt('Enter OKX API Key:');
    const secretKey = Deno.env.get('OKX_SECRET_KEY') || prompt('Enter OKX Secret Key:');
    const passphrase = Deno.env.get('OKX_PASSPHRASE') || prompt('Enter OKX Passphrase:');

    if (!apiKey || !secretKey || !passphrase) {
        console.error('❌ Missing credentials!');
        Deno.exit(1);
    }

    // Test Demo Mode
    await testOKXConnection({
        apiKey,
        secretKey,
        passphrase,
        demoMode: true
    });

    // Ask if user wants to test live mode
    const testLive = confirm('Do you want to test LIVE mode as well? (Be careful!)');

    if (testLive) {
        await testOKXConnection({
            apiKey,
            secretKey,
            passphrase,
            demoMode: false
        });
    }

    console.log('Test completed!');
}

// Run if this is the main module
if (import.meta.main) {
    main();
}
