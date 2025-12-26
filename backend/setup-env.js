const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found!');
    process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
const originalContent = envContent;

// 1. Fix Double Assignment (MONGODB_URI=MONGODB_URI=...)
if (envContent.includes('MONGODB_URI=MONGODB_URI=')) {
    console.log('Detected double assignment. Fixing...');
    envContent = envContent.replace('MONGODB_URI=MONGODB_URI=', 'MONGODB_URI=');
}

// 2. Fix Unencoded @ in Password
// Matches: mongodb+srv://user:pass@word@cluster...
// We look for the pattern and check if the password part has an @ that isn't the separator.
// Simplest fix for this specific user case: "naman@123" -> "naman%40123"
if (envContent.includes('naman@123')) {
    console.log('Detected unencoded @ in password. Fixing...');
    envContent = envContent.replace('naman@123', 'naman%40123');
}

if (envContent !== originalContent) {
    fs.writeFileSync(envPath, envContent);
    console.log('SUCCESS: .env file has been automatically fixed! 🚀');
    console.log('You can now run: npm run start:prod');
} else {
    console.log('No issues found or already fixed.');
}
