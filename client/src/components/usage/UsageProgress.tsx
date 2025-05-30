import React from 'react';
import { AlertTriangle, CheckCircle, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';
import { TIER_LIMITS } from '@/lib/api/types';

interface UsageProgressProps {
  currentUsage: number;
  maxUsage: number;
  usageType: string;
  period?: string;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export function UsageProgress({
  currentUsage,
  maxUsage,
  usageType,
  period = 'this month',
  showUpgradeButton = true,
  onUpgrade,
  className
}: UsageProgressProps) {
  const { isPremium } = useAuth();

  // Calculate usage percentage
  const usagePercentage = maxUsage === -1 ? 0 : Math.min((currentUsage / maxUsage) * 100, 100);
  const isUnlimited = maxUsage === -1;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  // Determine status and styling
  const getStatusInfo = () => {
    if (isUnlimited) {
      return {
        status: 'unlimited',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        message: 'Unlimited usage'
      };
    }
    
    if (isAtLimit) {
      return {
        status: 'limit-reached',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: AlertTriangle,
        message: 'Limit reached'
      };
    }
    
    if (isNearLimit) {
      return {
        status: 'near-limit',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: AlertTriangle,
        message: 'Near limit'
      };
    }
    
    return {
      status: 'normal',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: CheckCircle,
      message: 'Good usage'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {usageType} Usage
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.message}
          </Badge>
        </div>
        <CardDescription>
          {isUnlimited 
            ? `You have unlimited ${usageType.toLowerCase()} with Premium`
            : `${currentUsage} of ${maxUsage} ${usageType.toLowerCase()} used ${period}`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isUnlimited && (
          <div className="space-y-2">
            <Progress 
              value={usagePercentage} 
              className="h-2"
              // Custom styling based on status
              style={{
                '--progress-background': isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#3b82f6'
              } as React.CSSProperties}
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{currentUsage} used</span>
              <span>{maxUsage - currentUsage} remaining</span>
            </div>
          </div>
        )}

        {/* Premium upgrade prompt for free users */}
        {!isPremium() && showUpgradeButton && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Get unlimited usage</span>
              </div>
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Warning messages */}
        {!isPremium() && isNearLimit && !isAtLimit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Approaching limit</p>
                <p className="text-yellow-700">
                  You're close to your {usageType.toLowerCase()} limit. Consider upgrading to Premium for unlimited access.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isPremium() && isAtLimit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Limit reached</p>
                <p className="text-red-700">
                  You've reached your {usageType.toLowerCase()} limit for {period}. Upgrade to Premium to continue.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to get usage data for different features
export function useUsageData() {
  const { user, isPremium } = useAuth();
  
  // This would typically come from an API call
  // For now, we'll use mock data based on tier limits
  const getUsageData = (usageType: 'calculations' | 'scenarios' | 'exports') => {
    const limits = isPremium() ? TIER_LIMITS.premium : TIER_LIMITS.free;
    
    // Mock current usage - in real app this would come from API
    const mockUsage = {
      calculations: 2, // User has saved 2 calculations
      scenarios: 0,    // User has 0 scenarios
      exports: 1       // User has made 1 export this month
    };

    const maxUsage = usageType === 'calculations' ? limits.maxCalculations : 
                     usageType === 'scenarios' ? 5 : // Mock scenario limit
                     10; // Mock export limit

    return {
      currentUsage: mockUsage[usageType],
      maxUsage,
      isUnlimited: maxUsage === -1
    };
  };

  return { getUsageData };
}