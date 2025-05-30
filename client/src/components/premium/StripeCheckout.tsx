import React, { useState } from 'react';
import { Loader2, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/context';
import { paymentService } from '@/lib/api/services/paymentService';
import type { SubscriptionPlan } from '@/lib/api/types';

interface StripeCheckoutProps {
  plan: SubscriptionPlan;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function StripeCheckout({ plan, onSuccess, onError, onCancel }: StripeCheckoutProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      const errorMessage = 'Please log in to subscribe';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const checkoutSession = await paymentService.createCheckoutSession({
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/upgrade-success`,
        cancelUrl: `${window.location.origin}/upgrade-cancelled`,
        mode: 'subscription'
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.url;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string, interval: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
    
    return `${formatted}/${interval}`;
  };

  return (
    <div className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                {formatPrice(plan.amount, plan.currency, plan.interval)}
              </p>
              {plan.interval === 'year' && (
                <p className="text-sm text-green-600">Save 20% annually</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Secure Checkout
          </CardTitle>
          <CardDescription>
            You'll be redirected to Stripe's secure checkout page to complete your payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">What happens next:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You'll be redirected to Stripe's secure payment page</li>
                <li>• Enter your payment information safely</li>
                <li>• Your subscription will be activated immediately</li>
                <li>• You'll receive a confirmation email</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              <span>Secured by Stripe. Your payment information is encrypted and secure.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Redirecting...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Proceed to Secure Checkout
            </>
          )}
        </Button>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-500 text-center">
        By subscribing, you agree to our{' '}
        <a href="/terms" className="underline hover:text-gray-700">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="underline hover:text-gray-700">
          Privacy Policy
        </a>
        . You can cancel your subscription at any time.
      </div>
    </div>
  );
}