// set-password-single.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./Models/User'); // path correct for your layout

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const emailArg = process.argv[2];
const newPass = process.argv[3];

if (!MONGO_URI) {
  console.error('❌ Set MONGO_URI environment variable first.');
  process.exit(1);
}
if (!emailArg || !newPass) {
  console.error('❌ Usage: node set-password-single.js "email" "NewPassword123!"');
  process.exit(2);
}

async function run() {
  try {
    // Connect without legacy options
    await mongoose.connect(MONGO_URI);

    const email = String(emailArg).trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      console.error('❌ User not found:', email);
      process.exit(3);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPass, salt);
    await user.save();

    console.log('✅ Password updated for:', email);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
}

run();
