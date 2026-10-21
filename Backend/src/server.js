//Packages Import
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool  from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

//Routes Import
import authRoutes from './modules/auth.routes.js';
import leadRoutes from './modules/lead.routes.js';
import clientRoutes from './modules/client.routes.js';
import projectRoutes from './modules/project.routes.js';
import paymentRoutes from './modules/payment.routes.js';
import certificateRoutes from './modules/certificate.routes.js';
import dashboardRoutes from './modules/dashboard.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hertzsoft ERP Backend is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Global 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
});

//Global Error Handler
app.use(errorHandler)

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
