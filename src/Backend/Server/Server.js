require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express(); // ✅ app must be before app.use()

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

// ================== ENV ==================
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "";

// ================== ROUTES ==================

// Load user routes safely
let userRoutes = null;
try {
  userRoutes = require("./Routes/userRoutes");
  console.log("✅ userRoutes loaded successfully");
} catch (err) {
  console.error("❌ Failed to load ./Routes/userRoutes:", err.message);
}

// Load book routes safely
let bookRoutes = null;
try {
  bookRoutes = require("./Routes/booksRoutes");
  console.log("✅ booksRoutes loaded successfully");
} catch (err) {
  console.error("❌ Failed to load ./Routes/booksRoutes:", err.message);
}

// Load borrow routes safely
let borrowRoutes = null;
try {
  borrowRoutes = require("./Routes/borrowRoutes");
  console.log("✅ borrowRoutes loaded successfully");
} catch (err) {
  console.error("❌ Failed to load ./Routes/borrowRoutes:", err.message);
}

// Load library card routes safely
let libraryCardRoutes = null;
try {
  libraryCardRoutes = require("./Routes/libraryCardRoutes");
  console.log("✅ libraryCardRoutes loaded");
} catch (err) {
  console.error("❌ Failed to load libraryCardRoutes:", err.message);
}

// 🔥 Load chatbot routes safely (FIXED)
let chatbotRoutes = null;
try {
  chatbotRoutes = require("./Routes/chatbotRoutes");
  console.log("✅ chatbotRoutes loaded");
} catch (err) {
  console.error("❌ Failed to load chatbotRoutes:", err.message);
}

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("Backend: server boot ok");
});

// ================== MOUNT ROUTES ==================

// Users API
if (userRoutes && typeof userRoutes === "function") {
  app.use("/api/users", userRoutes);
  console.log("🚀 Mounted /api/users routes");
} else {
  app.use("/api/users", (req, res) =>
    res.json({ message: "User routes not available" })
  );
}

// Books API
if (bookRoutes && typeof bookRoutes === "function") {
  app.use("/api/books", bookRoutes);
  console.log("🚀 Mounted /api/books routes");
} else {
  app.use("/api/books", (req, res) =>
    res.json({ message: "Book routes not available" })
  );
}

// Borrows API
if (borrowRoutes && typeof borrowRoutes === "function") {
  app.use("/api/borrows", borrowRoutes);
  console.log("🚀 Mounted /api/borrows routes");
} else {
  app.use("/api/borrows", (req, res) =>
    res.json({ message: "Borrow routes not available" })
  );
}

// Library Card API
if (libraryCardRoutes && typeof libraryCardRoutes === "function") {
  app.use("/api/library-card", libraryCardRoutes);
  console.log("🚀 Mounted /api/library-card routes");
}

// 🤖 Chatbot API (FINAL FIX)
if (chatbotRoutes && typeof chatbotRoutes === "function") {
  app.use("/api/chatbot", chatbotRoutes);
  console.log("🚀 Mounted /api/chatbot routes");
}

// ================== START SERVER ==================
async function start() {
  if (!MONGO_URI) {
    console.warn("⚠️ MONGO_URI is not set — starting without DB");
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT} (no DB)`)
    );
    return;
  }

  console.log("🔌 Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
  }

  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

start();
