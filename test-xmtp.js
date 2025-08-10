const dotenv = require('dotenv');
dotenv.config();

// Simple test to check environment variables
console.log('Environment Check:');
console.log('WALLET_PRIVATE_KEY exists:', !!process.env.WALLET_PRIVATE_KEY);
console.log('ENCRYPTION_KEY exists:', !!process.env.ENCRYPTION_KEY);
console.log('XMTP_ENV:', process.env.XMTP_ENV);
console.log('CDP_API_KEY_ID exists:', !!process.env.CDP_API_KEY_ID);

// Check if wallet key is valid format
if (process.env.WALLET_PRIVATE_KEY) {
  const key = process.env.WALLET_PRIVATE_KEY;
  console.log('Wallet key format valid:', key.startsWith('0x') && key.length === 66);
}

// Check if encryption key is valid format  
if (process.env.ENCRYPTION_KEY) {
  const key = process.env.ENCRYPTION_KEY;
  console.log('Encryption key format valid:', key.startsWith('0x') && key.length === 66);
}