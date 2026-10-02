const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const helmet = require("helmet");
const compression = require("compression");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

dotenv.config({ override: true });

const connectDB = require("./config/db");
const { initRedis, closeRedis } = require("./config/redis");
const { setupSocketServer } = require("./services/socketService");
const { setupVoicebotWsServer } = require("./services/voicebotWs");
const { requestLogger } = require("./middleware/logger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const emergencyRoutes = require("./routes/emergencyRoutes");
const authRoutes = require("./routes/authRoutes");
const callRoutes = require("./routes/callRoutes");
const healthRoutes = require("./routes/healthRoutes");

// Initialize Database & Redis
connectDB();
initRedis();

const app = express();

// Trust reverse proxy (for Load Balancers, Nginx, Render, Railway, AWS ALB)
app.set("trust proxy", 1);

// Security Headers via Helmet (with websocket & cross-origin allowance)
app.use(
  helmet({
    contentSecurityPolicy: false, // Don't block external CDNs or websockets
    crossOriginEmbedderPolicy: false,
  })
);

// High-performance Response Compression (GZIP/Deflate)
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"] : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body Parsers with safe memory limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" })); // Exotel webhook payloads

// Structured Production Request Logging
app.use(requestLogger);

// System Health & Monitoring
app.use("/", healthRoutes);

// Application API Routes
app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/call", callRoutes); // Exotel recording webhook

app.get("/", (req, res) => {
  res.send("Government Emergency Command Platform — Backend Running");
});

// Centralized 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ── HTTP & Realtime Server Setup ─────────────────────────────
const server = http.createServer(app);

// Scalable Socket.io Server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 30000,
  pingInterval: 25000,
});

app.set("io", io);
setupSocketServer(io);

// Exotel Voicebot WebSocket Server
setupVoicebotWsServer(server, io);

const PORT = process.env.PORT || 5000;
const serverInstance = server.listen(PORT, () => {
  console.log(`🚀 Government Emergency Command Server listening on port ${PORT}`);
});

// ── Graceful Shutdown Handler (Zero-Downtime Rolling Deploys) ───
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new incoming HTTP connections
  serverInstance.close(async () => {
    console.log("🔒 Closed incoming HTTP listeners.");

    try {
      // Clean up Socket.IO connections
      io.close(() => {
        console.log("🔌 Closed active Socket.IO connections.");
      });

      // Disconnect Redis
      await closeRedis();
      console.log("⚡ Disconnected Redis.");

      // Close MongoDB Connection
      await mongoose.connection.close(false);
      console.log("💾 Closed MongoDB connection.");

      console.log("✅ Graceful shutdown complete. Exiting cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during graceful shutdown:", err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if shutdown hangs
  setTimeout(() => {
    console.error("⚠️ Forcefully terminating process after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = { app, server };