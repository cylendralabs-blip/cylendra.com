/**
 * Binance Demo Trading API - Test Script
 * 
 * هذا السكريبت لاختبار Binance Demo Trading API
 * للتأكد من endpoints الصحيحة
 */

// استبدل هذه القيم بمفاتيحك من demo.binance.com
const DEMO_API_KEY = 'YOUR_DEMO_API_KEY';
const DEMO_SECRET_KEY = 'YOUR_DEMO_SECRET_KEY';

// Endpoints المحتملة للاختبار
const ENDPOINTS = {
    // Testnet القديم
    SPOT_TESTNET_OLD: 'https://testnet.binance.vision',
    FUTURES_TESTNET_OLD: 'https://testnet.binancefuture.com',

    // احتمالات Demo Trading الجديد
    DEMO_DIRECT: 'https://demo.binance.com',
    SPOT_TESTNET_NEW: 'https://testnet.binance.vision', // قد يكون نفسه
    FUTURES_TESTNET_NEW: 'https://testnet.binancefuture.com', // قد يكون نفسه
};

async function createSignature(queryString: string, secretKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(queryString)
    );

    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function testEndpoint(name: string, baseUrl: string, path: string) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📍 URL: ${baseUrl}${path}`);

    try {
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}&recvWindow=60000`;
        const signature = await createSignature(queryString, DEMO_SECRET_KEY);

        const url = `${baseUrl}${path}?${queryString}&signature=${signature}`;

        const response = await fetch(url, {
            headers: {
                'X-MBX-APIKEY': DEMO_API_KEY,
            },
        });

        const status = response.status;
        const text = await response.text();

        console.log(`📊 Status: ${status}`);

        if (status === 200) {
            console.log('✅ SUCCESS!');
            console.log('📋 Response:', text.substring(0, 200));
            return { success: true, endpoint: name, url: baseUrl };
        } else {
            console.log('❌ FAILED');
            console.log('📋 Error:', text);

            // تحليل الخطأ
            try {
                const error = JSON.parse(text);
                if (error.code === -1021) {
                    console.log('💡 Hint: Timestamp issue - try adjusting server time');
                } else if (error.code === -2015) {
                    console.log('💡 Hint: Invalid API key or wrong endpoint');
                } else if (error.code === -2014) {
                    console.log('💡 Hint: API key format issue');
                }
            } catch { }

            return { success: false, endpoint: name, error: text };
        }
    } catch (error) {
        console.log('💥 Exception:', error);
        return { success: false, endpoint: name, error: String(error) };
    }
}

async function main() {
    console.log('🚀 Binance Demo Trading API Test');
    console.log('='.repeat(50));

    if (DEMO_API_KEY === 'YOUR_DEMO_API_KEY') {
        console.log('\n❌ Error: Please set your API keys first!');
        console.log('\n📝 Steps:');
        console.log('1. Go to demo.binance.com');
        console.log('2. Create API Key');
        console.log('3. Replace DEMO_API_KEY and DEMO_SECRET_KEY in this file');
        console.log('4. Run: deno run --allow-net test_binance_demo.ts');
        return;
    }

    const results = [];

    // Test Spot endpoints
    console.log('\n📊 Testing SPOT endpoints...');
    results.push(await testEndpoint(
        'Spot Testnet (Old)',
        ENDPOINTS.SPOT_TESTNET_OLD,
        '/api/v3/account'
    ));

    // Test Futures endpoints
    console.log('\n📊 Testing FUTURES endpoints...');
    results.push(await testEndpoint(
        'Futures Testnet (Old)',
        ENDPOINTS.FUTURES_TESTNET_OLD,
        '/fapi/v2/account'
    ));

    // Test server time (no auth needed)
    console.log('\n⏰ Testing server time endpoints...');

    for (const [name, url] of Object.entries(ENDPOINTS)) {
        try {
            const response = await fetch(`${url}/api/v3/time`);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${name}: Server time = ${new Date(data.serverTime).toISOString()}`);
            } else {
                console.log(`❌ ${name}: Server time endpoint failed`);
            }
        } catch {
            console.log(`❌ ${name}: Not accessible`);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY:');
    console.log('='.repeat(50));

    const successful = results.filter(r => r.success);

    if (successful.length > 0) {
        console.log('\n✅ Working endpoints:');
        successful.forEach(r => {
            console.log(`  - ${r.endpoint}: ${r.url}`);
        });
    } else {
        console.log('\n❌ No working endpoints found!');
        console.log('\n💡 Possible reasons:');
        console.log('  1. API Key is for different environment (Live vs Demo)');
        console.log('  2. Binance changed Demo Trading endpoints completely');
        console.log('  3. API Key permissions are wrong');
        console.log('  4. Demo Trading uses different authentication method');
        console.log('\n📝 What to do:');
        console.log('  1. Verify API Key is from demo.binance.com');
        console.log('  2. Check API Key permissions (Enable Reading)');
        console.log('  3. Try creating a new API Key');
        console.log('  4. Contact Binance support for Demo Trading API docs');
    }

    console.log('\n' + '='.repeat(50));
}

// Run
if (import.meta.main) {
    main().catch(console.error);
}
