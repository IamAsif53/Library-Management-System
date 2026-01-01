const mongoose = require("mongoose");

const libraryCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one card per user
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      required: true,
      trim: true,
    },

    term: {
      type: String,
      required: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      default: "demo",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "paid", // demo payment
    },

    cardStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LibraryCard", libraryCardSchema);
