import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

// GET /api/dashboard/stats - Protected Route
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

export default router;
