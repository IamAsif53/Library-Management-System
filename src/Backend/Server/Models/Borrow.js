const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Books",
      required: true,
    },

    // =========================
    // STATUS FLOW
    // =========================
    status: {
      type: String,
      enum: [
        "borrow_requested",
        "borrow_approved",
        "return_requested",
        "returned",
      ],
      default: "borrow_requested",
    },

    // =========================
    // TOKENS (OFFLINE VERIFICATION)
    // =========================
    borrowToken: {
      type: String,
      required: true,
    },

    returnToken: {
      type: String,
      default: null,
    },

    // =========================
    // DATES
    // =========================
    borrowedAt: {
      type: Date,
      default: null, // set ONLY after admin approval
    },

    dueAt: {
      type: Date,
      default: null,
    },

    returnedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    returnApprovedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // FINE SYSTEM (UNCHANGED)
    // =========================
    fineAmount: {
      type: Number,
      default: 0,
    },

    finePaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", borrowSchema);
