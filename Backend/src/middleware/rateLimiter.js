// Zero-dependency In-Memory Rate Limiter Middleware
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests. Please try again later.'
}) => {
  const ipStore = new Map();

  // Periodic garbage collection for expired IP buckets
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipStore.entries()) {
      if (now > entry.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = ipStore.get(ip);

    if (!entry || now > entry.resetTime) {
      ipStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retry_after_seconds: retryAfterSeconds
        }
      });
    }

    next();
  };
};

// 1. Strict Limiter for Auth Routes (Prevents brute-force password guessing & credential stuffing)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10,                   // Max 10 attempts per IP
  message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.'
});

// 2. General API Limiter (Prevents DDoS and scrapers)
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300,                  // Max 300 requests per IP
  message: 'API rate limit exceeded. Please reduce request frequency.'
});
