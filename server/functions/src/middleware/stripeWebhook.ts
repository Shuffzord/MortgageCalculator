import { Request, Response, NextFunction } from 'express';
import { stripeService } from '../services/stripeService';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

export interface StripeWebhookRequest extends Request {
  rawBody?: Buffer;
  stripeEvent?: import('stripe').Stripe.Event;
}

/**
 * Middleware to verify Stripe webhook signatures
 * This should be used before any JSON parsing middleware for webhook endpoints
 */
export const verifyStripeWebhook = (req: StripeWebhookRequest, res: Response, next: NextFunction): void => {
  try {
    const signature = req.get('stripe-signature');
    
    if (!signature) {
      throw new CustomError('Missing Stripe signature', 400);
    }

    // Get raw body - this should be set by express.raw() middleware
    const rawBody = req.rawBody || req.body;
    
    if (!rawBody) {
      throw new CustomError('Missing request body', 400);
    }

    // Convert to string if it's a Buffer
    const payload = Buffer.isBuffer(rawBody) ? rawBody.toString() : rawBody;

    // Verify the webhook signature
    const event = stripeService.verifyWebhookSignature(payload, signature);
    
    // Attach the verified event to the request
    req.stripeEvent = event;
    
    logger.info(`Verified Stripe webhook: ${event.type} (${event.id})`);
    
    next();
  } catch (error) {
    logger.error('Stripe webhook verification failed:', error);
    
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        error: error.message
      });
      return;
    }
    
    res.status(400).json({
      error: 'Webhook verification failed'
    });
  }
};

/**
 * Middleware to capture raw body for Stripe webhooks
 * This should be used before express.json() middleware
 */
export const captureRawBody = (req: StripeWebhookRequest, res: Response, next: NextFunction) => {
  if (req.originalUrl?.includes('/webhook')) {
    let data = '';
    
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = Buffer.from(data, 'utf8');
      next();
    });
  } else {
    next();
  }
};

/**
 * Express middleware to handle raw body for Stripe webhooks
 * Use this with express.raw() for webhook endpoints
 */
export const rawBodyMiddleware = (req: StripeWebhookRequest, res: Response, next: NextFunction) => {
  if (req.originalUrl?.includes('/webhook')) {
    // Store the raw body for webhook verification
    req.rawBody = req.body;
  }
  next();
};