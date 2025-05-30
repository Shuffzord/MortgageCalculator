import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { stripeService } from '../services/stripeService';
import { subscriptionService } from '../services/subscriptionService';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';
import {
  CustomerPortalResponse
} from '../types/payment';

const router = Router();

/**
 * Get current subscription status for authenticated user
 */
router.get('/status',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const subscriptionStatus = await subscriptionService.getSubscriptionStatus(req.user.uid);

      res.json({
        success: true,
        data: subscriptionStatus
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Cancel subscription for authenticated user
 */
router.post('/cancel',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const { cancelAtPeriodEnd = true } = req.body;

      const subscription = await subscriptionService.cancelSubscription(
        req.user.uid,
        cancelAtPeriodEnd
      );

      logger.info(`User ${req.user.uid} ${cancelAtPeriodEnd ? 'scheduled cancellation for' : 'cancelled'} subscription`);

      res.json({
        success: true,
        data: {
          subscription,
          message: cancelAtPeriodEnd 
            ? 'Subscription will be cancelled at the end of the current billing period'
            : 'Subscription has been cancelled immediately'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Reactivate subscription for authenticated user
 */
router.post('/reactivate',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const subscription = await subscriptionService.reactivateSubscription(req.user.uid);

      logger.info(`User ${req.user.uid} reactivated subscription`);

      res.json({
        success: true,
        data: {
          subscription,
          message: 'Subscription has been reactivated'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get customer portal URL for subscription management
 */
router.get('/portal',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!req.user.email) {
        throw new CustomError('User email is required', 400);
      }

      // Get or create Stripe customer
      const customer = await stripeService.getOrCreateCustomer(
        req.user.email,
        req.user.uid,
        req.user.displayName
      );

      // Create customer portal session
      const portalSession = await stripeService.createCustomerPortalSession(customer.id);

      logger.info(`Created customer portal session for user ${req.user.uid}`);

      const response: CustomerPortalResponse = {
        url: portalSession.url
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
 * Get subscription details for authenticated user
 */
router.get('/details',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const subscription = await subscriptionService.getUserSubscription(req.user.uid);

      if (!subscription) {
        res.json({
          success: true,
          data: null,
          message: 'No active subscription found'
        });
        return;
      }

      // Get additional Stripe subscription details if needed
      let stripeSubscription = null;
      try {
        stripeSubscription = await stripeService.getSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        logger.warn(`Could not fetch Stripe subscription details: ${error}`);
      }

      res.json({
        success: true,
        data: {
          subscription,
          stripeDetails: stripeSubscription ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_start: (stripeSubscription as any).current_period_start,
            current_period_end: (stripeSubscription as any).current_period_end,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            items: stripeSubscription.items?.data?.map(item => ({
              price: {
                id: item.price.id,
                nickname: item.price.nickname,
                unit_amount: item.price.unit_amount,
                currency: item.price.currency,
                recurring: item.price.recurring
              },
              quantity: item.quantity
            }))
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get payment methods for authenticated user
 */
router.get('/payment-methods',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!req.user.email) {
        throw new CustomError('User email is required', 400);
      }

      // Get or create Stripe customer
      const customer = await stripeService.getOrCreateCustomer(
        req.user.email,
        req.user.uid,
        req.user.displayName
      );

      // Get payment methods
      const paymentMethods = await stripeService.getCustomerPaymentMethods(customer.id);

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get invoices for authenticated user
 */
router.get('/invoices',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      if (!req.user.email) {
        throw new CustomError('User email is required', 400);
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const maxLimit = 50;
      const actualLimit = Math.min(limit, maxLimit);

      // Get or create Stripe customer
      const customer = await stripeService.getOrCreateCustomer(
        req.user.email,
        req.user.uid,
        req.user.displayName
      );

      // Get invoices
      const invoices = await stripeService.getCustomerInvoices(customer.id, actualLimit);

      res.json({
        success: true,
        data: invoices.map(invoice => ({
          id: invoice.id,
          amount_paid: invoice.amount_paid,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          subscription: (invoice as any).subscription
        })),
        pagination: {
          limit: actualLimit,
          count: invoices.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Test endpoint to verify subscription system is working
 */
router.get('/test',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      // Test subscription service
      const subscription = await subscriptionService.getUserSubscription(req.user.uid);
      const subscriptionStatus = await subscriptionService.getSubscriptionStatus(req.user.uid);

      res.json({
        success: true,
        data: {
          message: 'Subscription system is operational',
          user: {
            uid: req.user.uid,
            email: req.user.email,
            tier: req.user.tier
          },
          subscription: subscription ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd
          } : null,
          subscriptionStatus: {
            isActive: subscriptionStatus.isActive,
            gracePeriodActive: subscriptionStatus.gracePeriodActive,
            daysUntilExpiry: subscriptionStatus.daysUntilExpiry
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;