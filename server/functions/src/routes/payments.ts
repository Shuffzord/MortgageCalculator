import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { stripeService } from '../services/stripeService';
import { subscriptionService } from '../services/subscriptionService';
import { verifyStripeWebhook, StripeWebhookRequest } from '../middleware/stripeWebhook';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  SUBSCRIPTION_PLANS
} from '../types/payment';

const router = Router();

/**
 * Create Stripe checkout session for subscription
 */
router.post('/create-checkout-session',
  authMiddleware,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
    body('successUrl').isURL().withMessage('Valid success URL is required'),
    body('cancelUrl').isURL().withMessage('Valid cancel URL is required'),
    body('mode').optional().isIn(['payment', 'subscription', 'setup']).withMessage('Invalid mode')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new CustomError('Validation failed', 400);
      }

      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const { priceId, successUrl, cancelUrl, mode = 'subscription' }: CreateCheckoutSessionRequest = req.body;

      // Validate price ID against our plans
      const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
      if (!plan) {
        throw new CustomError('Invalid subscription plan', 400);
      }

      // Get or create Stripe customer
      const customer = await stripeService.getOrCreateCustomer(
        req.user.email!,
        req.user.uid,
        req.user.displayName
      );

      // Create checkout session
      const session = await stripeService.createCheckoutSession(customer.id, {
        priceId,
        successUrl,
        cancelUrl,
        mode
      });

      logger.info(`Created checkout session for user ${req.user.uid}: ${session.sessionId}`);

      const response: CreateCheckoutSessionResponse = {
        sessionId: session.sessionId,
        url: session.url
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Handle Stripe webhooks
 */
router.post('/webhook',
  // Use raw body parser for webhook signature verification
  (req: Request, res: Response, next: NextFunction) => {
    if (req.get('content-type') === 'application/json') {
      req.body = JSON.stringify(req.body);
    }
    next();
  },
  verifyStripeWebhook,
  async (req: StripeWebhookRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.stripeEvent) {
        throw new CustomError('No Stripe event found', 400);
      }

      const event = req.stripeEvent;

      logger.info(`Processing Stripe webhook: ${event.type} (${event.id})`);

      // Handle the event
      await subscriptionService.handleWebhookEvent(event);

      logger.info(`Successfully processed webhook: ${event.type} (${event.id})`);

      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error) {
      logger.error(`Error processing webhook: ${error}`);
      next(error);
    }
  }
);

/**
 * Get payment history for authenticated user
 */
router.get('/history',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const maxLimit = 50;
      const actualLimit = Math.min(limit, maxLimit);

      const paymentHistory = await subscriptionService.getPaymentHistory(req.user.uid, actualLimit);

      res.json({
        success: true,
        data: paymentHistory,
        pagination: {
          limit: actualLimit,
          count: paymentHistory.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get available subscription plans
 */
router.get('/plans',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = stripeService.getSubscriptionPlans();

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Stripe publishable key (for frontend)
 */
router.get('/config',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      
      res.json({
        success: true,
        data: {
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Test endpoint to verify payment system is working
 */
router.get('/test',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      // Test Stripe connection
      const plans = stripeService.getSubscriptionPlans();
      
      // Test database connection
      const subscription = await subscriptionService.getUserSubscription(req.user.uid);

      res.json({
        success: true,
        data: {
          message: 'Payment system is operational',
          user: {
            uid: req.user.uid,
            email: req.user.email!,
            tier: req.user.tier
          },
          stripe: {
            connected: true,
            plansAvailable: plans.length
          },
          subscription: subscription ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;