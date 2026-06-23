/**
 * Exotel IVR Service — Helper utilities for the Exotel call flow.
 *
 * Unlike Twilio (which required dynamic TwiML XML returned by your server),
 * Exotel uses a VISUAL FLOW BUILDER configured entirely on the Exotel dashboard.
 * Your server only receives webhook callbacks AFTER the recording is done.
 *
 * This file provides utility helpers used by the call controller.
 */

/**
 * Extracts and normalises the caller's phone number from Exotel webhook payload.
 * Exotel sends it as "From" (e.g. 0XXXXXXXXXX or +91XXXXXXXXXX).
 */
const normaliseCallerPhone = (payload) => {
  const raw = payload.From || payload.CallFrom || payload.caller_id || "Unknown";
  // Convert 0XXXXXXXXXX → +91XXXXXXXXXX for consistency
  if (raw.startsWith("0") && raw.length === 11) {
    return "+91" + raw.slice(1);
  }
  return raw;
};

/**
 * Extracts a unique call identifier from Exotel webhook payload.
 * Exotel uses "CallSid" (primary) or "CallId" (legacy) as the unique ID.
 */
const extractCallSid = (payload) => {
  return payload.CallSid || payload.CallId || `exotel-${Date.now()}`;
};

/**
 * Extracts the recording URL from Exotel webhook payload.
 * Exotel sends the recording URL in the "RecordingUrl" field.
 */
const extractRecordingUrl = (payload) => {
  return payload.RecordingUrl || payload.recording_url || null;
};

module.exports = {
  normaliseCallerPhone,
  extractCallSid,
  extractRecordingUrl,
};
