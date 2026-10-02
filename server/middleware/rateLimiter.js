const { rateLimit } = require("express-rate-limit");

const rateLimitHandler = (message = "Too many requests. Please try again later.") => {
  return (req, res) => {
    res.status(429).json({
      success: false,
      message,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: res.getHeader("Retry-After") || 60,
    });
  };
};

// 1. Strict Limiter for Authentication (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per IP per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many login attempts. For security, please wait 15 minutes."),
});

// 2. High-Capacity Emergency Creation Limiter
// Must never block authentic emergency reporting during a crisis
const emergencyCreateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 reports per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Incident reporting rate limit exceeded. Please wait a moment before resubmitting."),
});

// 3. Status Update & Admin Action Limiter
const emergencyActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 updates per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many administrative updates. Please slow down."),
});

// 4. Listing & Dashboard Query Limiter
const readQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 read requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("High query frequency detected. Please reduce polling rate."),
});

// 5. Exotel / Webhook Limiter
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Webhook throughput exceeded."),
});

module.exports = {
  authLimiter,
  emergencyCreateLimiter,
  emergencyActionLimiter,
  readQueryLimiter,
  webhookLimiter,
};
