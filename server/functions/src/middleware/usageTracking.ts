import { Request, Response, NextFunction } from 'express';
import { firestore } from '../config/firebase';
import { UserTier } from '../types/user';
import { TIER_LIMITS, UsageStats } from '../types/calculation';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { Transaction } from 'firebase-admin/firestore';


export class UsageTrackingService {
  private static getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  static async getUserUsageStats(userId: string): Promise<UsageStats> {
    const currentMonth = this.getCurrentMonth();
    const usageRef = firestore.collection('usage_stats').doc(`${userId}_${currentMonth}`);
    
    try {
      const usageDoc = await usageRef.get();
      
      if (!usageDoc.exists) {
        // Create new usage stats for the month
        const newStats: UsageStats = {
          userId,
          month: currentMonth,
          calculationsSaved: 0,
          lastReset: new Date()
        };
        
        await usageRef.set(newStats);
        return newStats;
      }
      
      return usageDoc.data() as UsageStats;
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      throw new AppError('Failed to retrieve usage statistics', 500);
    }
  }

  static async incrementCalculationCount(userId: string): Promise<void> {
    const currentMonth = this.getCurrentMonth();
    const usageRef = firestore.collection('usage_stats').doc(`${userId}_${currentMonth}`);
    
    try {
      await firestore.runTransaction(async (transaction: Transaction) => {
        const usageDoc = await transaction.get(usageRef);
        
        if (!usageDoc.exists) {
          const newStats: UsageStats = {
            userId,
            month: currentMonth,
            calculationsSaved: 1,
            lastReset: new Date()
          };
          transaction.set(usageRef, newStats);
        } else {
          const currentStats = usageDoc.data() as UsageStats;
          transaction.update(usageRef, {
            calculationsSaved: currentStats.calculationsSaved + 1
          });
        }
      });
    } catch (error) {
      logger.error('Error incrementing calculation count:', error);
      throw new AppError('Failed to update usage statistics', 500);
    }
  }

  static async checkCalculationLimit(userId: string, userTier: UserTier): Promise<boolean> {
    try {
      const usageStats = await this.getUserUsageStats(userId);
      const tierLimit = TIER_LIMITS[userTier];
      
      // Premium users have unlimited calculations
      if (tierLimit.maxCalculations === -1) {
        return true;
      }
      
      return usageStats.calculationsSaved < tierLimit.maxCalculations;
    } catch (error) {
      logger.error('Error checking calculation limit:', error);
      throw new AppError('Failed to check usage limits', 500);
    }
  }

  static async resetMonthlyUsage(userId: string): Promise<void> {
    const currentMonth = this.getCurrentMonth();
    const usageRef = firestore.collection('usage_stats').doc(`${userId}_${currentMonth}`);
    
    try {
      const resetStats: UsageStats = {
        userId,
        month: currentMonth,
        calculationsSaved: 0,
        lastReset: new Date()
      };
      
      await usageRef.set(resetStats);
      logger.info(`Reset monthly usage for user ${userId}`);
    } catch (error) {
      logger.error('Error resetting monthly usage:', error);
      throw new AppError('Failed to reset usage statistics', 500);
    }
  }
}

export const checkCalculationLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { uid, tier } = req.user;
    if (!tier) {
      throw new AppError('User tier not found', 400);
    }

    const canSave = await UsageTrackingService.checkCalculationLimit(uid, tier);
    
    if (!canSave) {
      const usageStats = await UsageTrackingService.getUserUsageStats(uid);
      const tierLimit = TIER_LIMITS[tier];
      
      throw new AppError(
        `Calculation limit reached. You have saved ${usageStats.calculationsSaved}/${tierLimit.maxCalculations} calculations this month. Upgrade to Premium for unlimited saves.`,
        403,
        'CALCULATION_LIMIT_REACHED'
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const trackCalculationSave = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Store the original res.json function
    const originalJson = res.json;
    
    // Override res.json to track successful saves
    res.json = function(body: any) {
      // Only increment if the response was successful (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        UsageTrackingService.incrementCalculationCount(req.user!.uid)
          .catch(error => {
            logger.error('Error tracking calculation save:', error);
            // Don't fail the request if tracking fails
          });
      }
      
      // Call the original json function
      return originalJson.call(this, body);
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const getUserUsageLimits = async (userId: string, userTier: UserTier) => {
  try {
    const usageStats = await UsageTrackingService.getUserUsageStats(userId);
    const tierLimits = TIER_LIMITS[userTier];
    
    return {
      tier: userTier,
      calculationsSaved: usageStats.calculationsSaved,
      maxCalculations: tierLimits.maxCalculations,
      remainingCalculations: tierLimits.maxCalculations === -1 
        ? -1 
        : Math.max(0, tierLimits.maxCalculations - usageStats.calculationsSaved),
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // First day of next month
      currentMonth: usageStats.month
    };
  } catch (error) {
    logger.error('Error getting user usage limits:', error);
    throw new AppError('Failed to retrieve usage limits', 500);
  }
};