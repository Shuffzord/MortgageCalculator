import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Shield, Crown, Mail, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguagePrefix } from '@/lib/languageUtils';

interface AuthStatusBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function AuthStatusBanner({ onDismiss, showDismiss = true }: AuthStatusBannerProps) {
  const { t } = useTranslation();
  const { isAuthenticated, firebaseUser, user, isPremium } = useAuth();
  const [, setLocation] = useLocation();
  const langPrefix = useLanguagePrefix();

  if (!isAuthenticated) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                {t('auth.banner.signInPrompt', 'Sign in to save your calculations')}
              </p>
              <p className="text-sm text-blue-700">
                {t('auth.banner.signInDescription', 'Create an account to save calculations, compare scenarios, and access premium features.')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setLocation(`/${langPrefix}/auth?mode=login`)}
              size="sm"
            >
              {t('auth.login.title', 'Sign In')}
            </Button>
            <Button
              onClick={() => setLocation(`/${langPrefix}/auth?mode=register`)}
              variant="outline"
              size="sm"
            >
              {t('auth.register.title', 'Sign Up')}
            </Button>
            {showDismiss && onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEmailVerified = firebaseUser?.emailVerified;
  const displayName = user?.displayName || firebaseUser?.displayName;
  const email = user?.email || firebaseUser?.email;

  if (!isEmailVerified) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">
                {t('auth.banner.verifyEmail', 'Please verify your email address')}
              </p>
              <p className="text-sm text-amber-700">
                {t('auth.banner.verifyEmailDescription', 'Check your inbox and click the verification link to secure your account.')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setLocation(`/${langPrefix}/auth?mode=verify`)}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {t('auth.verification.verify', 'Verify Now')}
            </Button>
            {showDismiss && onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-800"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show welcome message for authenticated and verified users
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-green-900">
                {t('auth.banner.welcome', 'Welcome back, {{name}}!', { 
                  name: displayName || t('auth.banner.user', 'User') 
                })}
              </p>
              {isPremium() && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  {t('auth.status.premium', 'Premium')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-green-700">
              {t('auth.banner.welcomeDescription', 'Your calculations are automatically saved to your account.')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setLocation(`/${langPrefix}/profile`)}
            size="sm"
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            {t('auth.profile.profile', 'Profile')}
          </Button>
          {showDismiss && onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}