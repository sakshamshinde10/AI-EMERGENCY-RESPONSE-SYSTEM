const Emergency = require("../models/Emergency");
const classifyEmergency = require("../utils/classifyEmergency");
const classifyEmergencyAI = require("../services/groqService");

// Get ALL Emergencies (Admin only)
const getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({})
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Hospital Emergencies
const getHospitalEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      department: "Hospital",
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Fire Emergencies
const getFireEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      department: "Fire Brigade",
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Police Emergencies
const getPoliceEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      department: "Police",
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Emergency
const createEmergency = async (req, res) => {
  try {
    const {
      name,
      phone,
      message,
      language,
      latitude,
      longitude,
      clientAddress,
      clientArea,
      clientCity,
      clientLandmark,
    } = req.body;

    let result = await classifyEmergencyAI(message);

    console.log("AI Result:", result);

    // Fallback Classifier
    if (!result || result.department === "Unknown") {
      console.log("Using Fallback Classifier");
      result = classifyEmergency(message);
    }

    const fallbackField = (aiValue, clientValue) => {
      if (
        aiValue &&
        typeof aiValue === "string" &&
        aiValue.trim().toLowerCase() !== "null" &&
        aiValue.trim() !== ""
      ) {
        return aiValue.trim();
      }
      if (
        clientValue &&
        typeof clientValue === "string" &&
        clientValue.trim().toLowerCase() !== "null" &&
        clientValue.trim() !== ""
      ) {
        return clientValue.trim();
      }
      return null;
    };

    const emergency = await Emergency.create({
      name,
      phone,
      message,
      language: language || "English",
      department: result.department,
      priority: result.priority,
      address: fallbackField(result.address, clientAddress),
      area: fallbackField(result.area, clientArea),
      city: fallbackField(result.city, clientCity),
      landmark: fallbackField(result.landmark, clientLandmark),
      latitude: latitude || null,
      longitude: longitude || null,
    });

    // Socket.io Event
    const io = req.app.get("io");

    if (io) {
      io.emit("new-emergency", emergency);
      console.log("📡 Emergency Sent To Clients");
    }

    res.status(201).json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const emergency = await Emergency.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    const io = req.app.get("io");

    if (io) {
      io.emit("status-updated", emergency);
    }

    res.status(200).json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEmergency,
  getPoliceEmergencies,
  getFireEmergencies,
  getHospitalEmergencies,
  getAllEmergencies,
  updateEmergencyStatus,
};