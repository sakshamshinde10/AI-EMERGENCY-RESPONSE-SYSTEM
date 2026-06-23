/**
 * Exotel Voicebot WebSocket Service
 *
 * HOW IT WORKS:
 * ─────────────
 * When a caller dials your Exotel number and reaches the Voicebot applet,
 * Exotel opens a WebSocket connection to: wss://YOUR-SERVER/api/voicebot/stream
 *
 * Exotel streams the caller's audio to us in real-time as base64-encoded
 * μ-law (mulaw) audio chunks at 8000 Hz, 8-bit, mono.
 *
 * We collect all chunks → convert mulaw → PCM WAV → send to Groq Whisper → 
 * AI classify → save emergency to MongoDB → broadcast to dashboards.
 *
 * Exotel WebSocket Message Protocol:
 *   FROM Exotel → your server:
 *     { event: "connected" }            — WebSocket established
 *     { event: "start",   start: {...}} — Call started, metadata available
 *     { event: "media",   media: {...}} — Audio chunk (base64 mulaw)
 *     { event: "stop",    stop:  {...}} — Call ended
 *
 *   FROM your server → Exotel:
 *     { event: "playAudio", ... }       — Play TTS audio to caller
 *     { event: "clear"     }            — Stop current audio
 */

const WebSocket = require("ws");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Groq = require("groq-sdk");
const classifyEmergencyAI = require("./groqService");
const classifyEmergency = require("../utils/classifyEmergency");
const Emergency = require("../models/Emergency");

// ─────────────────────────────────────────────────────────────
// Audio: μ-law → 16-bit Linear PCM conversion (ITU-T G.711)
// ─────────────────────────────────────────────────────────────
const MULAW_EXP_LUT = [0, 132, 396, 924, 1980, 4092, 8316, 16764];

function mulawToPcm16(mulawBuffer) {
  const pcm = Buffer.alloc(mulawBuffer.length * 2); // 16-bit = 2 bytes/sample
  for (let i = 0; i < mulawBuffer.length; i++) {
    let mulaw = ~mulawBuffer[i] & 0xff;
    const sign = mulaw & 0x80;
    const exp = (mulaw >> 4) & 0x07;
    const mantissa = mulaw & 0x0f;
    let sample = MULAW_EXP_LUT[exp] + (mantissa << (exp + 3));
    if (sign !== 0) sample = -sample;
    pcm.writeInt16LE(sample, i * 2);
  }
  return pcm;
}

// Build a valid 16-bit PCM WAV buffer from raw PCM data
function buildWavFile(pcmBuffer) {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataLength = pcmBuffer.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);                                          // fmt chunk size
  header.writeUInt16LE(1, 20);                                           // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);          // block align
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// ─────────────────────────────────────────────────────────────
// Emergency creation from transcript (shared with callController)
// ─────────────────────────────────────────────────────────────
async function createEmergencyFromTranscript({ transcript, callSid, callerPhone, io }) {
  console.log("🤖 AI classifying emergency from voicebot transcript...");

  let result = await classifyEmergencyAI(transcript);
  if (!result || result.department === "Unknown") {
    console.log("🔄 Falling back to keyword classifier...");
    result = classifyEmergency(transcript);
  }

  console.log("✅ AI Result:", result);

  const emergency = await Emergency.create({
    name: "Caller",
    phone: callerPhone,
    message: transcript,
    language: "Auto-Detected",
    department: result.department || "Unknown",
    priority: result.priority || "Medium",
    address: result.address || null,
    area: result.area || null,
    city: result.city || null,
    landmark: result.landmark || null,
    source: "call",
    callSid,
    callerPhone,
  });

  console.log(`🚨 Emergency created → ID: ${emergency._id} | Dept: ${emergency.department} | Priority: ${emergency.priority}`);

  if (io) {
    io.emit("new-emergency", emergency);
    console.log("📡 Broadcast to dashboards via Socket.io");
  }

  return emergency;
}

// ─────────────────────────────────────────────────────────────
// Process: mulaw chunks → WAV → Groq Whisper → Emergency
// ─────────────────────────────────────────────────────────────
async function processVoicebotAudio({ mulawChunks, callSid, callerPhone, io }) {
  if (mulawChunks.length === 0) {
    console.warn("⚠️  No audio received — skipping emergency creation.");
    return;
  }

  const tempPath = path.join(os.tmpdir(), `voicebot-${callSid}.wav`);

  try {
    // Concatenate all mulaw chunks → convert to 16-bit PCM → wrap in WAV
    const rawMulaw = Buffer.concat(mulawChunks);
    const pcmBuffer = mulawToPcm16(rawMulaw);
    const wavBuffer = buildWavFile(pcmBuffer);

    fs.writeFileSync(tempPath, wavBuffer);
    console.log(`✅ WAV written: ${tempPath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);

    // Transcribe using Groq Whisper
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-large-v3-turbo",
      response_format: "text",
      // No language → auto-detect EN / HI / MR
    });

    console.log(`🗣️  Voicebot Transcript: "${transcription}"`);

    try { fs.unlinkSync(tempPath); } catch (_) {}

    if (!transcription || transcription.trim() === "") {
      console.warn("⚠️  Empty transcript. Emergency not created.");
      return;
    }

    await createEmergencyFromTranscript({
      transcript: transcription.trim(),
      callSid,
      callerPhone,
      io,
    });

  } catch (err) {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
    console.error("❌ Voicebot audio processing error:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// Setup: Attach WebSocket server to existing HTTP server
// ─────────────────────────────────────────────────────────────
function setupVoicebotWsServer(httpServer, io) {
  const wss = new WebSocket.Server({
    server: httpServer,
    path: "/api/voicebot/stream",
  });

  console.log("🎙️  Voicebot WebSocket ready at: wss://<your-server>/api/voicebot/stream");

  wss.on("connection", (ws, req) => {
    console.log(`\n🔗 Exotel Voicebot WebSocket connected from ${req.socket.remoteAddress}`);

    // State per call connection
    let callSid = `voicebot-${Date.now()}`;
    let callerPhone = "Unknown";
    let mulawChunks = [];
    let callStarted = false;

    ws.on("message", async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        switch (msg.event) {
          // ── Handshake ──────────────────────────────────────
          case "connected":
            console.log("📡 Exotel WebSocket handshake complete");
            break;

          // ── Call metadata ──────────────────────────────────
          case "start": {
            const meta = msg.start || {};
            callSid = meta.callSid || callSid;

            // Exotel puts caller number in customParameters or From
            callerPhone =
              meta.customParameters?.From ||
              meta.customParameters?.from ||
              meta.From ||
              "Unknown";

            // Normalise 0XXXXXXXXXX → +91XXXXXXXXXX
            if (callerPhone.startsWith("0") && callerPhone.length === 11) {
              callerPhone = "+91" + callerPhone.slice(1);
            }

            callStarted = true;
            mulawChunks = [];

            console.log(`📞 Voicebot call started`);
            console.log(`   CallSid     : ${callSid}`);
            console.log(`   CallerPhone : ${callerPhone}`);
            console.log(`   Encoding    : ${meta.mediaFormat?.encoding || "audio/x-mulaw"}`);
            break;
          }

          // ── Audio stream ───────────────────────────────────
          case "media": {
            const payload = msg.media?.payload;
            if (payload) {
              mulawChunks.push(Buffer.from(payload, "base64"));
            }
            break;
          }

          // ── Call ended ─────────────────────────────────────
          case "stop":
            console.log(`\n🛑 Voicebot call ended — ${mulawChunks.length} audio chunks received`);
            ws.close();

            if (callStarted && mulawChunks.length > 0) {
              // Process async so WS close isn't blocked
              setImmediate(() =>
                processVoicebotAudio({ mulawChunks, callSid, callerPhone, io })
              );
            } else {
              console.warn("⚠️  No audio captured during call.");
            }
            break;

          default:
            // Ignore unknown events (dtmf, mark, etc.)
            break;
        }
      } catch (err) {
        console.error("❌ Voicebot message parse error:", err.message);
      }
    });

    ws.on("close", () => {
      console.log("📴 Voicebot WebSocket closed");
    });

    ws.on("error", (err) => {
      console.error("❌ Voicebot WebSocket error:", err.message);
    });
  });

  return wss;
}

module.exports = { setupVoicebotWsServer };
