import React, { useEffect, useState } from 'react';
import { CheckCircle, Crown, ArrowRight, Download, Users, BarChart3, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import { paymentService } from '@/lib/api/services/paymentService';

interface UpgradeSuccessProps {
  onContinue?: () => void;
  onGoToDashboard?: () => void;
}

export function UpgradeSuccess({ onContinue, onGoToDashboard }: UpgradeSuccessProps) {
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Refresh user data to get updated tier
    refreshUser();
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const subscriptionData = await paymentService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const premiumFeatures = [
    {
      icon: BarChart3,
      title: 'Unlimited Calculations',
      description: 'Save and manage unlimited mortgage calculations',
      action: 'Start calculating'
    },
    {
      icon: Users,
      title: 'Advanced Loan Comparison',
      description: 'Compare multiple loan scenarios side-by-side',
      action: 'Compare loans'
    },
    {
      icon: FileText,
      title: 'Scenario Modeling',
      description: 'Model different payment scenarios and strategies',
      action: 'Create scenarios'
    },
    {
      icon: Download,
      title: 'PDF & Excel Export',
      description: 'Export detailed reports and amortization schedules',
      action: 'Export reports'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <Crown className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Premium!</h1>
        <p className="text-gray-600 text-lg">
          Your subscription has been activated successfully. You now have access to all premium features.
        </p>
      </div>

      {/* Subscription Details */}
      {subscription && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {subscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Period</p>
                <p className="font-medium">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Features */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Your Premium Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {premiumFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {feature.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>
            Get the most out of your premium subscription with these next steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Create your first advanced calculation</p>
                <p className="text-sm text-gray-600">
                  Use the enhanced calculator with unlimited saves and advanced features
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Compare different loan options</p>
                <p className="text-sm text-gray-600">
                  Use the loan comparison tool to find the best mortgage option for you
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Model payment scenarios</p>
                <p className="text-sm text-gray-600">
                  Explore different payment strategies and see their long-term impact
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Export your reports</p>
                <p className="text-sm text-gray-600">
                  Generate professional PDF and Excel reports for your records
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onGoToDashboard}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={onContinue}>
          Start Using Premium Features
        </Button>
      </div>

      {/* Support Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our premium support team is here to help you get the most out of your subscription.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" size="sm">
                View Documentation
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}