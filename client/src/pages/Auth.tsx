import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/context';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { EmailVerificationReminder } from '@/components/auth/EmailVerificationReminder';
import SEOHead from '@/components/SEOHead';
import { useLanguagePrefix } from '@/lib/languageUtils';

type AuthMode = 'login' | 'register' | 'reset' | 'verify';

interface AuthPageProps {
  initialMode?: AuthMode;
  redirectTo?: string;
}

export default function AuthPage({ 
  initialMode = 'login',
  redirectTo = '/'
}: AuthPageProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { isAuthenticated, firebaseUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const langPrefix = useLanguagePrefix();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && firebaseUser?.emailVerified) {
      setLocation(redirectTo.startsWith('/') ? redirectTo : `/${langPrefix}${redirectTo}`);
    }
  }, [isAuthenticated, firebaseUser?.emailVerified, setLocation, redirectTo, langPrefix]);

  // Show email verification if user is authenticated but not verified
  useEffect(() => {
    if (isAuthenticated && firebaseUser && !firebaseUser.emailVerified) {
      setMode('verify');
    }
  }, [isAuthenticated, firebaseUser]);

  const handleAuthSuccess = () => {
    if (firebaseUser?.emailVerified) {
      setLocation(redirectTo.startsWith('/') ? redirectTo : `/${langPrefix}${redirectTo}`);
    } else {
      setMode('verify');
    }
  };

  const handleVerificationClose = () => {
    // Allow user to continue to the app even without verification
    setLocation(redirectTo.startsWith('/') ? redirectTo : `/${langPrefix}${redirectTo}`);
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'register':
        return t('auth.register.title', 'Create Account');
      case 'reset':
        return t('auth.reset.title', 'Reset Password');
      case 'verify':
        return t('auth.verification.title', 'Verify Email');
      default:
        return t('auth.login.title', 'Sign In');
    }
  };

  const getPageDescription = () => {
    switch (mode) {
      case 'register':
        return t('auth.register.description', 'Create your account to save calculations and access premium features');
      case 'reset':
        return t('auth.reset.description', 'Reset your password to regain access to your account');
      case 'verify':
        return t('auth.verification.description', 'Verify your email address to secure your account');
      default:
        return t('auth.login.description', 'Sign in to access your saved calculations and premium features');
    }
  };

  return (
    <>
      <SEOHead
        pageTitle={`${getPageTitle()} - ${t('app.title')}`}
        pageDescription={getPageDescription()}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {mode === 'login' && (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setMode('register')}
              onSwitchToReset={() => setMode('reset')}
            />
          )}
          
          {mode === 'register' && (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
          
          {mode === 'reset' && (
            <PasswordResetForm
              onBackToLogin={() => setMode('login')}
            />
          )}
          
          {mode === 'verify' && (
            <EmailVerificationReminder
              onClose={handleVerificationClose}
              onLogout={() => {
                setMode('login');
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}