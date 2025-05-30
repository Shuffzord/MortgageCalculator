import React, { useState } from 'react';
import { BarChart3, Calculator, FileText, Download, Crown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/context';
import { UsageProgress } from './UsageProgress';
import { UpgradeModal } from '@/components/premium/UpgradeModal';
import { TIER_LIMITS } from '@/lib/api/types';

interface UsageDashboardProps {
  className?: string;
}

export function UsageDashboard({ className }: UsageDashboardProps) {
  const { user, isPremium } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Mock usage data - in real app this would come from API
  const usageData = {
    calculations: {
      current: 2,
      max: isPremium() ? -1 : TIER_LIMITS.free.maxCalculations,
      thisMonth: 2,
      lastMonth: 1
    },
    scenarios: {
      current: 0,
      max: isPremium() ? -1 : 2, // Mock scenario limit for free users
      thisMonth: 0,
      lastMonth: 0
    },
    exports: {
      current: 1,
      max: isPremium() ? -1 : 3, // Mock export limit for free users
      thisMonth: 1,
      lastMonth: 0
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const getUsageIcon = (type: string) => {
    switch (type) {
      case 'calculations':
        return Calculator;
      case 'scenarios':
        return FileText;
      case 'exports':
        return Download;
      default:
        return BarChart3;
    }
  };

  const formatUsageText = (current: number, max: number) => {
    if (max === -1) return 'Unlimited';
    return `${current} / ${max}`;
  };

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Usage Dashboard</h2>
            <p className="text-gray-600">
              Track your usage and manage your subscription
            </p>
          </div>
          {!isPremium() && (
            <Button 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPremium() ? (
                <>
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Premium Plan
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Free Plan
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isPremium() 
                ? 'You have unlimited access to all features'
                : 'Limited access to basic features'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(usageData).map(([key, data]) => {
                const Icon = getUsageIcon(key);
                const isAtLimit = data.max !== -1 && data.current >= data.max;
                
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      isPremium() ? 'bg-green-100' : isAtLimit ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        isPremium() ? 'text-green-600' : isAtLimit ? 'text-red-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{key}</p>
                      <p className="text-sm text-gray-600">
                        {formatUsageText(data.current, data.max)}
                      </p>
                    </div>
                    {isAtLimit && (
                      <Badge variant="destructive" className="text-xs">
                        Limit reached
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Usage */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calculations">Calculations</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UsageProgress
                currentUsage={usageData.calculations.current}
                maxUsage={usageData.calculations.max}
                usageType="Calculations"
                onUpgrade={handleUpgrade}
              />
              <UsageProgress
                currentUsage={usageData.scenarios.current}
                maxUsage={usageData.scenarios.max}
                usageType="Scenarios"
                onUpgrade={handleUpgrade}
              />
              <UsageProgress
                currentUsage={usageData.exports.current}
                maxUsage={usageData.exports.max}
                usageType="Exports"
                onUpgrade={handleUpgrade}
              />
            </div>
          </TabsContent>

          <TabsContent value="calculations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsageProgress
                currentUsage={usageData.calculations.current}
                maxUsage={usageData.calculations.max}
                usageType="Saved Calculations"
                onUpgrade={handleUpgrade}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Usage Trend</CardTitle>
                  <CardDescription>Your calculation usage over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">This month</span>
                      <span className="font-medium">{usageData.calculations.thisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last month</span>
                      <span className="font-medium">{usageData.calculations.lastMonth}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        +{usageData.calculations.thisMonth - usageData.calculations.lastMonth} from last month
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsageProgress
                currentUsage={usageData.scenarios.current}
                maxUsage={usageData.scenarios.max}
                usageType="Scenario Models"
                onUpgrade={handleUpgrade}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scenario Features</CardTitle>
                  <CardDescription>Available with Premium</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Multiple payment scenarios
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Interest rate variations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      What-if analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Scenario comparison
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exports" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsageProgress
                currentUsage={usageData.exports.current}
                maxUsage={usageData.exports.max}
                usageType="Report Exports"
                period="this month"
                onUpgrade={handleUpgrade}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Formats</CardTitle>
                  <CardDescription>Available export options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">PDF Reports</span>
                      <Badge variant={isPremium() ? "secondary" : "outline"}>
                        {isPremium() ? "Available" : "Premium"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Excel Spreadsheets</span>
                      <Badge variant={isPremium() ? "secondary" : "outline"}>
                        {isPremium() ? "Available" : "Premium"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CSV Data</span>
                      <Badge variant={isPremium() ? "secondary" : "outline"}>
                        {isPremium() ? "Available" : "Premium"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}