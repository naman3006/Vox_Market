require('dotenv').config();

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.log('ERROR: MONGODB_URI is undefined or empty');
    return;
}

console.log('--- DEBUGGING MONGODB_URI ---');
console.log(`Length: ${uri.length}`);
console.log(`First 12 chars: "${uri.substring(0, 12)}"`);
console.log(`Last 5 chars: "${uri.substring(uri.length - 5)}"`);
console.log(`Contains whitespace? ${/\s/.test(uri) ? 'YES' : 'NO'}`);
console.log(`Starts with "mongodb://"? ${uri.startsWith('mongodb://')}`);
console.log(`Starts with "mongodb+srv://"? ${uri.startsWith('mongodb+srv://')}`);
console.log(`Contains quotes? ${/["']/.test(uri) ? 'YES' : 'NO'}`);

if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.log('CRITICAL ERROR: Invalid Protocol/Scheme. Must start with mongodb:// or mongodb+srv://');
}

if (/\s/.test(uri)) {
    console.log('CRITICAL ERROR: Contains illegal whitespace/spaces.');
}

console.log('--- END DEBUG ---');
