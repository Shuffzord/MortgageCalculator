import React, { useState } from 'react';
import { X, Crown, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import { paymentService } from '@/lib/api/services/paymentService';
import type { SubscriptionPlan } from '@/lib/api/types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: SubscriptionPlan;
  onUpgradeSuccess?: () => void;
}

export function UpgradeModal({ isOpen, onClose, selectedPlan, onUpgradeSuccess }: UpgradeModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(selectedPlan?.id || '');

  // Load plans when modal opens
  React.useEffect(() => {
    if (isOpen && plans.length === 0) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const plansData = await paymentService.getSubscriptionPlans();
      setPlans(plansData);
      if (!selectedPlanId && plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
      }
    } catch (err) {
      setError('Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      setError('Please log in to upgrade your subscription');
      return;
    }

    if (!selectedPlanId) {
      setError('Please select a subscription plan');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const plan = plans.find(p => p.id === selectedPlanId);
      if (!plan) {
        throw new Error('Selected plan not found');
      }

      const checkoutSession = await paymentService.createCheckoutSession({
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/upgrade-success`,
        cancelUrl: `${window.location.origin}/upgrade-cancelled`,
        mode: 'subscription'
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.url;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process');
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isLoading && plans.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading subscription plans...</span>
            </div>
          ) : (
            <>
              {/* Premium Features */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Premium Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Unlimited Calculations</p>
                      <p className="text-sm text-gray-600">Save and manage unlimited mortgage calculations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Advanced Loan Comparison</p>
                      <p className="text-sm text-gray-600">Compare multiple loan scenarios side-by-side</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Scenario Modeling</p>
                      <p className="text-sm text-gray-600">Model different payment scenarios and strategies</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">PDF & Excel Export</p>
                      <p className="text-sm text-gray-600">Export detailed reports and amortization schedules</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Priority Support</p>
                      <p className="text-sm text-gray-600">Get priority customer support and assistance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Advanced Analytics</p>
                      <p className="text-sm text-gray-600">Detailed insights and payment optimization suggestions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Plans */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        selectedPlanId === plan.id 
                          ? 'ring-2 ring-blue-500 border-blue-500' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          {plan.interval === 'year' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Save 20%
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold mb-4">
                          {formatPrice(plan.amount, plan.currency, plan.interval)}
                        </div>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpgrade} 
                  disabled={isLoading || !selectedPlanId}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}