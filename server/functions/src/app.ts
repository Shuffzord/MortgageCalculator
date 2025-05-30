import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';
import calculationRoutes from './routes/calculations';
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscription';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://mortgage-firebase-firebase.web.app' : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(rateLimiterMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/health', healthRoutes);
app.use('/calculations', calculationRoutes);
app.use('/payments', paymentRoutes);
app.use('/subscription', subscriptionRoutes);

// Version endpoint
app.get('/version', (req, res) => {
  res.json({ version: '1.0.0' });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

export default app;