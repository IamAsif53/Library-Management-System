const express = require("express");
const router = express.Router();

const Borrow = require("../Models/Borrow");
const Book = require("../Models/Books");
const LibraryCard = require("../Models/LibraryCard");
const { authMiddleware, isAdmin } = require("../Middleware/authMiddleware");

function generateToken(prefix = "BR") {
  return (
    prefix +
    "-" +
    Date.now().toString().slice(-6) +
    "-" +
    Math.floor(100 + Math.random() * 900)
  );
}

/* ============================
   BORROW A BOOK
   ============================ */
router.post("/:bookId", authMiddleware, async (req, res) => {
  try {
    // 🔒 CHECK UNPAID FINE
    const unpaidFine = await Borrow.exists({
      user: req.user._id,
      fineAmount: { $gt: 0 },
      finePaid: false,
    });

    if (unpaidFine) {
      return res.status(403).json({
        message: "Please clear all fines before requesting a book",
      });
    }

    // 🔒 CHECK ACTIVE BORROWS (APPROVED ONLY)
    const activeBorrows = await Borrow.countDocuments({
      user: req.user._id,
      status: "borrow_approved",
      returnedAt: null,
    });

    if (activeBorrows >= 4) {
      return res.status(403).json({
        message: "Borrow limit reached (4 books)",
      });
    }

    // 🔐 CHECK APPROVED LIBRARY CARD
    const card = await LibraryCard.findOne({ user: req.user._id });
    if (!card || card.cardStatus !== "approved") {
      return res.status(403).json({
        message: "Approved library card required",
      });
    }

    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // 🔒 PREVENT DUPLICATE PENDING REQUEST
    const existingRequest = await Borrow.findOne({
      user: req.user._id,
      book: book._id,
      status: { $in: ["borrow_requested", "borrow_approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending or active request for this book",
      });
    }

    // 🎟️ GENERATE BORROW TOKEN
    const borrowToken = generateToken("BR");

    // 📘 CREATE BORROW REQUEST (NOT BORROW)
    const borrow = await Borrow.create({
      user: req.user._id,
      book: book._id,
      status: "borrow_requested",
      borrowToken,
    });

    res.status(201).json({
      message: "Borrow request sent successfully",
      token: borrowToken,
      borrowId: borrow._id,
      status: borrow.status,
    });
  } catch (err) {
    console.error("Borrow request error:", err);
    res.status(500).json({
      message: "Failed to send borrow request",
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

/* ============================
   ADMIN: VIEW BORROW REQUESTS
   ============================ */
router.get(
  "/admin/borrow-requests",
  authMiddleware,
  isAdmin,
  async (req, res) => {
    try {
      const requests = await Borrow.find({
        status: "borrow_requested",
      })
        .populate("user", "name email regNo")
        .populate("book", "title author isbn")
        .sort({ createdAt: 1 });

      res.json(requests);
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch borrow requests",
      });
    }
  }
);

/* ============================
   ADMIN: APPROVE BORROW
   ============================ */
router.post(
  "/admin/approve/:borrowId",
  authMiddleware,
  isAdmin,
  async (req, res) => {
    try {
      const borrow = await Borrow.findById(req.params.borrowId).populate(
        "book"
      );

      if (!borrow) {
        return res.status(404).json({
          message: "Borrow request not found",
        });
      }

      if (borrow.status !== "borrow_requested") {
        return res.status(400).json({
          message: "This request is not pending approval",
        });
      }

      if (borrow.book.available <= 0) {
        return res.status(400).json({
          message: "Book is no longer available",
        });
      }

      // 📉 DECREASE BOOK AVAILABILITY (ONLY NOW!)
      borrow.book.available -= 1;
      await borrow.book.save();

      // 📅 SET BORROW & DUE DATE
      const borrowedAt = new Date();
      const dueAt = new Date(borrowedAt);
      dueAt.setDate(dueAt.getDate() + 30);

      borrow.status = "borrow_approved";
      borrow.borrowedAt = borrowedAt;
      borrow.dueAt = dueAt;
      borrow.approvedAt = new Date();

      await borrow.save();

      res.json({
        message: "Borrow approved successfully",
        dueAt,
      });
    } catch (err) {
      console.error("Approve borrow error:", err);
      res.status(500).json({
        message: "Failed to approve borrow",
      });
    }
  }
);

/* ============================
   USER: REQUEST RETURN
   ============================ */
router.post("/request-return/:borrowId", authMiddleware, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.borrowId);

    if (!borrow) {
      return res.status(404).json({
        message: "Borrow record not found",
      });
    }

    if (borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (borrow.status !== "borrow_approved") {
      return res.status(400).json({
        message: "Return request not allowed for this status",
      });
    }

    // 🎟️ GENERATE RETURN TOKEN
    const returnToken = generateToken("RT");

    borrow.status = "return_requested";
    borrow.returnToken = returnToken;

    await borrow.save();

    res.json({
      message: "Return request sent successfully",
      returnToken,
    });
  } catch (err) {
    console.error("Return request error:", err);
    res.status(500).json({
      message: "Failed to request return",
    });
  }
});

/* ============================
   ADMIN: VIEW RETURN REQUESTS
   ============================ */
router.get(
  "/admin/return-requests",
  authMiddleware,
  isAdmin,
  async (req, res) => {
    try {
      const requests = await Borrow.find({
        status: "return_requested",
      })
        .populate("user", "name email regNo")
        .populate("book", "title author isbn")
        .sort({ updatedAt: 1 });

      res.json(requests);
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch return requests",
      });
    }
  }
);


/* ============================
   ADMIN: CONFIRM RETURN
   ============================ */
router.post(
  "/admin/confirm-return/:borrowId",
  authMiddleware,
  isAdmin,
  async (req, res) => {
    try {
      const borrow = await Borrow.findById(req.params.borrowId).populate("book");

      if (!borrow) {
        return res.status(404).json({
          message: "Borrow record not found",
        });
      }

      if (borrow.status !== "return_requested") {
        return res.status(400).json({
          message: "This borrow is not pending return confirmation",
        });
      }

      // 🔁 INCREASE BOOK AVAILABILITY
      borrow.book.available += 1;
      await borrow.book.save();

      borrow.status = "returned";
      borrow.returnedAt = new Date();
      borrow.returnApprovedAt = new Date();

      await borrow.save();

      res.json({
        message: "Book return confirmed successfully",
      });
    } catch (err) {
      console.error("Confirm return error:", err);
      res.status(500).json({
        message: "Failed to confirm return",
      });
    }
  }
);


module.exports = router;
