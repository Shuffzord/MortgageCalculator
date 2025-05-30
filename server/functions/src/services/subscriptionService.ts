import { firestore } from '../config/firebase';
import { stripeService } from './stripeService';
import { TierManagementService } from './tierManagementService';
import { logger } from '../utils/logger';
import { UserTier } from '../types/user';
import {
  Subscription,
  PaymentHistory,
  SubscriptionStatus,
  StripeSubscription,
  StripeEvent,
  DEFAULT_GRACE_PERIOD,
  StripeWebhookEventType
} from '../types/payment';

class SubscriptionService {
  private subscriptionsCollection = firestore.collection('subscriptions');
  private paymentHistoryCollection = firestore.collection('paymentHistory');

  /**
   * Create or update subscription from Stripe data
   */
  async createOrUpdateSubscription(stripeSubscription: StripeSubscription, userId?: string): Promise<Subscription> {
    try {
      let resolvedUserId = userId;

      // If userId not provided, get it from customer metadata
      if (!resolvedUserId) {
        const customer = await stripeService.getStripeInstance().customers.retrieve(
          stripeSubscription.customer as string
        );
        
        if (customer.deleted) {
          throw new Error('Customer has been deleted');
        }

        resolvedUserId = customer.metadata?.userId;
        if (!resolvedUserId) {
          throw new Error('User ID not found in customer metadata');
        }
      }

      const subscriptionData: Subscription = {
        id: stripeSubscription.id,
        userId: resolvedUserId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer as string,
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        createdAt: new Date(),
        updatedAt: new Date(),
        priceId: stripeSubscription.items.data[0]?.price.id,
        quantity: stripeSubscription.items.data[0]?.quantity || 1,
      };

      // Check if subscription already exists
      const existingDoc = await this.subscriptionsCollection.doc(stripeSubscription.id).get();
      
      if (existingDoc.exists) {
        // Update existing subscription
        subscriptionData.createdAt = existingDoc.data()!.createdAt.toDate();
        await this.subscriptionsCollection.doc(stripeSubscription.id).update({
          ...subscriptionData,
          updatedAt: new Date(),
        });
        logger.info(`Updated subscription: ${stripeSubscription.id} for user: ${resolvedUserId}`);
      } else {
        // Create new subscription
        await this.subscriptionsCollection.doc(stripeSubscription.id).set(subscriptionData);
        logger.info(`Created subscription: ${stripeSubscription.id} for user: ${resolvedUserId}`);
      }

      // Update user tier based on subscription status
      await this.updateUserTierFromSubscription(resolvedUserId, subscriptionData);

      return subscriptionData;
    } catch (error) {
      logger.error('Error creating/updating subscription:', error);
      throw new Error('Failed to create or update subscription');
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const snapshot = await this.subscriptionsCollection
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'trialing', 'past_due'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        currentPeriodStart: doc.data().currentPeriodStart.toDate(),
        currentPeriodEnd: doc.data().currentPeriodEnd.toDate(),
      } as Subscription;
    } catch (error) {
      logger.error(`Error getting subscription for user ${userId}:`, error);
      throw new Error('Failed to get user subscription');
    }
  }

  /**
   * Get subscription status with grace period information
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          subscription: null,
          isActive: false,
        };
      }

      const now = new Date();
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      
      let gracePeriodActive = false;
      let daysUntilExpiry: number | undefined;

      if (subscription.status === 'past_due') {
        const daysSinceExpiry = Math.floor(
          (now.getTime() - subscription.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24)
        );
        gracePeriodActive = daysSinceExpiry <= DEFAULT_GRACE_PERIOD.daysAfterFailure;
      }

      if (subscription.currentPeriodEnd > now) {
        daysUntilExpiry = Math.ceil(
          (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        subscription,
        isActive: isActive || gracePeriodActive,
        daysUntilExpiry,
        gracePeriodActive,
      };
    } catch (error) {
      logger.error(`Error getting subscription status for user ${userId}:`, error);
      throw new Error('Failed to get subscription status');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel in Stripe
      const stripeSubscription = await stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelAtPeriodEnd
      );

      // Update local subscription
      const updatedSubscription = await this.createOrUpdateSubscription(stripeSubscription, userId);

      logger.info(`${cancelAtPeriodEnd ? 'Scheduled cancellation for' : 'Cancelled'} subscription for user: ${userId}`);

      return updatedSubscription;
    } catch (error) {
      logger.error(`Error cancelling subscription for user ${userId}:`, error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string): Promise<Subscription> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No subscription found');
      }

      if (!subscription.cancelAtPeriodEnd) {
        throw new Error('Subscription is not scheduled for cancellation');
      }

      // Reactivate in Stripe
      const stripeSubscription = await stripeService.reactivateSubscription(
        subscription.stripeSubscriptionId
      );

      // Update local subscription
      const updatedSubscription = await this.createOrUpdateSubscription(stripeSubscription, userId);

      logger.info(`Reactivated subscription for user: ${userId}`);

      return updatedSubscription;
    } catch (error) {
      logger.error(`Error reactivating subscription for user ${userId}:`, error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Record payment history
   */
  async recordPayment(
    userId: string,
    stripePaymentIntentId: string,
    amount: number,
    currency: string,
    status: string,
    stripeInvoiceId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentHistory> {
    try {
      const paymentData: PaymentHistory = {
        id: stripePaymentIntentId,
        userId,
        stripePaymentIntentId,
        stripeInvoiceId,
        amount,
        currency,
        status: status as PaymentHistory['status'],
        description,
        createdAt: new Date(),
        metadata,
      };

      await this.paymentHistoryCollection.doc(stripePaymentIntentId).set(paymentData);

      logger.info(`Recorded payment: ${stripePaymentIntentId} for user: ${userId}`);

      return paymentData;
    } catch (error) {
      logger.error('Error recording payment:', error);
      throw new Error('Failed to record payment');
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string, limit: number = 10): Promise<PaymentHistory[]> {
    try {
      const snapshot = await this.paymentHistoryCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as PaymentHistory[];
    } catch (error) {
      logger.error(`Error getting payment history for user ${userId}:`, error);
      throw new Error('Failed to get payment history');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: StripeEvent): Promise<void> {
    try {
      logger.info(`Processing webhook event: ${event.type}`);

      switch (event.type) {
        case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED:
        case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
          await this.handleSubscriptionEvent(event.data.object as StripeSubscription);
          break;

        case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED:
          await this.handleSubscriptionDeleted(event.data.object as StripeSubscription);
          break;

        case StripeWebhookEventType.INVOICE_PAYMENT_SUCCEEDED:
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case StripeWebhookEventType.INVOICE_PAYMENT_FAILED:
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle subscription events (created/updated)
   */
  private async handleSubscriptionEvent(subscription: StripeSubscription): Promise<void> {
    await this.createOrUpdateSubscription(subscription);
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: StripeSubscription): Promise<void> {
    try {
      // Update subscription status to cancelled
      await this.subscriptionsCollection.doc(subscription.id).update({
        status: 'cancelled',
        updatedAt: new Date(),
      });

      // Get user ID and downgrade to free tier
      const customer = await stripeService.getStripeInstance().customers.retrieve(
        subscription.customer as string
      );
      
      if (!customer.deleted && customer.metadata?.userId) {
        await TierManagementService.downgradeUserToFree(
          customer.metadata.userId,
          `Subscription deleted: ${subscription.id}`
        );
        logger.info(`Downgraded user ${customer.metadata.userId} to free tier after subscription deletion`);
      }
    } catch (error) {
      logger.error('Error handling subscription deletion:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    try {
      if (invoice.subscription) {
        // Get customer and user ID
        const customer = await stripeService.getStripeInstance().customers.retrieve(invoice.customer);
        
        if (!customer.deleted && customer.metadata?.userId) {
          await this.recordPayment(
            customer.metadata.userId,
            invoice.payment_intent,
            invoice.amount_paid,
            invoice.currency,
            'succeeded',
            invoice.id,
            `Payment for subscription ${invoice.subscription}`
          );

          // Ensure user has premium tier
          await TierManagementService.upgradeUserToPremium(
            customer.metadata.userId,
            invoice.subscription
          );
        }
      }
    } catch (error) {
      logger.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: any): Promise<void> {
    try {
      if (invoice.subscription) {
        // Get customer and user ID
        const customer = await stripeService.getStripeInstance().customers.retrieve(invoice.customer);
        
        if (!customer.deleted && customer.metadata?.userId) {
          await this.recordPayment(
            customer.metadata.userId,
            invoice.payment_intent,
            invoice.amount_due,
            invoice.currency,
            'failed',
            invoice.id,
            `Failed payment for subscription ${invoice.subscription}`
          );

          // Note: Don't immediately downgrade on failed payment
          // Grace period logic is handled in getSubscriptionStatus
          logger.warn(`Payment failed for user ${customer.metadata.userId}, subscription ${invoice.subscription}`);
        }
      }
    } catch (error) {
      logger.error('Error handling payment failed:', error);
      throw error;
    }
  }

  /**
   * Update user tier based on subscription status
   */
  private async updateUserTierFromSubscription(userId: string, subscription: Subscription): Promise<void> {
    try {
      const targetTier = (subscription.status === 'active' || subscription.status === 'trialing') 
        ? UserTier.Premium 
        : UserTier.Free;

      if (targetTier === UserTier.Premium) {
        await TierManagementService.upgradeUserToPremium(
          userId,
          subscription.stripeSubscriptionId
        );
      } else {
        await TierManagementService.downgradeUserToFree(
          userId,
          `Subscription status: ${subscription.status}`
        );
      }
      logger.info(`Updated user ${userId} tier to ${targetTier} based on subscription status: ${subscription.status}`);
    } catch (error) {
      logger.error(`Error updating user tier for user ${userId}:`, error);
      // Don't throw here as subscription creation should still succeed
    }
  }

  /**
   * Map Stripe subscription status to our internal status
   */
  private mapStripeStatus(stripeStatus: string): Subscription['status'] {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'cancelled';
      case 'past_due':
        return 'past_due';
      case 'unpaid':
        return 'unpaid';
      case 'incomplete':
        return 'incomplete';
      case 'incomplete_expired':
        return 'incomplete_expired';
      case 'trialing':
        return 'trialing';
      default:
        logger.warn(`Unknown Stripe status: ${stripeStatus}, defaulting to 'unpaid'`);
        return 'unpaid';
    }
  }

  /**
   * Clean up expired grace periods (should be run periodically)
   */
  async cleanupExpiredGracePeriods(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_GRACE_PERIOD.daysAfterFailure);

      const expiredSubscriptions = await this.subscriptionsCollection
        .where('status', '==', 'past_due')
        .where('currentPeriodEnd', '<', cutoffDate)
        .get();

      for (const doc of expiredSubscriptions.docs) {
        const subscription = doc.data() as Subscription;
        
        // Downgrade user to free tier
        await TierManagementService.downgradeUserToFree(
          subscription.userId,
          'Subscription expired'
        );
        
        logger.info(`Downgraded user ${subscription.userId} to free tier after grace period expiry`);
      }

      if (expiredSubscriptions.size > 0) {
        logger.info(`Processed ${expiredSubscriptions.size} expired grace periods`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired grace periods:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();