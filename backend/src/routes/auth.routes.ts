import { Router } from "express";
import { register, login, registerSchema, loginSchema } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate.middleware";
import { authRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Strict rate limiter on auth — 20 req / 15 min per IP
router.post("/register", authRateLimiter, validateBody(registerSchema), register);
router.post("/login", authRateLimiter, validateBody(loginSchema), login);

export default router;