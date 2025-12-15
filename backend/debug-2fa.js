
const { authenticator } = require('otplib');

const email = '21ce07naman@gmail.com';
const appName = 'E-Commerce App';
const secret = authenticator.generateSecret();

const otpauthUrl = authenticator.keyuri(
    email,
    appName,
    secret,
);

console.log('Secret:', secret);
console.log('URL:', otpauthUrl);
