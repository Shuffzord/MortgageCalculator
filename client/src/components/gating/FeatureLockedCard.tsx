import React, { useState } from 'react';
import { Lock, Crown, ArrowRight, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/premium/UpgradeModal';

interface FeatureLockedCardProps {
  feature: string;
  description?: string;
  benefits?: string[];
  isAuthenticated: boolean;
  compact?: boolean;
  className?: string;
}

export function FeatureLockedCard({ 
  feature, 
  description,
  benefits = [],
  isAuthenticated,
  compact = false,
  className 
}: FeatureLockedCardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const defaultBenefits = [
    'Unlimited calculations',
    'Advanced loan comparison',
    'Scenario modeling',
    'PDF & Excel export'
  ];

  const featureBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  const handleUpgrade = () => {
    if (isAuthenticated) {
      setShowUpgradeModal(true);
    } else {
      // Redirect to login/register page
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
  };

  if (compact) {
    return (
      <>
        <Card className={`border-dashed border-2 border-gray-300 bg-gray-50 ${className}`}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Lock className="h-5 w-5 text-gray-400 mr-2" />
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {description || `Upgrade to access ${feature}`}
            </p>
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAuthenticated ? 'Upgrade Now' : 'Sign Up to Upgrade'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Card className={`border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 ${className}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-yellow-500 text-white px-2 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
            </div>
          </div>
          
          <CardTitle className="text-xl">
            {feature.charAt(0).toUpperCase() + feature.slice(1)} is Premium
          </CardTitle>
          
          <CardDescription className="text-base">
            {description || `Unlock ${feature} and many more powerful features with a premium subscription.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Premium Features */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Premium Features Include:
            </h4>
            <ul className="space-y-2">
              {featureBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Highlight */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Premium Plan</p>
                <p className="text-sm text-gray-600">Full access to all features</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">$9.99</p>
                <p className="text-xs text-gray-500">per month</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {isAuthenticated ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Sign Up & Upgrade
              </>
            )}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500">
            30-day money-back guarantee • Cancel anytime
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}