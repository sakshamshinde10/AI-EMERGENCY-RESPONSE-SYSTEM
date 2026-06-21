const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Emergency", emergencySchema);