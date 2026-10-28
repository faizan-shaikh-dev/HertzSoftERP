import { Router } from 'express';
import {
  createLead,
  getLeads,
  getAssignees,
  checkDuplicatePhone,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead
} from './lead.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all lead routes with authentication middleware
router.use(authenticateToken);

// Lead Endpoints
router.post('/', createLead);                                    // Create a new lead
router.get('/', getLeads);                                       // Get all leads (with filters & search)
router.get('/assignees', getAssignees);                          // Get active assignees/team members
router.get('/check-duplicate', checkDuplicatePhone);             // Check duplicate normalized phone
router.get('/:id', getLeadById);                                 // Get single lead details by ID
router.put('/:id', updateLead);                                  // Update lead details (PUT)
router.patch('/:id', updateLead);                                // Update lead details (PATCH)
router.patch('/:id/status', updateLeadStatus);                   // Update lead pipeline status (Lost reason / On Hold)
router.delete('/:id', authorizeRoles('Administrator'), deleteLead); // Delete a lead (Admin only)

export default router;
