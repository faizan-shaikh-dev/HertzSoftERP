import { Router } from "express";
import { register, login, refresh, logout, updateProfile } from "./auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Register Route (Sanitized, Validated & Protected against spam)
router.post('/register', authLimiter, validateBody(registerSchema), register);

// Login Route (Strict rate limiting against brute-force password guessing)
router.post('/login', authLimiter, validateBody(loginSchema), login);

// Refresh Access Token Route (Rotates refresh token)
router.post('/refresh', validateBody(refreshTokenSchema), refresh);

// Logout Route (Revokes active refresh token)
router.post('/logout', logout);

// Edit Account Profile Route (Protected by JWT)
router.put('/profile', authenticateToken, updateProfile);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
