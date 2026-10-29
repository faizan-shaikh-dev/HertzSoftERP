import { Router } from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  reviseQuotation,
  updateQuotationStatus,
  deleteQuotation,
  getQuotationMetrics,
  getPrintableQuotation
} from './quotation.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect with Token
router.use(authenticateToken);

// Metrics endpoint
router.get('/metrics', getQuotationMetrics);

// Printable HTML view
router.get('/:id/print', getPrintableQuotation);

// Quotation Endpoints
router.post('/', createQuotation);                                         // Create new quotation
router.get('/', getQuotations);                                            // Get all quotations
router.get('/:id', getQuotationById);                                      // Get single quotation
router.put('/:id', updateQuotation);                                       // Update draft quotation
router.post('/:id/revise', reviseQuotation);                               // Revise (Version 2, Supersedes Version 1)
router.patch('/:id/status', updateQuotationStatus);                        // Update quotation status
router.delete('/:id', authorizeRoles('Administrator'), deleteQuotation);   // Delete quotation (Admin only)

export default router;

