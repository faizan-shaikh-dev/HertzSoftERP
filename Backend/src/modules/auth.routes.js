import { Router } from "express";
import { register, login } from "./auth.controller.js";

const  router = Router();

//Register Routes
router.post('/register', register);

//Login Routes
router.post('/login', login);

export default router;