import { Router } from "express";
import { register, login } from "./auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

const router = Router();

// Register Routes (Sanitized & Validated)
router.post('/register', validateBody(registerSchema), register);

// Login Routes (Sanitized & Validated)
router.post('/login', validateBody(loginSchema), login);

export default router;