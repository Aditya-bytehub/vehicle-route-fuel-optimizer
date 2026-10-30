require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run set-admin -- user@example.com');
    process.exitCode = 1;
    return;
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error(`No user found for ${email}. Sign up or log in once first.`);
    user.role = 'admin';
    user.status = 'active';
    await user.save();
    console.log(`Admin enabled for ${user.email}. Sign in again to get a fresh session.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
