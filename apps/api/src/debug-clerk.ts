
import 'dotenv/config';
import { clerkClient } from '@clerk/clerk-sdk-node';

async function testConnection() {
    console.log('Testing Clerk Connectivity...');
    console.log('Secret Key (masked):', process.env.CLERK_SECRET_KEY ? 'Present starts with ' + process.env.CLERK_SECRET_KEY.substring(0, 5) : 'Missing');

    try {
        // Try to fetch the client list (or any simple reading operation)
        // Or just check if we can verify a dummy token (which should fail with invalid token, not fetch failed)
        console.log('Attempting to get user count (simple API call)...');
        const count = await clerkClient.users.getCount();
        console.log('Success! Connected to Clerk.');
        console.log('User count:', count);
    } catch (error) {
        console.error('Connection Failed!');
        // Log full error details
        console.error(error);
    }
}

testConnection();
