const express = require("express");
const router = express.Router();
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me (protected)
router.get("/me", protect, getMe);

module.exports = router;
