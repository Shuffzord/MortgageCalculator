import Stripe from 'stripe';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CustomerPortalResponse,
  StripeCustomer,
  StripeSubscription,
  PaymentMethodInfo,
  SUBSCRIPTION_PLANS
} from '../types/payment';

class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    });

    logger.info('Stripe service initialized');
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(email: string, userId: string, name?: string): Promise<StripeCustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      logger.info(`Created Stripe customer: ${customer.id} for user: ${userId}`);
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get or create a Stripe customer
   */
  async getOrCreateCustomer(email: string, userId: string, name?: string): Promise<StripeCustomer> {
    try {
      // First, try to find existing customer by email
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        
        // Update metadata if userId is missing
        if (!customer.metadata?.userId) {
          await this.stripe.customers.update(customer.id, {
            metadata: { userId },
          });
        }

        logger.info(`Found existing Stripe customer: ${customer.id} for user: ${userId}`);
        return customer;
      }

      // Create new customer if none exists
      return await this.createCustomer(email, userId, name);
    } catch (error) {
      logger.error('Error getting or creating Stripe customer:', error);
      throw new Error('Failed to get or create customer');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const { priceId, successUrl, cancelUrl, mode = 'subscription' } = request;

      // Validate price ID
      const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
      if (!plan) {
        throw new Error(`Invalid price ID: ${priceId}`);
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
      };

      if (mode === 'subscription') {
        sessionParams.subscription_data = {
          metadata: {
            planId: plan.id,
          },
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      logger.info(`Created checkout session: ${session.id} for customer: ${customerId}`);

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create customer portal session
   */
  async createCustomerPortalSession(customerId: string): Promise<CustomerPortalResponse> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${config.CLIENT_URL}/account/subscription`,
      });

      logger.info(`Created customer portal session for customer: ${customerId}`);

      return {
        url: session.url,
      };
    } catch (error) {
      logger.error('Error creating customer portal session:', error);
      throw new Error('Failed to create customer portal session');
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      });

      return subscription;
    } catch (error) {
      logger.error(`Error retrieving subscription ${subscriptionId}:`, error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Get customer's active subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<StripeSubscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.items.data.price'],
      });

      return subscriptions.data;
    } catch (error) {
      logger.error(`Error retrieving subscriptions for customer ${customerId}:`, error);
      throw new Error('Failed to retrieve subscriptions');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<StripeSubscription> {
    try {
      let subscription: Stripe.Subscription;

      if (cancelAtPeriodEnd) {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      }

      logger.info(`${cancelAtPeriodEnd ? 'Scheduled cancellation for' : 'Cancelled'} subscription: ${subscriptionId}`);

      return subscription;
    } catch (error) {
      logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate subscription (remove cancel_at_period_end)
   */
  async reactivateSubscription(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      logger.info(`Reactivated subscription: ${subscriptionId}`);

      return subscription;
    } catch (error) {
      logger.error(`Error reactivating subscription ${subscriptionId}:`, error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Get customer's payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        } : undefined,
      }));
    } catch (error) {
      logger.error(`Error retrieving payment methods for customer ${customerId}:`, error);
      throw new Error('Failed to retrieve payment methods');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      logger.error(`Error retrieving invoice ${invoiceId}:`, error);
      throw new Error('Failed to retrieve invoice');
    }
  }

  /**
   * Get customer's invoices
   */
  async getCustomerInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data;
    } catch (error) {
      logger.error(`Error retrieving invoices for customer ${customerId}:`, error);
      throw new Error('Failed to retrieve invoices');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      if (!config.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );

      return event;
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get subscription plans
   */
  getSubscriptionPlans() {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}

export const stripeService = new StripeService();