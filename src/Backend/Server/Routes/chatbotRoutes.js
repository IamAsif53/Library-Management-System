const express = require("express");
const router = express.Router();
const openai = require("../Utils/openai");

const { authMiddleware } = require("../Middleware/authMiddleware");
const Book = require("../Models/Books");
const Borrow = require("../Models/Borrow");
const LibraryCard = require("../Models/LibraryCard");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userMessage = req.body.message;

    // =========================
    // 📚 FETCH USER CONTEXT
    // =========================
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ available: { $gt: 0 } });

    const activeBorrows = await Borrow.countDocuments({
      user: req.user.id,
      returnedAt: null,
    });

    const card = await LibraryCard.findOne({ user: req.user.id });

    // =========================
    // 🧠 SYSTEM PROMPT (VERY IMPORTANT)
    // =========================
    const systemPrompt = `
You are a helpful AI librarian for CUET Central Library.

Library Rules:
- A user can borrow at most 4 books
- Borrow duration: 30 days
- Fine: 10 TK per overdue book
- Library card approval required before borrowing

User Info:
- Active borrows: ${activeBorrows}
- Library card status: ${card ? card.cardStatus : "not applied"}
- Total books in library: ${totalBooks}
- Available books: ${availableBooks}

Answer clearly, briefly, and politely.
If the question is unrelated to library services, politely refuse.
`;

    // =========================
    // 🤖 OPENAI CHAT COMPLETION
    // =========================
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      reply: "⚠️ Sorry, I’m having trouble responding right now.",
    });
  }
});

module.exports = router;
