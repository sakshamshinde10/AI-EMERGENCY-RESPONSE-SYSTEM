const Emergency = require("../models/Emergency");
const classifyEmergency = require("../utils/classifyEmergency");
const classifyEmergencyAI = require("../services/groqService");
const { broadcastNewEmergency, broadcastStatusUpdated } = require("../services/socketService");
const { cacheGet, cacheSet, cacheDel } = require("../config/redis");

// Helper: build filter query from request query params
const buildQueryFilter = (department, query) => {
  const filter = {};
  if (department) {
    if (department === "Fire Brigade") {
      filter.department = { $in: ["Fire Brigade", "Fire"] };
    } else {
      filter.department = department;
    }
  }

  if (query.status && query.status !== "All") {
    filter.status = query.status;
  }

  if (query.priority && query.priority !== "All") {
    filter.priority = query.priority;
  }

  if (query.source && query.source !== "All") {
    filter.source = query.source;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
      { message: { $regex: term, $options: "i" } },
      { address: { $regex: term, $options: "i" } },
      { area: { $regex: term, $options: "i" } },
      { city: { $regex: term, $options: "i" } },
      { landmark: { $regex: term, $options: "i" } },
    ];
  }

  return filter;
};

// Helper: execute paginated query
const executePaginatedQuery = async (filter, req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
  const skip = (page - 1) * limit;

  const [emergencies, total] = await Promise.all([
    Emergency.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Emergency.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    count: emergencies.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: emergencies,
  });
};

// Get ALL Emergencies (Admin only)
const getAllEmergencies = async (req, res, next) => {
  try {
    const filter = buildQueryFilter(null, req.query);
    await executePaginatedQuery(filter, req, res);
  } catch (error) {
    next(error);
  }
};

// Hospital Emergencies
const getHospitalEmergencies = async (req, res, next) => {
  try {
    const filter = buildQueryFilter("Hospital", req.query);
    await executePaginatedQuery(filter, req, res);
  } catch (error) {
    next(error);
  }
};

// Fire Emergencies
const getFireEmergencies = async (req, res, next) => {
  try {
    const filter = buildQueryFilter("Fire Brigade", req.query);
    await executePaginatedQuery(filter, req, res);
  } catch (error) {
    next(error);
  }
};

// Police Emergencies
const getPoliceEmergencies = async (req, res, next) => {
  try {
    const filter = buildQueryFilter("Police", req.query);
    await executePaginatedQuery(filter, req, res);
  } catch (error) {
    next(error);
  }
};

// Cached Aggregate Dashboard Statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const cacheKey = "stats:dashboard:overview";
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, fromCache: true, data: cached });
    }

    const [total, pending, active, resolved, policeCount, fireCount, hospitalCount] =
      await Promise.all([
        Emergency.countDocuments(),
        Emergency.countDocuments({ status: "Pending" }),
        Emergency.countDocuments({ status: "Active" }),
        Emergency.countDocuments({ status: "Resolved" }),
        Emergency.countDocuments({ department: "Police" }),
        Emergency.countDocuments({ department: { $in: ["Fire", "Fire Brigade"] } }),
        Emergency.countDocuments({ department: "Hospital" }),
      ]);

    const stats = {
      total,
      pending,
      active,
      resolved,
      byDepartment: {
        police: policeCount,
        fire: fireCount,
        hospital: hospitalCount,
      },
      updatedAt: new Date().toISOString(),
    };

    // Cache for 15 seconds
    await cacheSet(cacheKey, stats, 15);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// Create Emergency
const createEmergency = async (req, res, next) => {
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

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Emergency incident message is required.",
        code: "INVALID_INPUT",
      });
    }

    let result = await classifyEmergencyAI(message);

    // Fallback Classifier
    if (!result || result.department === "Unknown") {
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
      name: name?.trim() || "Caller",
      phone: phone?.trim() || "Unknown",
      message: message.trim(),
      language: language || "English",
      department: result.department,
      priority: result.priority,
      address: fallbackField(result.address, clientAddress),
      area: fallbackField(result.area, clientArea),
      city: fallbackField(result.city, clientCity),
      landmark: fallbackField(result.landmark, clientLandmark),
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
    });

    // Invalidate cached statistics
    await cacheDel("stats:*");

    // Targeted Room Broadcast
    broadcastNewEmergency(emergency);

    res.status(201).json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

// Atomic Update Status with Concurrency Handling
const updateEmergencyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, department } = req.body;

    if (!status && !department) {
      return res.status(400).json({
        success: false,
        message: "Provide either status or department to update.",
        code: "MISSING_FIELDS",
      });
    }

    const existing = await Emergency.findById(id).select("department status").lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Emergency record not found.",
        code: "NOT_FOUND",
      });
    }

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (department !== undefined) updateFields.department = department;

    // Atomic update
    const updatedEmergency = await Emergency.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Invalidate stats cache
    await cacheDel("stats:*");

    // Targeted Socket.io Broadcast
    broadcastStatusUpdated(updatedEmergency, existing.department);

    res.status(200).json({
      success: true,
      data: updatedEmergency,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmergency,
  getPoliceEmergencies,
  getFireEmergencies,
  getHospitalEmergencies,
  getAllEmergencies,
  getDashboardStats,
  updateEmergencyStatus,
};