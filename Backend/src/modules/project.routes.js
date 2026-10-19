import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} from './project.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Protect with Token
router.use(authenticateToken);

// Project Endpoints
router.post('/', createProject);        // Create new project
router.get('/', getProjects);           // Get all projects (with auto-calculated total_paid & due_balance)
router.get('/:id', getProjectById);     // Get project details + payment installment history
router.patch('/:id', updateProject);    // Update project status/deadline/cost
router.delete('/:id', deleteProject);   // Delete project

export default router;
