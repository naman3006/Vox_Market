const http = require('http');

// Helper for POST request
function post(path, data, token = null) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const parsed = JSON.parse(body);
                        resolve(parsed);
                    } else {
                        resolve({ error: true, status: res.statusCode, body: body });
                    }
                } catch (e) {
                    console.error("Parse error", e);
                    resolve({ error: true, parseError: e.message, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function run() {
    const email = `testbot${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Registering user ${email}...`);
    const regRes = await post('/auth/register', {
        name: 'Test Bot',
        email,
        password
    });

    if (regRes.error) {
        // If user exists error, try login
        console.log('Registration might have failed or user exists, trying login anyway...');
    }

    console.log('Logging in...');
    const loginRes = await post('/auth/login', { email, password });

    // Adjusted for response structure: { data: { token: '...' } }
    if (loginRes.error || !loginRes.data || !loginRes.data.token) {
        console.error('Login failed (or unexpected structure):', JSON.stringify(loginRes, null, 2));
        return;
    }

    const token = loginRes.data.token;
    console.log('Got token. Testing Chatbot...');

    // Test 1: Product Search Intent
    console.log('\n--- Test 1: Query: "price of Samsung" ---');
    const chatRes = await post('/chatbot/message', {
        message: 'What is the price of Samsung?',
        history: []
    }, token);
    console.log('Response:', JSON.stringify(chatRes, null, 2));

    // Test 2: Cart Intent
    console.log('\n--- Test 2: Query: "What is in my cart?" ---');
    const chatResCart = await post('/chatbot/message', {
        message: 'What is in my cart?',
        history: []
    }, token);
    console.log('Response:', JSON.stringify(chatResCart, null, 2));

    // Test 3: Profile Intent
    console.log('\n--- Test 3: Query: "Who am I?" ---');
    const chatResProfile = await post('/chatbot/message', {
        message: 'Who am I?',
        history: []
    }, token);
    console.log('Response:', JSON.stringify(chatResProfile, null, 2));

    // Test 4: Coupon Intent
    console.log('\n--- Test 4: Query: "Any coupons?" ---');
    const chatResCoupon = await post('/chatbot/message', {
        message: 'Do you have any active coupons?',
        history: []
    }, token);
    console.log('Response:', JSON.stringify(chatResCoupon, null, 2));
}

run().catch(console.error);
