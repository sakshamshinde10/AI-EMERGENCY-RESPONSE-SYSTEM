/**
 * Structured Production Logger & Performance Metrics Collector
 */

// Metrics ring buffer for rolling latency tracking
const LATENCY_BUFFER_MAX = 500;
const latencyBuffer = [];
let totalRequests = 0;
let totalErrors = 0;
const startTime = Date.now();

const recordMetrics = (durationMs, isError) => {
  totalRequests++;
  if (isError) totalErrors++;

  if (latencyBuffer.length >= LATENCY_BUFFER_MAX) {
    latencyBuffer.shift();
  }
  latencyBuffer.push(durationMs);
};

const getMetrics = () => {
  const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
  const rps = uptimeSec > 0 ? (totalRequests / uptimeSec).toFixed(2) : totalRequests;
  const errorRate = totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) + "%" : "0%";

  let p50 = 0;
  let p95 = 0;
  let p99 = 0;
  let avg = 0;

  if (latencyBuffer.length > 0) {
    const sorted = [...latencyBuffer].sort((a, b) => a - b);
    avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
    p50 = sorted[Math.floor(sorted.length * 0.5)];
    p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
    p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
  }

  return {
    uptime: `${uptimeSec}s`,
    totalRequests,
    totalErrors,
    errorRate,
    requestsPerSecond: parseFloat(rps),
    latency: {
      avgMs: avg,
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
    },
  };
};

const requestLogger = (req, res, next) => {
  // Skip noisy static or favicon requests if any
  if (req.originalUrl === "/favicon.ico") return next();

  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = Math.round((diff[0] * 1e3 + diff[1] * 1e-6) * 100) / 100;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;

    recordMetrics(durationMs, isError);

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      durationMs,
      ip: req.ip || req.connection?.remoteAddress,
    };

    // Filter out secrets
    if (process.env.NODE_ENV !== "test") {
      const statusColor = statusCode >= 500 ? "\x1b[31m" : statusCode >= 400 ? "\x1b[33m" : "\x1b[32m";
      console.log(
        `${statusColor}[HTTP]\x1b[0m ${logEntry.method} ${logEntry.url} ${statusColor}${logEntry.status}\x1b[0m ${durationMs}ms - ${logEntry.ip}`
      );
    }
  });

  next();
};

module.exports = {
  requestLogger,
  getMetrics,
};
