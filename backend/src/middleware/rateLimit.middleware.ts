import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

// Strict limiter for auth endpoints — prevents brute-force attacks
// In development, limit is relaxed so testing doesn't hit 429s
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 minutes
  max: isDev ? 1000 : 20,            // dev: unlimited-ish | prod: 20 req/window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

// General API limiter — light throttle on all routes
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please slow down",
  },
});
