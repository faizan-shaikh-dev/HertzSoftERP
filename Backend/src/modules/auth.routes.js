import { Router } from "express";
import { register, login, refresh, logout, updateProfile } from "./auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.validation.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Register Route (Sanitized & Validated)
router.post('/register', validateBody(registerSchema), register);

// Login Route (Sanitized & Validated)
router.post('/login', validateBody(loginSchema), login);

// Refresh Access Token Route (Rotates refresh token)
router.post('/refresh', validateBody(refreshTokenSchema), refresh);

// Logout Route (Revokes active refresh token)
router.post('/logout', logout);

// Edit Account Profile Route (Protected by JWT)
router.put('/profile', authenticateToken, updateProfile);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
