const express = require("express");
const router = express.Router();
const { handleExotelRecorded } = require("../controllers/callController");
const { webhookLimiter } = require("../middleware/rateLimiter");

// ── Exotel Recording Webhook ────────────────────────────────────────────────
// Exotel fires this when the caller finishes recording their emergency message.
//
// Configure in Exotel Dashboard:
//   Passthru Applet → URL: https://<your-server>/api/call/exotel-recorded
//                     Method: POST  (or HTTP GET, both are registered below)
//
router.post("/exotel-recorded", webhookLimiter, handleExotelRecorded);
router.get("/exotel-recorded", webhookLimiter, handleExotelRecorded);   // Exotel can use GET too

module.exports = router;
