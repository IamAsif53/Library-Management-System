const express = require("express");
const Book = require("../Models/Books");
const User = require("../Models/User");
const Borrow = require("../Models/Borrow");

const { authMiddleware, isAdmin } = require("../Middleware/authMiddleware");

const router = express.Router();





/* ============================
   GET all books (USER + ADMIN)
   ============================ */
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
        ],
      };
    }

    const books = await Book.find(query);
    return res.json(books);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch books",
      error: err.message,
    });
  }
});

/* ============================
   ADD book (ADMIN ONLY)
   ============================ */
router.post("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category = "",
      quantity = 1,
      available = 1,
    } = req.body;

    // 🔥 VALIDATION
    if (!title || !author || !isbn) {
      return res.status(400).json({
        message: "Title, author and ISBN are required",
      });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      quantity,
      available,
    });

    return res.status(201).json(book);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to add book",
      error: err.message,
    });
  }
});

/* ============================
   DELETE book (ADMIN ONLY)
   ============================ */
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    await book.deleteOne();

    return res.json({
      message: "Book deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete book",
      error: err.message,
    });
  }
});

/* ============================
   ADMIN DASHBOARD STATS
   ============================ */
router.get("/admin/stats", authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBorrows = await Borrow.countDocuments();

    const overdueBorrows = await Borrow.countDocuments({
      returnedAt: null,
      dueAt: { $lt: new Date() },
    });

    const totalFine = overdueBorrows * 10;

    res.json({
      totalBooks,
      totalUsers,
      totalBorrows,
      overdueBorrows,
      totalFine,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch admin stats",
      error: err.message,
    });
  }
});


module.exports = router;
