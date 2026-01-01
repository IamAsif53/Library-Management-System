// src/Backend/Server/Models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // hashed password
    password: { type: String, required: true },

    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    regNo: { type: String, trim: true },

    // ✅ ADD THIS
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);


// Avoid duplicate model overwrite when hot-reloading
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
