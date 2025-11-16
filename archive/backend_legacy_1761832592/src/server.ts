import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { errorLogger } from './middleware/errorLogger';
import { responseHandler } from './middleware/responseHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { logger } from './middleware/logger';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import notificationRoutes from './routes/notification';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000', // Vite's configured port
  'http://localhost:5173', // Vite's default port (fallback)
  'https://myusersite.vercel.app' // Your Vercel deployment URL
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/notifications', notificationRoutes);

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