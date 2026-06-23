const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { setupVoicebotWsServer } = require("./services/voicebotWs");

dotenv.config({ override: true });

const emergencyRoutes = require("./routes/emergencyRoutes");
const authRoutes = require("./routes/authRoutes");
const callRoutes = require("./routes/callRoutes");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Required for Exotel webhook payloads

app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/call", callRoutes); // Exotel recording webhook

app.get("/", (req, res) => {
  res.send("Government Emergency Command Platform — Backend Running");
});

// ── HTTP Server ────────────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.io (Real-time Dashboard Updates) ────────────────────
const io = new Server(server, {
  cors: { origin: "*" },
});
app.set("io", io);
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
});

// ── Exotel Voicebot WebSocket Server ───────────────────────────
// Exotel connects here when Voicebot applet is triggered on a call.
// WebSocket URL: wss://<your-server>/api/voicebot/stream
setupVoicebotWsServer(server, io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});