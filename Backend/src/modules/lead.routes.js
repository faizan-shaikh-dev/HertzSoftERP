import { Router } from 'express';
import {
  createLead,
  getLeads,
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
router.get('/:id', getLeadById);                                 // Get single lead details by ID
router.patch('/:id', updateLead);                                // Update lead details
router.patch('/:id/status', updateLeadStatus);                   // Update lead pipeline status
router.delete('/:id', authorizeRoles('Administrator'), deleteLead); // Delete a lead (Admin only)

export default router;
