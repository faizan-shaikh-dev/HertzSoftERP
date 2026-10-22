import { Router } from 'express';
import {
  recordPayment,
  getPayments,
  getPaymentById,
  deletePayment,
  getFinancialSummary
} from './payment.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all routes with Token
router.use(authenticateToken);

// 1. Overall Financial Summary (Admin and Finance only)
router.get('/summary', authorizeRoles('Administrator', 'Finance'), getFinancialSummary);

// 2. Payment CRUD Endpoints
router.post('/', recordPayment);                                       // Record a new payment (installment)
router.get('/', getPayments);                                          // Get payments list (?project_id=... or ?client_id=...)
router.get('/:id', getPaymentById);                                    // Get single payment receipt
router.delete('/:id', authorizeRoles('Administrator'), deletePayment); // Delete a payment record (Admin only)

export default router;
