import React, { useState, useEffect } from 'react';
import { Crown, Calendar, CreditCard, Settings, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/context';
import { paymentService } from '@/lib/api/services/paymentService';
import { BillingHistory } from './BillingHistory';
import { PaymentMethods } from './PaymentMethods';
import { CancelSubscription } from './CancelSubscription';
import type { Subscription, SubscriptionStatus } from '@/lib/api/types';

interface SubscriptionDashboardProps {
  className?: string;
}

export function SubscriptionDashboard({ className }: SubscriptionDashboardProps) {
  const { user, isPremium, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [subscriptionData, statusData] = await Promise.all([
        paymentService.getCurrentSubscription(),
        paymentService.getSubscriptionStatus()
      ]);
      
      setSubscription(subscriptionData);
      setSubscriptionStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await paymentService.cancelSubscription();
      await loadSubscriptionData();
      await refreshUser();
      setShowCancelModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await paymentService.resumeSubscription();
      await loadSubscriptionData();
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
    }
  };

  const openCustomerPortal = async () => {
    try {
      const portalResponse = await paymentService.getCustomerPortalUrl(window.location.href);
      window.open(portalResponse.url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  if (!isPremium() || !subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active premium subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Upgrade to Premium to access advanced features and manage your subscription here.
          </p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Subscription Management
          </h2>
          <p className="text-gray-600">
            Manage your premium subscription and billing
          </p>
        </div>
        <Button variant="outline" onClick={openCustomerPortal}>
          <Settings className="h-4 w-4 mr-2" />
          Manage in Stripe
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            {getStatusBadge(subscription.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Billing Period</span>
              </div>
              <p className="text-lg">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Next Billing</span>
              </div>
              <p className="text-lg">
                {subscription.cancelAtPeriodEnd 
                  ? 'Cancelled (ends ' + formatDate(subscription.currentPeriodEnd) + ')'
                  : formatDate(subscription.currentPeriodEnd)
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <p className="text-lg capitalize">{subscription.status}</p>
            </div>
          </div>

          {/* Cancellation Warning */}
          {subscription.cancelAtPeriodEnd && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription is set to cancel on {formatDate(subscription.currentPeriodEnd)}. 
                You'll lose access to premium features after this date.
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2"
                  onClick={handleResumeSubscription}
                >
                  Resume subscription
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={openCustomerPortal}>
              <Settings className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            {!subscription.cancelAtPeriodEnd && (
              <Button 
                variant="outline" 
                onClick={() => setShowCancelModal(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Management */}
      <Tabs defaultValue="billing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="billing">
          <BillingHistory />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentMethods />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>
                Manage your subscription preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Auto-renewal</h4>
                  <p className="text-sm text-gray-600">
                    Automatically renew your subscription each billing period
                  </p>
                </div>
                <Badge variant={subscription.cancelAtPeriodEnd ? "destructive" : "secondary"}>
                  {subscription.cancelAtPeriodEnd ? "Disabled" : "Enabled"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Billing notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive email notifications about billing and payments
                  </p>
                </div>
                <Badge variant="secondary">Enabled</Badge>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={openCustomerPortal}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage All Settings in Stripe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Modal */}
      <CancelSubscription
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        subscription={subscription}
      />
    </div>
  );
}