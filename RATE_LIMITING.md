# Rate Limiting Implementation

This document explains the rate limiting system implemented to protect your API endpoints from abuse.

## Overview

Rate limiting protects your application from:
- **Brute force attacks** - Password reset spam, login attempts
- **Denial of Service (DoS)** - Search hammering, upload abuse  
- **Resource exhaustion** - S3 bucket abuse, database overload
- **Spam** - Malicious crawler activity

## Current Implementation

### Storage Method

**Development:** In-memory storage (fast, suitable for single-server setups)  
**Production:** Same in-memory storage (upgrade to Redis for distributed systems)

### Rate Limits Applied

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `/api/search` | 30 req | 1 min | Per IP |
| `/api/admin/games` (POST) | 5 req | 1 min | Per admin user |
| `/api/admin/uploads/game-multipart` (POST) | 3 req | 1 min | Per admin user |
| `requestPasswordReset()` | 3 req | 30 min | Per email |

### Rate Limit Headers

All rate-limited responses include headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1693476540
```

Responses that exceed rate limits return **HTTP 429** (Too Many Requests).

## Implementation Details

### Rate Limiting Utility

Location: `src/lib/ratelimit.js`

```javascript
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/ratelimit";

// In API route
const clientIp = getClientIp(request);
const result = await checkRateLimit(`search:${clientIp}`, 30, 60000);

if (!result.success) {
  return Response.json(
    { error: "Too many requests" },
    { 
      status: 429,
      headers: getRateLimitHeaders(result)
    }
  );
}
```

### Key Functions

#### `checkRateLimit(identifier, maxRequests, windowMs)`
- Returns: `{ success, remaining, resetTime }`
- Tracks requests by identifier in time window
- Resets counter when window expires

#### `getClientIp(request)`
- Extracts client IP from request headers
- Works behind proxies (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
- Falls back to "unknown" if unavailable

#### `getRateLimitHeaders(result)`
- Returns object with rate limit headers
- Include in response headers for client visibility

### Protected Endpoints

#### 1. Search API (`/api/search`)
- **Limit:** 30 requests per minute per IP
- **Reason:** Prevent search spam and database hammering
- **File:** [src/app/api/search/route.js](src/app/api/search/route.js)

#### 2. Game Creation (`/api/admin/games` POST)
- **Limit:** 5 requests per minute per admin
- **Reason:** Prevent bulk game upload abuse
- **File:** [src/app/api/admin/games/route.js](src/app/api/admin/games/route.js)

#### 3. ROM Uploads (`/api/admin/uploads/game-multipart` POST)
- **Limit:** 3 requests per minute per admin
- **Reason:** Critical S3 cost protection and bandwidth limitation
- **File:** [src/app/api/admin/uploads/game-multipart/route.js](src/app/api/admin/uploads/game-multipart/route.js)

#### 4. Password Reset (`requestPasswordReset()`)
- **Limit:** 3 requests per 30 minutes per email
- **Reason:** Prevent account enumeration and email spam
- **File:** [src/features/auth/passwordReset.js](src/features/auth/passwordReset.js)

## Customizing Rate Limits

To adjust rate limits for different endpoints:

```javascript
// More permissive: 100 requests per minute
await checkRateLimit(key, 100, 60000);

// Very restrictive: 1 request per hour
await checkRateLimit(key, 1, 3600000);

// For time windows:
// 60000 = 1 minute
// 300000 = 5 minutes
// 900000 = 15 minutes
// 3600000 = 1 hour
```

## Production Upgrade: Redis

For production or distributed systems, upgrade to Redis-based rate limiting:

### 1. Install Dependencies

```bash
npm install @upstash/ratelimit redis
```

### 2. Set Redis URL

```bash
export REDIS_URL="redis://default:password@host:port"
```

### 3. Update Rate Limit Utility

Replace `src/lib/ratelimit.js` with:

```javascript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
});

export async function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
  });

  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.resetAfter,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open: allow request if rate limiter fails
    return { success: true, remaining: 0, resetTime: Date.now() };
  }
}
```

### Redis Providers

- **Upstash** (recommended): Free tier, serverless Redis
- **Redis Cloud**: Managed Redis hosting
- **Self-hosted**: Docker, Kubernetes
- **AWS ElastiCache**: Managed service for AWS

## Testing Rate Limits

### Using curl

```bash
# Hit search endpoint 31 times in 60 seconds
for i in {1..31}; do
  curl "http://localhost:3000/api/search?q=test"
  echo "Request $i"
  sleep 1
done

# 31st request should return 429
```

### Using Node.js

```javascript
async function testRateLimit() {
  for (let i = 0; i < 35; i++) {
    const response = await fetch("http://localhost:3000/api/search?q=test");
    console.log(`Request ${i + 1}: ${response.status}`, {
      remaining: response.headers.get("X-RateLimit-Remaining"),
      limit: response.headers.get("X-RateLimit-Limit"),
    });
    await new Promise(r => setTimeout(r, 100));
  }
}
```

## Monitoring & Logging

The rate limit store includes automatic cleanup:

```javascript
// Cleanup runs every hour
// Removes entries older than 1 hour past window expiry
// Logged to console: "Rate limit store cleanup: removed X old entries"
```

For production monitoring:

1. Track HTTP 429 responses per endpoint
2. Monitor rate limit store size (in-memory usage)
3. Alert on sudden spike in rate limit hits
4. Log rate limited IPs/users for security analysis

## Security Considerations

✅ **IP Spoofing:** Rate limits by IP, but can be bypassed with proxy  
✅ **Distributed Attacks:** In-memory storage doesn't prevent distributed DoS (use Redis)  
✅ **Email Enumeration:** Password reset uses generic response message  
✅ **Legitimate Users:** Generous limits to avoid blocking normal usage  

## Client Handling

Recommended client-side handling:

```javascript
async function makeApiCall(url) {
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const resetTime = parseInt(response.headers.get("X-RateLimit-Reset"));
      const waitSeconds = Math.ceil((resetTime * 1000 - Date.now()) / 1000);
      
      console.warn(`Rate limited. Wait ${waitSeconds} seconds before retrying.`);
      
      // Exponential backoff retry
      setTimeout(() => makeApiCall(url), waitSeconds * 1000);
    }
    
    return response;
  } catch (error) {
    console.error("API call failed:", error);
  }
}
```

## Future Improvements

- [ ] Add Redis integration for distributed rate limiting
- [ ] Whitelist trusted IPs (internal services, CDN)
- [ ] Different limits for authenticated vs anonymous users
- [ ] Gradual backoff (increase wait time with repeated violations)
- [ ] Admin dashboard to view rate limit metrics
- [ ] Per-user rate limits based on subscription tier

## Files Modified

- `src/lib/ratelimit.js` - Rate limiting utility (NEW)
- `src/app/api/search/route.js` - Added search rate limiting
- `src/app/api/admin/games/route.js` - Added game creation rate limiting
- `src/app/api/admin/uploads/game-multipart/route.js` - Added upload rate limiting
- `src/features/auth/passwordReset.js` - Added password reset rate limiting
