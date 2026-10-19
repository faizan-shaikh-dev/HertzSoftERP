import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById
} from './project.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Protect with Token
router.use(authenticateToken);

// Client Endpoints
router.post('/', createClient);         // Create new client
router.get('/', getClients);            // Get all clients (with search)
router.get('/:id', getClientById);      // Get client by ID (with their projects & balance)

export default router;
