const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dysh-backend-secret-key'; // Default JWT secret from the app
const testUserId = 'clsnwls300000db0inegmrp65q'; // Test user ID

function generateToken(userId) {
  return jwt.sign(
    { sub: userId, email: 'testuser@example.com' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const token = generateToken(testUserId);

console.log('🔑 Fresh JWT Token Generated:');
console.log('');
console.log(token);
console.log('');
console.log('📋 Usage:');
console.log(`Authorization: Bearer ${token}`);
console.log('');
console.log('⏰ Expires: 24 hours from now');
console.log('👤 User ID:', testUserId);
console.log('📧 Email: testuser@example.com'); 