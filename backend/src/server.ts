import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { errorLogger } from './middleware/errorLogger';
import { responseHandler } from './middleware/responseHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { logger } from './middleware/logger';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import notificationRoutes from './routes/notification';
import stockRoutes from './routes/stockRoutes';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://myusersite.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(helmet());
app.use(logger);
app.use(morgan('dev'));
app.use(responseHandler);

// Apply rate limiting
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter as express.RequestHandler);
  app.use('/api', apiLimiter as express.RequestHandler);
}

// Health check route
app.use('/api', healthRoutes);

// API docs (Swagger)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stocks', stockRoutes);
// Stocks routes removed to keep stocks as a separate service/UI

// Static hosting for frontend build (optional)
const configuredDist = process.env.FRONTEND_DIST
  ? path.resolve(__dirname, process.env.FRONTEND_DIST)
  : undefined;
const frontendDist = configuredDist || path.resolve(__dirname, '../../../dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Fallback to index.html for SPA routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling
app.use(errorLogger);
app.use(errorHandler);

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;