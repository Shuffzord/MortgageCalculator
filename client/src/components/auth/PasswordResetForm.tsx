import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ResetFormData = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  onBackToLogin?: () => void;
  initialEmail?: string;
}

export function PasswordResetForm({ 
  onBackToLogin,
  initialEmail = ''
}: PasswordResetFormProps) {
  const { t } = useTranslation();
  const { resetPassword, error, clearError, isLoading } = useAuth();
  const [resetSent, setResetSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    try {
      clearError();
      await resetPassword(data.email);
      setSentEmail(data.email);
      setResetSent(true);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleResend = async () => {
    if (sentEmail) {
      try {
        clearError();
        await resetPassword(sentEmail);
      } catch (error) {
        // Error is handled by the auth context
      }
    }
  };

  if (resetSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.reset.success.title', 'Check Your Email')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.reset.success.description', 'We sent a password reset link to')}
            <br />
            <strong>{sentEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {t('auth.reset.success.instructions', 'Click the link in the email to reset your password. If you don\'t see the email, check your spam folder.')}
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResend}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.reset.resend', 'Resend Email')}
            </Button>

            <Button
              onClick={onBackToLogin}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.reset.backToLogin', 'Back to Sign In')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t('auth.reset.title', 'Reset Password')}
        </CardTitle>
        <CardDescription className="text-center">
          {t('auth.reset.description', 'Enter your email address and we\'ll send you a link to reset your password')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email', 'Email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.reset.submit', 'Send Reset Link')}
              </Button>

              <Button
                type="button"
                onClick={onBackToLogin}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.reset.backToLogin', 'Back to Sign In')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}