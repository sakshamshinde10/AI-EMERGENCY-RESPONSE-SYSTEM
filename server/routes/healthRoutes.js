const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { isRedisAvailable } = require("../config/redis");
const { getMetrics } = require("../middleware/logger");
const { getSocketStats } = require("../services/socketService");

// GET /health — Liveness probe & high-level health
router.get("/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const redisStatus = isRedisAvailable() ? "connected" : "in-memory-fallback";
  const metrics = getMetrics();
  const socketStats = getSocketStats();

  res.status(200).json({
    status: "ok",
    service: "Emergency Command System API",
    timestamp: new Date().toISOString(),
    uptime: metrics.uptime,
    connections: {
      mongodb: mongoStatus,
      redis: redisStatus,
      sockets: socketStats.connectedClients,
    },
    performance: {
      rps: metrics.requestsPerSecond,
      errorRate: metrics.errorRate,
      latency: metrics.latency,
    },
  });
});

// GET /ready — Readiness probe for Load Balancers / Kubernetes
router.get("/ready", (req, res) => {
  const isMongoReady = mongoose.connection.readyState === 1;

  if (isMongoReady) {
    return res.status(200).json({
      status: "ready",
      ready: true,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: "not_ready",
    ready: false,
    reason: "Database connection not established",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
