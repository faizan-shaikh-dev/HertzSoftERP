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
import quotationRoutes from './modules/quotation.routes.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Disable ETag generation to prevent 304 Not Modified and ensure fresh 200 OK responses
app.set('etag', false);

// Security Headers & Strict CORS
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' })); // Limit payload size to protect against large body DoS
app.use(morgan('dev'));

// General Rate Limiter for all APIs
app.use('/api', apiLimiter);

// Disable client caching on all API endpoints so updates reflect immediately
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/quotations', quotationRoutes);
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
