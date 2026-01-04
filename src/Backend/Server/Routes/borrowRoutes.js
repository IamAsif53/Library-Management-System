const express = require("express");
const router = express.Router();

const Borrow = require("../Models/Borrow");
const Book = require("../Models/Books");
const LibraryCard = require("../Models/LibraryCard");
const { authMiddleware, isAdmin } = require("../Middleware/authMiddleware");

/* ============================
   BORROW A BOOK
   ============================ */
router.post("/:bookId", authMiddleware, async (req, res) => {
  try {
    // 🔒 BLOCK BORROW IF UNPAID FINE EXISTS (NEW)
    const unpaidFine = await Borrow.exists({
      user: req.user._id,
      fineAmount: { $gt: 0 },
      finePaid: false,
    });

    if (unpaidFine) {
      return res.status(403).json({
        message: "Please clear all fines before borrowing new books",
      });
    }

    // 🔒 LIMIT CHECK: max 4 active borrows
    const activeBorrowsCount = await Borrow.countDocuments({
      user: req.user._id,
      returnedAt: null,
    });

    if (activeBorrowsCount >= 4) {
      return res.status(403).json({
        message:
          "Borrow limit reached. You can borrow up to 4 books at a time.",
      });
    }

    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // 🔐 CHECK APPROVED LIBRARY CARD
    const card = await LibraryCard.findOne({ user: req.user._id });
    if (!card || card.cardStatus !== "approved") {
      return res.status(403).json({
        message: "Approved library card required to borrow books",
      });
    }

    // 🔽 UPDATE BOOK AVAILABILITY
    book.available -= 1;
    await book.save();

    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt);
    dueAt.setDate(dueAt.getDate() + 30);

    // 📘 CREATE BORROW RECORD
    await Borrow.create({
      user: req.user._id,
      book: book._id,
      borrowedAt,
      dueAt,
      fineAmount: 0,
      finePaid: false,
    });

    res.json({ message: "Book borrowed successfully" });
  } catch (err) {
    console.error("Borrow error:", err);
    res.status(500).json({
      message: "Borrow failed",
      error: err.message,
    });
  }
});

/* ============================
   USER BORROW HISTORY
   ============================ */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const history = await Borrow.find({ user: req.user._id })
      .populate("book", "title author isbn")
      .sort({ createdAt: -1 });

    const now = new Date();
    const toUpdate = [];

    for (const borrow of history) {
      if (
        !borrow.returnedAt &&
        borrow.dueAt &&
        borrow.dueAt < now &&
        !borrow.finePaid &&
        borrow.fineAmount !== 10
      ) {
        borrow.fineAmount = 10; // fixed fine per overdue book
        toUpdate.push(borrow);
      }
    }

    // ✅ Save only modified records
    if (toUpdate.length > 0) {
      await Promise.all(toUpdate.map((b) => b.save()));
    }

    res.json(history);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch history",
      error: err.message,
    });
  }
});

/* ============================
   GET ACTIVE BORROW COUNT (USER)
   ============================ */
router.get("/my/count", authMiddleware, async (req, res) => {
  try {
    const count = await Borrow.countDocuments({
      user: req.user._id,
      returnedAt: null,
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch borrow count",
      error: err.message,
    });
  }
});

/* ============================
   ADMIN: ALL BORROWED BOOKS
   ============================ */
router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const borrows = await Borrow.find()
      .populate("book", "title author isbn")
      .populate("user", "email regNo")
      .sort({ createdAt: -1 });

    res.json(borrows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch borrowed books",
      error: err.message,
    });
  }
});

/* ============================
   PAY FINE (USER)
   ============================ */
router.post("/pay-fine/:borrowId", authMiddleware, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.borrowId);

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (borrow.fineAmount === 0) {
      return res.status(400).json({ message: "No fine to pay" });
    }

    borrow.finePaid = true;
    borrow.fineAmount = 0;

    await borrow.save();

    res.json({ message: "Fine paid successfully" });
  } catch (err) {
    res.status(500).json({ message: "Fine payment failed" });
  }
});

/* ============================
   RETURN A BOOK
   ============================ */
router.post("/return/:borrowId", authMiddleware, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.borrowId).populate("book");

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    if (borrow.returnedAt) {
      return res.status(400).json({ message: "Book already returned" });
    }

    // 🔒 BLOCK RETURN IF FINE NOT PAID
    if (borrow.fineAmount > 0 && !borrow.finePaid) {
      return res.status(403).json({
        message: "Please pay the fine before returning the book",
      });
    }

    // 🔐 OWNERSHIP CHECK
    if (borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    borrow.returnedAt = new Date();
    await borrow.save();

    borrow.book.available += 1;
    await borrow.book.save();

    res.json({ message: "Book returned successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Return failed",
      error: err.message,
    });
  }
});

module.exports = router;
