const express = require("express");
const router = express.Router();

const { handleExotelRecorded } = require("../controllers/callController");

// ── Exotel Recording Webhook ────────────────────────────────────────────────
// Exotel fires this when the caller finishes recording their emergency message.
// The Exotel dashboard Flow Builder handles the greeting + recording — your
// server only needs to receive this single callback.
//
// Configure in Exotel Dashboard:
//   Passthru Applet → URL: https://<your-server>/api/call/exotel-recorded
//                     Method: POST  (or HTTP GET, both are registered below)
//
router.post("/exotel-recorded", handleExotelRecorded);
router.get("/exotel-recorded", handleExotelRecorded);   // Exotel can use GET too

module.exports = router;
