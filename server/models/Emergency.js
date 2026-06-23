const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Caller",  // For phone calls where name is unknown
    },

    phone: {
      type: String,
      default: "Unknown",
    },

    message: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      enum: ["English", "Hindi", "Marathi"],
      default: "English",
    },

    department: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      default: "Medium",
    },

    status: {
      type: String,
      default: "Pending",
    },

    address: {
      type: String,
      default: null,
    },

    area: {
      type: String,
      default: null,
    },

    city: {
      type: String,
      default: null,
    },

    landmark: {
      type: String,
      default: null,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    // ── Call System Fields (Exotel) ─────────────────────────────
    source: {
      type: String,
      enum: ["web", "call"],
      default: "web",
    },

    callSid: {
      type: String,
      default: null,  // Exotel Call SID for tracking
    },

    recordingUrl: {
      type: String,
      default: null,  // URL of the Exotel voice recording (MP3)
    },

    callerPhone: {
      type: String,
      default: null,  // Normalised caller phone number (e.g. +919876543210)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Emergency", emergencySchema);