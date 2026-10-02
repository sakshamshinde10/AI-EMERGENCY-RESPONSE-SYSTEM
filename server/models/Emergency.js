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

// High-performance compound & query indexes
emergencySchema.index({ createdAt: -1 });
emergencySchema.index({ status: 1, createdAt: -1 });
emergencySchema.index({ department: 1, createdAt: -1 });
emergencySchema.index({ department: 1, status: 1, createdAt: -1 });
emergencySchema.index({ priority: 1, createdAt: -1 });
emergencySchema.index({ callSid: 1 }, { sparse: true });
emergencySchema.index({
  name: "text",
  phone: "text",
  message: "text",
  address: "text",
  area: "text",
  city: "text",
});

module.exports = mongoose.model("Emergency", emergencySchema);