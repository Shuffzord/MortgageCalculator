import React from 'react';
import { useAuth } from '@/lib/auth/context';
import { FeatureLockedCard } from './FeatureLockedCard';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

export function PremiumGate({ 
  children, 
  feature = 'premium feature',
  fallback,
  showUpgradePrompt = true,
  className 
}: PremiumGateProps) {
  const { isPremium, isAuthenticated } = useAuth();

  // If user is premium, show the content
  if (isPremium()) {
    return <div className={className}>{children}</div>;
  }

  // If a custom fallback is provided, use it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // If showUpgradePrompt is false, don't show anything
  if (!showUpgradePrompt) {
    return null;
  }

  // Show the feature locked card
  return (
    <div className={className}>
      <FeatureLockedCard 
        feature={feature}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}

// Higher-order component version
export function withPremiumGate<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    feature?: string;
    fallback?: React.ComponentType<P>;
    showUpgradePrompt?: boolean;
  } = {}
) {
  return function PremiumGatedComponent(props: P) {
    const { isPremium, isAuthenticated } = useAuth();
    const { feature = 'premium feature', fallback: Fallback, showUpgradePrompt = true } = options;

    if (isPremium()) {
      return <Component {...props} />;
    }

    if (Fallback) {
      return <Fallback {...props} />;
    }

    if (!showUpgradePrompt) {
      return null;
    }

    return (
      <FeatureLockedCard 
        feature={feature}
        isAuthenticated={isAuthenticated}
      />
    );
  };
}

// Hook for conditional rendering
export function usePremiumGate() {
  const { isPremium, isAuthenticated } = useAuth();

  const canAccess = (requireAuth: boolean = false) => {
    if (requireAuth && !isAuthenticated) {
      return false;
    }
    return isPremium();
  };

  const renderIfPremium = (content: React.ReactNode, fallback?: React.ReactNode) => {
    return isPremium() ? content : fallback;
  };

  return {
    isPremium: isPremium(),
    isAuthenticated,
    canAccess,
    renderIfPremium
  };
}