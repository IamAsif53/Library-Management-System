const express = require("express");
const router = express.Router();

const LibraryCard = require("../Models/LibraryCard");
const { authMiddleware, isAdmin } = require("../Middleware/authMiddleware");

/* ============================
   USER: APPLY FOR LIBRARY CARD
   ============================ */
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { name, department, level, term, paymentMethod } = req.body;

    if (!name || !department || !level || !term) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // prevent duplicate card
    const existing = await LibraryCard.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({
        message: "Library card already applied",
      });
    }

    const card = await LibraryCard.create({
      user: req.user.id,
      name,
      department,
      level,
      term,
      paymentMethod,
      paymentStatus: "paid", // demo
      cardStatus: "pending",
    });

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({
      message: "Failed to apply for library card",
      error: err.message,
    });
  }
});

/* ============================
   ADMIN: VIEW PENDING CARDS
   ============================ */
router.get("/pending", authMiddleware, isAdmin, async (req, res) => {
  try {
    const pendingCards = await LibraryCard.find({
      cardStatus: "pending",
    }).populate("user", "email regNo");

    res.json(pendingCards);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch pending cards",
      error: err.message,
    });
  }
});

/* ============================
   ADMIN: APPROVE LIBRARY CARD
   ============================ */
router.post("/approve/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const card = await LibraryCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: "Library card not found" });
    }

    card.cardStatus = "approved";
    card.approvedAt = new Date();

    await card.save();

    res.json({ message: "Library card approved" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to approve library card",
      error: err.message,
    });
  }
});

/* ============================
   USER: MY LIBRARY CARD STATUS
   ============================ */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const card = await LibraryCard.findOne({ user: req.user.id });
    if (!card) return res.json({ cardStatus: "none" });

    res.json({ cardStatus: card.cardStatus });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch card status" });
  }
});


module.exports = router;
