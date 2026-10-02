/**
 * Scalable Realtime Socket Service
 * Supports Targeted Room Dispatch & Redis Adapter for Multi-Server Scaling
 */

const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const { getRedisClient, getRedisSubClient, isRedisAvailable } = require("../config/redis");

let ioInstance = null;
const activeSockets = new Set();

const normalizeDept = (dept) => {
  if (!dept) return "unknown";
  const lower = dept.toLowerCase().trim();
  if (lower.includes("police")) return "police";
  if (lower.includes("fire")) return "fire";
  if (lower.includes("hospital") || lower.includes("medical")) return "hospital";
  return lower;
};

const setupSocketServer = (io) => {
  ioInstance = io;

  // Horizontal scaling with Redis adapter if Redis is available
  if (isRedisAvailable()) {
    try {
      const pubClient = getRedisClient();
      const subClient = getRedisSubClient();
      if (pubClient && subClient) {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("⚡ [Socket.IO] Redis adapter enabled for multi-instance cluster.");
      }
    } catch (err) {
      console.warn("⚠️  [Socket.IO] Failed to attach Redis adapter, using memory adapter:", err.message);
    }
  }

  // Socket Connection Handling
  io.on("connection", (socket) => {
    activeSockets.add(socket.id);

    // 1. Auth & Auto-Room Assignment via handshake auth/query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        if (decoded.role === "admin") {
          socket.join("admin");
          socket.join("police");
          socket.join("fire");
          socket.join("hospital");
        } else if (decoded.role) {
          socket.join(normalizeDept(decoded.role));
        }
      } catch (e) {
        // Unauthenticated client (e.g. public page or fallback)
      }
    }

    // 2. Explicit Room Joining
    socket.on("join-department", (department) => {
      const norm = normalizeDept(department);
      socket.join(norm);
    });

    socket.on("join-admin", () => {
      socket.join("admin");
      socket.join("police");
      socket.join("fire");
      socket.join("hospital");
    });

    socket.on("join-incident", (incidentId) => {
      if (incidentId) socket.join(`incident:${incidentId}`);
    });

    socket.on("leave-incident", (incidentId) => {
      if (incidentId) socket.leave(`incident:${incidentId}`);
    });

    socket.on("disconnect", () => {
      activeSockets.delete(socket.id);
    });
  });

  return io;
};

/**
 * Targeted Broadcast for New Emergency
 * Sends only to relevant department and central command
 */
const broadcastNewEmergency = (emergency) => {
  if (!ioInstance) return;
  const deptRoom = normalizeDept(emergency.department);

  // Send to targeted rooms
  ioInstance.to("admin").to(deptRoom).emit("new-emergency", emergency);

  // Also broadcast to root for backwards compatibility with any unauthenticated pages
  ioInstance.emit("new-emergency", emergency);
};

/**
 * Targeted Broadcast for Status Updates
 */
const broadcastStatusUpdated = (emergency, previousDept = null) => {
  if (!ioInstance) return;
  const currentDeptRoom = normalizeDept(emergency.department);
  const rooms = ["admin", currentDeptRoom];

  if (previousDept && normalizeDept(previousDept) !== currentDeptRoom) {
    rooms.push(normalizeDept(previousDept));
  }

  ioInstance.to(rooms).emit("status-updated", emergency);
  ioInstance.to(`incident:${emergency._id}`).emit("incident-updated", emergency);

  // Global emit for backwards compatibility
  ioInstance.emit("status-updated", emergency);
};

const getSocketStats = () => {
  return {
    connectedClients: activeSockets.size,
  };
};

module.exports = {
  setupSocketServer,
  broadcastNewEmergency,
  broadcastStatusUpdated,
  getSocketStats,
};
