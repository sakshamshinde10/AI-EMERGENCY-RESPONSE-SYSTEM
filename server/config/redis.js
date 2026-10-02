/**
 * Production Redis Client with Resilient In-Memory Fallback
 *
 * Supports single-instance or horizontal cluster setups.
 * When Redis is available, uses ioredis for distributed caching and pub/sub.
 * When Redis is unavailable, transparently falls back to a fast in-memory LRU-style cache
 * with TTL support — zero downtime, zero unhandled errors.
 */

const Redis = require("ioredis");

let redisClient = null;
let redisSubClient = null;
let isConnected = false;

// ── In-Memory Fallback Cache ──────────────────────────────────
class MemoryCache {
  constructor(maxItems = 1000) {
    this.store = new Map();
    this.maxItems = maxItems;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = 60) {
    if (this.store.size >= this.maxItems) {
      // Purge oldest key
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiry });
  }

  del(key) {
    return this.store.delete(key);
  }

  delPattern(pattern) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  flush() {
    this.store.clear();
  }
}

const memoryCache = new MemoryCache();

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || "127.0.0.1";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

  const redisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 500, 2000);
    },
  };

  try {
    const client = redisUrl
      ? new Redis(redisUrl, redisOptions)
      : new Redis({ host: redisHost, port: redisPort, ...redisOptions });

    client.on("connect", () => {
      isConnected = true;
      console.log("⚡ [Redis] Connected successfully to Redis server.");
    });

    client.on("error", (err) => {
      // Graceful suppress repetitive connection refused errors
      if (isConnected) {
        console.warn("⚠️  [Redis] Connection warning:", err.message);
      }
      isConnected = false;
    });

    client.on("close", () => {
      isConnected = false;
    });

    // Try connecting with timeout
    await client.connect().catch((err) => {
      console.log("ℹ️  [Redis] Redis not reachable on " + (redisUrl || `${redisHost}:${redisPort}`) + ". Utilizing high-performance in-memory cache.");
    });

    if (client.status === "ready" || client.status === "connect") {
      redisClient = client;
      isConnected = true;

      // Duplicate for sub adapter if needed
      redisSubClient = client.duplicate();
      await redisSubClient.connect().catch(() => {});
    }
  } catch (error) {
    console.log("ℹ️  [Redis] Operating in resilient in-memory mode.");
    isConnected = false;
  }
};

const isRedisAvailable = () => isConnected && redisClient?.status === "ready";

const cacheGet = async (key) => {
  try {
    if (isRedisAvailable()) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    // Failover to memory
  }
  return memoryCache.get(key);
};

const cacheSet = async (key, value, ttlSeconds = 60) => {
  try {
    if (isRedisAvailable()) {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    }
  } catch (err) {
    // Failover to memory
  }
  memoryCache.set(key, value, ttlSeconds);
};

const cacheDel = async (patternOrKey) => {
  try {
    if (isRedisAvailable()) {
      if (patternOrKey.includes("*")) {
        const keys = await redisClient.keys(patternOrKey);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(patternOrKey);
      }
    }
  } catch (err) {
    // Failover to memory
  }
  if (patternOrKey.includes("*")) {
    memoryCache.delPattern(patternOrKey);
  } else {
    memoryCache.del(patternOrKey);
  }
};

const closeRedis = async () => {
  try {
    if (redisClient) await redisClient.quit().catch(() => {});
    if (redisSubClient) await redisSubClient.quit().catch(() => {});
  } catch (e) {
    // ignore
  }
  isConnected = false;
};

module.exports = {
  initRedis,
  isRedisAvailable,
  getRedisClient: () => redisClient,
  getRedisSubClient: () => redisSubClient,
  cacheGet,
  cacheSet,
  cacheDel,
  closeRedis,
};
