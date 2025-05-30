import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, ShieldAlert, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuthStatusIndicatorProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function AuthStatusIndicator({ 
  variant = 'default',
  className 
}: AuthStatusIndicatorProps) {
  const { t } = useTranslation();
  const { isAuthenticated, firebaseUser, isPremium } = useAuth();

  if (!isAuthenticated || !firebaseUser) {
    if (variant === 'icon-only') {
      return (
        <div className={cn("flex items-center", className)}>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        <Shield className="h-3 w-3 mr-1" />
        {variant === 'compact' ? t('auth.status.guest', 'Guest') : t('auth.status.notSignedIn', 'Not signed in')}
      </Badge>
    );
  }

  const isEmailVerified = firebaseUser.emailVerified;
  const userIsPremium = isPremium();

  if (variant === 'icon-only') {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        {userIsPremium && <Crown className="h-4 w-4 text-yellow-600" />}
        {isEmailVerified ? (
          <ShieldCheck className="h-4 w-4 text-green-600" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        {userIsPremium && (
          <Badge variant="secondary" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            {t('auth.status.premium', 'Premium')}
          </Badge>
        )}
        <Badge 
          variant={isEmailVerified ? "default" : "secondary"}
          className={cn(
            "text-xs",
            isEmailVerified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          )}
        >
          {isEmailVerified ? (
            <ShieldCheck className="h-3 w-3 mr-1" />
          ) : (
            <ShieldAlert className="h-3 w-3 mr-1" />
          )}
          {isEmailVerified 
            ? t('auth.status.verified', 'Verified') 
            : t('auth.status.unverified', 'Unverified')
          }
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {userIsPremium && (
        <Badge variant="secondary">
          <Crown className="h-3 w-3 mr-1" />
          {t('auth.status.premiumUser', 'Premium User')}
        </Badge>
      )}
      <Badge 
        variant={isEmailVerified ? "default" : "secondary"}
        className={cn(
          isEmailVerified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
        )}
      >
        {isEmailVerified ? (
          <ShieldCheck className="h-3 w-3 mr-1" />
        ) : (
          <ShieldAlert className="h-3 w-3 mr-1" />
        )}
        {isEmailVerified 
          ? t('auth.status.emailVerified', 'Email Verified') 
          : t('auth.status.emailNotVerified', 'Email Not Verified')
        }
      </Badge>
    </div>
  );
}