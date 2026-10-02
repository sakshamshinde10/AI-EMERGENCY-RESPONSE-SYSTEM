/**
 * Call Controller — Handles Exotel IVR webhook endpoints.
 *
 * HOW EXOTEL WORKS (different from Twilio):
 * ─────────────────────────────────────────
 * The call flow (greeting, recording, hangup) is configured VISUALLY on the
 * Exotel Dashboard using their "App Builder" / "Flow Builder" — you do NOT
 * need to return any XML from your server.
 *
 * Your server only receives ONE webhook callback after the recording is done:
 *
 *   POST /api/call/exotel-recorded  ← Exotel fires this when recording is ready
 *
 * Routes:
 *   POST /api/call/exotel-recorded  → Exotel recording webhook → Whisper → AI classify → Save
 *   GET  /api/call/exotel-recorded  → Same handler (Exotel supports both methods)
 */

const {
  normaliseCallerPhone,
  extractCallSid,
  extractRecordingUrl,
} = require("../services/ivrService");

const classifyEmergencyAI = require("../services/groqService");
const classifyEmergency = require("../utils/classifyEmergency");
const Emergency = require("../models/Emergency");
const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Groq = require("groq-sdk");

// ─────────────────────────────────────────────────────────────
// EXOTEL WEBHOOK — Recording Ready
// Exotel calls this endpoint after the caller finishes recording.
// ─────────────────────────────────────────────────────────────

/**
 * Exotel fires this webhook (POST or GET) when:
 *   - Caller pressed the finish key (e.g. #), OR
 *   - The max recording duration was reached, OR
 *   - The caller hung up
 *
 * Exotel payload fields (common ones):
 *   CallSid        — Unique call ID
 *   From           — Caller's phone number (e.g. 09876543210 or +919876543210)
 *   To             — Virtual number that was dialled
 *   RecordingUrl   — Direct URL to the MP3/WAV recording file
 *   Length         — Duration of the recording in seconds
 *   Status         — Call status (e.g. "completed")
 */
const handleExotelRecorded = async (req, res) => {
  // Exotel can send params in body (POST) or query string (GET) — handle both
  const payload = { ...req.query, ...req.body };

  const callerPhone = normaliseCallerPhone(payload);
  const callSid = extractCallSid(payload);
  const recordingUrl = extractRecordingUrl(payload);
  const recordingDuration = payload.Length || payload.Duration || "0";

  console.log(`\n📞 ─── Exotel Call Webhook ───────────────────────`);
  console.log(`   From        : ${callerPhone}`);
  console.log(`   CallSid     : ${callSid}`);
  console.log(`   Duration    : ${recordingDuration}s`);
  console.log(`   RecordingUrl: ${recordingUrl}`);
  console.log(`─────────────────────────────────────────────────\n`);

  // ✅ Always respond 200 to Exotel immediately so the call isn't retried
  res.status(200).send("OK");

  if (!recordingUrl || recordingUrl === "null") {
    console.warn("⚠️  Exotel webhook received but no RecordingUrl provided. Nothing to process.");
    return;
  }

  const io = req.app.get("io");

  // Process the recording asynchronously (don't block the response)
  // Wait 4 seconds to give Exotel time to fully upload the file to their CDN
  setTimeout(async () => {
    try {
      await processExotelRecording({ recordingUrl, callSid, callerPhone, io });
    } catch (err) {
      console.error("❌ Exotel recording processing failed:", err.message);
    }
  }, 4000);
};

// ─────────────────────────────────────────────────────────────
// Helper: Download recording from Exotel → Groq Whisper → AI classify → Save
// ─────────────────────────────────────────────────────────────
const processExotelRecording = async ({ recordingUrl, callSid, callerPhone, io }) => {
  const apiKey = process.env.EXOTEL_API_KEY;
  const apiToken = process.env.EXOTEL_API_TOKEN;

  if (!apiKey || !apiToken) {
    console.error("❌ EXOTEL_API_KEY or EXOTEL_API_TOKEN missing in .env");
    return;
  }

  // Save to a temp file (Groq Whisper requires a file stream, not a URL)
  const tempPath = path.join(os.tmpdir(), `exotel-${callSid}.mp3`);

  try {
    console.log("⬇️  Downloading recording from Exotel CDN...");

    // Exotel recording URLs require Basic Auth with API Key + API Token
    const response = await axios.get(recordingUrl, {
      responseType: "arraybuffer",
      auth: { username: apiKey, password: apiToken },
      timeout: 20000,
    });

    fs.writeFileSync(tempPath, Buffer.from(response.data));
    console.log(`✅ Recording downloaded to: ${tempPath}`);

    // ── Groq Whisper STT ──────────────────────────────────────
    // whisper-large-v3-turbo auto-detects language (English, Hindi, Marathi, etc.)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-large-v3-turbo",
      response_format: "text",
      // No 'language' param → auto-detect
    });

    console.log(`🗣️  Transcript: "${transcription}"`);

    // Clean up temp file immediately
    try { fs.unlinkSync(tempPath); } catch (_) {}

    if (!transcription || transcription.trim() === "") {
      console.warn("⚠️  Empty transcript. Emergency not created.");
      return;
    }

    // ── AI Classify ────────────────────────────────────────────
    await createEmergencyFromTranscript({
      transcript: transcription.trim(),
      callSid,
      callerPhone,
      recordingUrl,
      io,
    });

  } catch (err) {
    // Clean up temp file on error
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: AI classify → save to MongoDB → broadcast via Socket.io
// ─────────────────────────────────────────────────────────────
const createEmergencyFromTranscript = async ({
  transcript,
  callSid,
  callerPhone,
  recordingUrl,
  io,
}) => {
  console.log("🤖 AI classifying emergency from call transcript...");

  // Duplication safety check
  if (callSid) {
    const existing = await Emergency.findOne({ callSid });
    if (existing) {
      console.log(`⚠️ Emergency with CallSid ${callSid} already exists. Skipping duplicate creation.`);
      return;
    }
  }

  // Primary: Groq AI classifier (supports EN / HI / MR natively)
  let result = await classifyEmergencyAI(transcript);

  // Fallback: keyword-based classifier
  if (!result || result.department === "Unknown") {
    console.log("🔄 Falling back to keyword classifier...");
    result = classifyEmergency(transcript);
  }

  console.log("✅ AI Classification Result:", result);

  // Save to MongoDB
  const emergency = await Emergency.create({
    name: "Caller",               // Name unknown for phone calls
    phone: callerPhone,
    message: transcript,
    language: "Auto-Detected",    // Groq Whisper auto-detects language
    department: result.department || "Unknown",
    priority: result.priority || "Medium",
    address: result.address || null,
    area: result.area || null,
    city: result.city || null,
    landmark: result.landmark || null,
    source: "call",
    callSid: callSid,
    recordingUrl: recordingUrl || null,
    callerPhone: callerPhone,
  });

  console.log(
    `🚨 Emergency created → ID: ${emergency._id} | Dept: ${emergency.department} | Priority: ${emergency.priority}`
  );

  // Broadcast to operator dashboards via targeted Socket.io and bust cache
  const { broadcastNewEmergency } = require("../services/socketService");
  const { cacheDel } = require("../config/redis");
  await cacheDel("stats:*");
  broadcastNewEmergency(emergency);
  console.log("📡 Emergency broadcast to dashboards via targeted Socket.io");
};

module.exports = {
  handleExotelRecorded,
};
