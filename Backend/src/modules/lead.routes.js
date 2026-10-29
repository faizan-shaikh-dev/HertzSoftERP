import { Router } from 'express';
import {
  createLead,
  getLeads,
  getAssignees,
  checkDuplicatePhone,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead,
  createFollowUp,
  getLeadFollowUps,
  getFollowUpReminders,
  completeFollowUp,
  deleteFollowUp,
  convertLeadToClient
} from './lead.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all lead routes with authentication middleware
router.use(authenticateToken);

// Follow-up Reminders (Must be before /:id)
router.get('/follow-ups/reminders', getFollowUpReminders);       // Get due & overdue follow-up reminders
router.patch('/follow-ups/:id/complete', completeFollowUp);      // Mark follow-up as completed
router.delete('/follow-ups/:id', deleteFollowUp);                // Delete follow-up record

// Lead Endpoints
router.post('/', createLead);                                    // Create a new lead
router.get('/', getLeads);                                       // Get all leads (with filters & search)
router.get('/assignees', getAssignees);                          // Get active assignees/team members
router.get('/check-duplicate', checkDuplicatePhone);             // Check duplicate normalized phone
router.get('/:id', getLeadById);                                 // Get single lead details by ID
router.put('/:id', updateLead);                                  // Update lead details (PUT)
router.patch('/:id', updateLead);                                // Update lead details (PATCH)
router.patch('/:id/status', updateLeadStatus);                   // Update lead pipeline status (Lost reason / On Hold)
router.post('/:id/convert-to-client', convertLeadToClient);      // Convert WON lead to Client
router.delete('/:id', authorizeRoles('Administrator'), deleteLead); // Delete a lead (Admin only)

// Lead Follow-up Records
router.get('/:leadId/follow-ups', getLeadFollowUps);             // Get all follow-up history for a lead
router.post('/:leadId/follow-ups', createFollowUp);              // Log a new follow-up interaction

export default router;
