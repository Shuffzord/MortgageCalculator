import React, { useState } from 'react';
import { Crown, X, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import { UpgradeModal } from '@/components/premium/UpgradeModal';

interface UpgradePromptProps {
  message?: string;
  feature?: string;
  variant?: 'banner' | 'card' | 'inline' | 'floating';
  dismissible?: boolean;
  showBenefits?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export function UpgradePrompt({
  message,
  feature,
  variant = 'card',
  dismissible = true,
  showBenefits = false,
  className,
  onDismiss
}: UpgradePromptProps) {
  const { isAuthenticated } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpgrade = () => {
    if (isAuthenticated) {
      setShowUpgradeModal(true);
    } else {
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  const defaultMessage = feature 
    ? `Unlock ${feature} with Premium` 
    : 'Upgrade to Premium for unlimited access';

  const promptMessage = message || defaultMessage;

  // Banner variant
  if (variant === 'banner') {
    return (
      <>
        <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 ${className}`}>
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-yellow-300" />
              <span className="font-medium">{promptMessage}</span>
              {showBenefits && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  30-day trial
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleUpgrade}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Upgrade Now
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  // Floating variant
  if (variant === 'floating') {
    return (
      <>
        <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
          <Card className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <Crown className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{promptMessage}</p>
                  {showBenefits && (
                    <p className="text-xs text-gray-600">Unlimited calculations & exports</p>
                  )}
                </div>
                <Button 
                  size="sm"
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <>
        <div className={`flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
          <Crown className="h-4 w-4 text-yellow-500" />
          <span className="text-sm flex-1">{promptMessage}</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleUpgrade}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Upgrade
          </Button>
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  // Card variant (default)
  return (
    <>
      <Card className={`border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="absolute top-2 right-2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{promptMessage}</h3>
              
              {showBenefits && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Premium includes:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Unlimited saved calculations</li>
                    <li>• Advanced loan comparison tools</li>
                    <li>• PDF & Excel export capabilities</li>
                    <li>• Priority customer support</li>
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isAuthenticated ? 'Upgrade Now' : 'Sign Up & Upgrade'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <div className="text-xs text-gray-500">
                  Starting at $9.99/month
                </div>
              </div>
            </div>
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