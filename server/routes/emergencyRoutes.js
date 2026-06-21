const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createEmergency,
  getPoliceEmergencies,
  getFireEmergencies,
  getHospitalEmergencies,
  getAllEmergencies,
  updateEmergencyStatus,
} = require("../controllers/emergencyController");

// Public — citizens can submit emergencies
router.post("/", createEmergency);

// Protected department-specific routes
router.get("/police", protect, authorize("police", "admin"), getPoliceEmergencies);
router.get("/fire", protect, authorize("fire", "admin"), getFireEmergencies);
router.get("/hospital", protect, authorize("hospital", "admin"), getHospitalEmergencies);

// Admin-only — all emergencies
router.get("/all", protect, authorize("admin"), getAllEmergencies);

// Protected — any authenticated user can update status
router.patch("/:id/status", protect, updateEmergencyStatus);

module.exports = router;
