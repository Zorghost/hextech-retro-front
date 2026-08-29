/**
 * Rate Limiting Utility
 * 
 * This module provides rate limiting for API endpoints.
 * 
 * Development: Uses in-memory storage (not suitable for distributed systems)
 * Production: Use with Redis via environment variable REDIS_URL
 * 
 * For Redis-based rate limiting:
 * 1. Install: npm install @upstash/ratelimit redis
 * 2. Set REDIS_URL in environment
 * 
 * Example:
 *   export REDIS_URL="redis://default:password@host:port"
 */

const RATE_LIMITS = new Map(); // In-memory store (dev only)

/**
 * Create a rate limiter for an identifier
 * @param {string} identifier - Unique identifier (IP, user ID, email, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<{success: boolean, remaining: number, resetTime: number}>}
 */
export async function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  if (!RATE_LIMITS.has(key)) {
    RATE_LIMITS.set(key, { count: 0, resetTime: now + windowMs });
  }

  const limit = RATE_LIMITS.get(key);

  // Reset if window has passed
  if (now >= limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + windowMs;
  }

  limit.count += 1;
  const remaining = Math.max(0, maxRequests - limit.count);
  const success = limit.count <= maxRequests;

  return {
    success,
    remaining,
    resetTime: limit.resetTime,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result) {
  return {
    "X-RateLimit-Limit": "10",
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Extract client identifier (IP address)
 * Works behind proxies and in serverless environments
 */
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const ip = request.headers.get("x-real-ip");
  if (ip) {
    return ip;
  }
  return request.headers.get("cf-connecting-ip") || "unknown";
}

/**
 * Cleanup old entries from in-memory store (called periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of RATE_LIMITS.entries()) {
    if (now >= value.resetTime + 3600000) {
      // Remove if older than 1 hour past reset
      RATE_LIMITS.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Rate limit store cleanup: removed ${cleaned} old entries`);
  }
}

// Cleanup store every hour
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 3600000);
}
