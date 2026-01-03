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
    // 🔒 LIMIT CHECK: max 4 active borrows
    const activeBorrowsCount = await Borrow.countDocuments({
      user: req.user.id,
      returnedAt: null,
    });

    if (activeBorrowsCount >= 4) {
      return res.status(403).json({
        message: "Borrow limit reached. You can borrow up to 4 books at a time.",
      });
    }

    const book = await Book.findById(req.params.bookId);
    const card = await LibraryCard.findOne({ user: req.user.id });

    if (!card || card.cardStatus !== "approved") {
      return res.status(403).json({
        message: "Approved library card required to borrow books",
      });
    }

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    book.available -= 1;
    await book.save();

    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt);
    dueAt.setDate(dueAt.getDate() + 30);

    await Borrow.create({
      user: req.user.id,
      book: book._id,
      borrowedAt,
      dueAt,
    });

    res.json({ message: "Book borrowed successfully" });
  } catch (err) {
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
    const history = await Borrow.find({ user: req.user.id })
      .populate("book", "title author isbn")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch history",
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

    if (borrow.user.toString() !== req.user.id) {
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

// GET active borrow count (USER)
router.get("/my/count", authMiddleware, async (req, res) => {
  const count = await Borrow.countDocuments({
    user: req.user._id,
    returnedAt: null,
  });

  res.json({ count });
});


module.exports = router;
