
import 'dotenv/config';
const fetch = require('node-fetch');

async function testNetwork() {
    console.log('--- Network Connectivity Test (node-fetch) ---');

    // 1. Test external public site (Google)
    try {
        console.log('1. Pinging google.com...');
        const res = await fetch('https://www.google.com');
        console.log(`   Result: ${res.status} ${res.statusText}`);
    } catch (e) {
        console.error('   Failed:', (e as Error).message);
    }

    // 2. Test Clerk API endpoint directly
    try {
        console.log('\n2. Pinging api.clerk.com...');
        const res = await fetch('https://api.clerk.com/v1/public/environment', {
            headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
            }
        });
        console.log(`   Result: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`   Response start: ${text.substring(0, 100)}...`);
    } catch (e) {
        console.error('   Clerk Fetch Failed:', (e as Error).message);
    }
}

testNetwork();
