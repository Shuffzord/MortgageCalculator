import React, { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import { paymentService } from '@/lib/api/services/paymentService';
import type { SubscriptionPlan } from '@/lib/api/types';

interface PricingPlansProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  showCurrentPlan?: boolean;
  compact?: boolean;
}

export function PricingPlans({ onSelectPlan, showCurrentPlan = true, compact = false }: PricingPlansProps) {
  const { user, isAuthenticated, isPremium } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    loadPlans();
    if (showCurrentPlan && isAuthenticated) {
      loadCurrentSubscription();
    }
  }, [isAuthenticated, showCurrentPlan]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const plansData = await paymentService.getSubscriptionPlans();
      setPlans(plansData);
    } catch (err) {
      setError('Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const subscription = await paymentService.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (err) {
      // User might not have a subscription, which is fine
      setCurrentSubscription(null);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const formatPrice = (amount: number, currency: string, interval: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
    
    return { price: formatted, interval };
  };

  const getMonthlyEquivalent = (amount: number, interval: string) => {
    if (interval === 'year') {
      return amount / 12;
    }
    return amount;
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return currentSubscription?.priceId === plan.priceId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pricing plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Unlock powerful mortgage calculation features and take control of your financial planning.
          </p>
        </div>
      )}

      {/* Free Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`relative ${!isPremium() ? 'ring-2 ring-blue-500' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Free</CardTitle>
              {!isPremium() && showCurrentPlan && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Current Plan
                </Badge>
              )}
            </div>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">
              $0<span className="text-lg font-normal text-gray-500">/month</span>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Up to 3 saved calculations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic mortgage calculator</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Amortization schedule</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic overpayment calculations</span>
              </li>
            </ul>

            {!isPremium() && showCurrentPlan ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Free Forever
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Premium Plans */}
        {plans.map((plan, index) => {
          const { price, interval } = formatPrice(plan.amount, plan.currency, plan.interval);
          const monthlyEquivalent = getMonthlyEquivalent(plan.amount, plan.interval);
          const isPopular = plan.interval === 'year';
          const isCurrent = isCurrentPlan(plan);

          return (
            <Card 
              key={plan.id} 
              className={`relative ${isPopular ? 'ring-2 ring-purple-500 scale-105' : ''} ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    {plan.name}
                  </CardTitle>
                  {isCurrent && showCurrentPlan && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Current Plan
                    </Badge>
                  )}
                  {plan.interval === 'year' && !isCurrent && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Save 20%
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold">
                    {price}
                  </div>
                  {plan.interval === 'year' && (
                    <div className="text-sm text-gray-500">
                      ${(monthlyEquivalent / 100).toFixed(2)}/month billed annually
                    </div>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent && showCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full ${
                      isPopular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : ''
                    }`}
                    variant={isPopular ? 'default' : 'default'}
                  >
                    {isAuthenticated ? (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </>
                    ) : (
                      'Sign Up to Upgrade'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!compact && (
        <div className="text-center pt-8">
          <p className="text-sm text-gray-500 mb-4">
            All plans include a 30-day money-back guarantee
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}