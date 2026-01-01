const jwt = require("jsonwebtoken");

/* ============================
   AUTH MIDDLEWARE
   ============================ */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/* ============================
   ADMIN CHECK
   ============================ */
function isAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
}

/* ============================
   ✅ EXPORT BOTH (CRITICAL)
   ============================ */
module.exports = {
  authMiddleware,
  isAdmin,
};
