import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  createProjectActivity,
  getProjectActivities,
  deleteProjectActivity
} from './project.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect with Token
router.use(authenticateToken);

// Project Endpoints
router.post('/', createProject);                                                 // Create new project
router.get('/', getProjects);                                                    // Get all projects (with auto-calculated total_paid & due_balance)
router.get('/:id', getProjectById);                                              // Get project details + payment installment history & activities
router.put('/:id', updateProject);                                               // Update project (PUT)
router.patch('/:id', updateProject);                                             // Update project (PATCH)
router.delete('/:id', authorizeRoles('Administrator'), deleteProject);           // Delete project (Admin only)

// Project Activity & Timeline Endpoints
router.get('/:id/activities', getProjectActivities);                             // Get project activity timeline
router.post('/:id/activities', createProjectActivity);                           // Record milestone / activity note
router.delete('/activities/:activityId', authorizeRoles('Administrator'), deleteProjectActivity); // Delete activity record (Admin only)

export default router;
