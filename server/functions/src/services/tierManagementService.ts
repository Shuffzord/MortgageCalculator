import { firestore } from '../config/firebase';
import { UserTier } from '../types/user';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

/**
 * Internal Tier Management Service
 * 
 * This service provides secure, server-side functions for managing user tiers.
 * These functions are intended for internal use only (payment webhooks, admin operations, etc.)
 * and should NOT be exposed as public API endpoints.
 */
export class TierManagementService {
  
  /**
   * Internal function to update user tier
   * Used by payment webhooks and internal admin operations
   * 
   * @param userId - The user ID to update
   * @param tier - The new tier to assign
   * @param reason - Reason for the tier change (for logging)
   * @returns Promise<void>
   */
  static async updateUserTierInternal(
    userId: string, 
    tier: UserTier, 
    reason: string = 'Internal operation'
  ): Promise<void> {
    try {
      if (!userId) {
        throw new CustomError('User ID is required', 400);
      }

      if (!Object.values(UserTier).includes(tier)) {
        throw new CustomError('Invalid tier value', 400);
      }

      // Update user tier in Firestore
      await firestore.collection('users').doc(userId).set(
        { 
          tier,
          tierUpdatedAt: new Date().toISOString(),
          tierUpdateReason: reason
        }, 
        { merge: true }
      );

      logger.info(`User tier updated internally: ${userId} -> ${tier} (${reason})`);
    } catch (error) {
      logger.error('Error updating user tier internally:', error);
      throw error;
    }
  }

  /**
   * Upgrade user to premium tier
   * Typically called from payment webhook after successful subscription
   * 
   * @param userId - The user ID to upgrade
   * @param subscriptionId - The subscription ID (for tracking)
   * @returns Promise<void>
   */
  static async upgradeUserToPremium(
    userId: string, 
    subscriptionId?: string
  ): Promise<void> {
    const reason = subscriptionId 
      ? `Premium subscription created: ${subscriptionId}`
      : 'Premium upgrade';
    
    await this.updateUserTierInternal(userId, UserTier.Premium, reason);
  }

  /**
   * Downgrade user to free tier
   * Typically called when subscription is cancelled or expires
   * 
   * @param userId - The user ID to downgrade
   * @param reason - Reason for downgrade (cancellation, expiry, etc.)
   * @returns Promise<void>
   */
  static async downgradeUserToFree(
    userId: string, 
    reason: string = 'Subscription ended'
  ): Promise<void> {
    await this.updateUserTierInternal(userId, UserTier.Free, reason);
  }

  /**
   * Get user's current tier
   * Internal function for server-side tier checking
   * 
   * @param userId - The user ID to check
   * @returns Promise<UserTier>
   */
  static async getUserTierInternal(userId: string): Promise<UserTier> {
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      return userData?.tier || UserTier.Free;
    } catch (error) {
      logger.error('Error getting user tier internally:', error);
      throw error;
    }
  }

  /**
   * Bulk tier update for admin operations
   * Use with extreme caution - for admin/migration purposes only
   * 
   * @param updates - Array of {userId, tier, reason} objects
   * @returns Promise<void>
   */
  static async bulkUpdateTiers(
    updates: Array<{ userId: string; tier: UserTier; reason: string }>
  ): Promise<void> {
    try {
      const batch = firestore.batch();
      
      for (const update of updates) {
        const userRef = firestore.collection('users').doc(update.userId);
        batch.set(userRef, {
          tier: update.tier,
          tierUpdatedAt: new Date().toISOString(),
          tierUpdateReason: update.reason
        }, { merge: true });
      }
      
      await batch.commit();
      logger.info(`Bulk tier update completed for ${updates.length} users`);
    } catch (error) {
      logger.error('Error in bulk tier update:', error);
      throw error;
    }
  }
}

// Export individual functions for convenience
export const {
  updateUserTierInternal,
  upgradeUserToPremium,
  downgradeUserToFree,
  getUserTierInternal,
  bulkUpdateTiers
} = TierManagementService;