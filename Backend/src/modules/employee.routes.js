import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as employeeController from './employee.controller.js';

const router = express.Router();

// Apply auth middleware to protect all HR employee endpoints
router.use(authenticateToken);

router.get('/stats/summary', employeeController.getEmployeeStats);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

export default router;
