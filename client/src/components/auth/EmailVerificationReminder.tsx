import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailVerificationReminderProps {
  onClose?: () => void;
  onLogout?: () => void;
}

export function EmailVerificationReminder({ 
  onClose,
  onLogout 
}: EmailVerificationReminderProps) {
  const { t } = useTranslation();
  const { firebaseUser, sendVerificationEmail, error, clearError, isLoading } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);

  const handleResendVerification = async () => {
    try {
      clearError();
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleRefresh = () => {
    // Refresh the page to check if email has been verified
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-amber-100 p-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          {t('auth.verification.title', 'Verify Your Email')}
        </CardTitle>
        <CardDescription className="text-center">
          {t('auth.verification.description', 'Please verify your email address to continue')}
          {firebaseUser?.email && (
            <>
              <br />
              <strong>{firebaseUser.email}</strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verificationSent && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              {t('auth.verification.sent', 'Verification email sent! Please check your inbox and spam folder.')}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {t('auth.verification.instructions', 'We sent a verification email when you signed up. Click the link in the email to verify your account.')}
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleResendVerification}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Mail className="mr-2 h-4 w-4" />
            {t('auth.verification.resend', 'Resend Verification Email')}
          </Button>

          <Button
            onClick={handleRefresh}
            className="w-full"
          >
            {t('auth.verification.refresh', 'I\'ve Verified - Refresh')}
          </Button>

          <div className="flex space-x-2">
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                className="flex-1"
              >
                {t('auth.verification.continue', 'Continue Anyway')}
              </Button>
            )}
            
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="ghost"
                className="flex-1"
              >
                {t('auth.logout', 'Sign Out')}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {t('auth.verification.note', 'Some features may be limited until your email is verified.')}
        </div>
      </CardContent>
    </Card>
  );
}