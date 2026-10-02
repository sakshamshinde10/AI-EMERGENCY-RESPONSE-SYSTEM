const express = require("express");
const router = express.Router();
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

// POST /api/auth/login (Brute-force protected)
router.post("/login", authLimiter, login);

// GET /api/auth/me (protected)
router.get("/me", protect, getMe);

module.exports = router;
