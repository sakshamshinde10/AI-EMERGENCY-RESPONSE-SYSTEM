const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  emergencyCreateLimiter,
  emergencyActionLimiter,
  readQueryLimiter,
} = require("../middleware/rateLimiter");

const {
  createEmergency,
  getPoliceEmergencies,
  getFireEmergencies,
  getHospitalEmergencies,
  getAllEmergencies,
  getDashboardStats,
  updateEmergencyStatus,
} = require("../controllers/emergencyController");

// Public — citizens can submit emergencies (protected with high-capacity limiter)
router.post("/", emergencyCreateLimiter, createEmergency);

// Cached aggregates for overview
router.get("/stats", readQueryLimiter, protect, getDashboardStats);

// Protected department-specific routes
router.get("/police", readQueryLimiter, protect, authorize("police", "admin"), getPoliceEmergencies);
router.get("/fire", readQueryLimiter, protect, authorize("fire", "admin"), getFireEmergencies);
router.get("/hospital", readQueryLimiter, protect, authorize("hospital", "admin"), getHospitalEmergencies);

// Admin-only — all emergencies
router.get("/all", readQueryLimiter, protect, authorize("admin"), getAllEmergencies);

// Protected — authenticated operator status update
router.patch("/:id/status", emergencyActionLimiter, protect, updateEmergencyStatus);

module.exports = router;
