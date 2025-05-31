import React from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { SubscriptionDashboard } from '@/components/subscription';
import { withAuth } from '@/lib/auth/context';
import SEOHead from '@/components/SEOHead';

function SubscriptionPage() {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead
        pageTitle={`${t('subscription.title', 'Subscription')} - ${t('app.title')}`}
        pageDescription={t('subscription.description', 'Manage your subscription and billing information')}
      />
      
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                {t('subscription.title', 'Subscription Management')}
              </h1>
            </div>
            <p className="text-gray-600">
              {t('subscription.subtitle', 'Manage your subscription, billing, and premium features')}
            </p>
          </div>

          <SubscriptionDashboard />
        </div>
      </div>
    </>
  );
}

export default withAuth(SubscriptionPage);