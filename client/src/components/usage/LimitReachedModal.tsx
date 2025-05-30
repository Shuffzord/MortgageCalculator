import React, { useState } from 'react';
import { AlertTriangle, Crown, ArrowRight, X, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import { UpgradeModal } from '@/components/premium/UpgradeModal';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'calculations' | 'scenarios' | 'exports';
  currentUsage: number;
  maxUsage: number;
  onUpgrade?: () => void;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  currentUsage,
  maxUsage,
  onUpgrade
}: LimitReachedModalProps) {
  const { isAuthenticated } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    if (isAuthenticated) {
      setShowUpgradeModal(true);
    } else {
      // Redirect to login/register page
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
    onUpgrade?.();
  };

  const getLimitInfo = () => {
    switch (limitType) {
      case 'calculations':
        return {
          title: 'Calculation Limit Reached',
          description: 'You\'ve reached your limit for saved calculations',
          icon: '🧮',
          action: 'save more calculations',
          benefits: [
            'Unlimited saved calculations',
            'Advanced calculation features',
            'Calculation history and organization',
            'Export calculations to PDF/Excel'
          ]
        };
      case 'scenarios':
        return {
          title: 'Scenario Limit Reached',
          description: 'You\'ve reached your limit for scenario modeling',
          icon: '📊',
          action: 'create more scenarios',
          benefits: [
            'Unlimited scenario modeling',
            'Advanced what-if analysis',
            'Scenario comparison tools',
            'Export scenario reports'
          ]
        };
      case 'exports':
        return {
          title: 'Export Limit Reached',
          description: 'You\'ve reached your monthly export limit',
          icon: '📄',
          action: 'export more reports',
          benefits: [
            'Unlimited PDF exports',
            'Excel spreadsheet exports',
            'CSV data exports',
            'Professional report templates'
          ]
        };
      default:
        return {
          title: 'Usage Limit Reached',
          description: 'You\'ve reached your usage limit',
          icon: '⚠️',
          action: 'continue using features',
          benefits: ['Unlimited access to all features']
        };
    }
  };

  const limitInfo = getLimitInfo();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {limitInfo.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Limit Status */}
            <div className="text-center">
              <div className="text-4xl mb-2">{limitInfo.icon}</div>
              <p className="text-gray-600 mb-4">{limitInfo.description}</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-red-600">{currentUsage}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-lg text-gray-600">{maxUsage}</span>
                </div>
                <p className="text-sm text-red-700">
                  You've used all your available {limitType}
                </p>
              </div>
            </div>

            {/* Premium Benefits */}
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Upgrade to Premium
                </CardTitle>
                <CardDescription>
                  Get unlimited access and {limitInfo.action}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {limitInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
                
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Premium Plan</p>
                      <p className="text-sm text-gray-600">Unlimited everything</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">$9.99</p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                {isAuthenticated ? 'Upgrade to Premium' : 'Sign Up & Upgrade'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Instant activation
                </span>
                <span>•</span>
                <span>30-day guarantee</span>
                <span>•</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}