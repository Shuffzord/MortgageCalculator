import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SEOHead from '@/components/SEOHead';
import { useLanguagePrefix } from '@/lib/languageUtils';

export default function TermsPage() {
  const { t } = useTranslation();
  const langPrefix = useLanguagePrefix();

  return (
    <>
      <SEOHead
        pageTitle={`${t('terms.title', 'Terms and Conditions')} - ${t('app.title')}`}
        pageDescription={t('terms.description', 'Terms and conditions for using our mortgage calculator service')}
      />
      
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/${langPrefix}/`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('navigation.backToHome', 'Back to Home')}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('terms.title', 'Terms and Conditions')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('terms.lastUpdated', 'Last updated: January 1, 2024')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('terms.agreement', 'Agreement to Terms')}</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none space-y-6">
              <p>
                {t('terms.intro', 'By accessing and using this mortgage calculator service, you accept and agree to be bound by the terms and provision of this agreement.')}
              </p>

              <Separator />

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.serviceDescription.title', '1. Service Description')}
                </h3>
                <p>
                  {t('terms.serviceDescription.content', 'Our mortgage calculator is a financial tool designed to help you estimate mortgage payments, compare loan scenarios, and understand the financial implications of different mortgage options. The calculations provided are estimates and should not be considered as financial advice.')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.userAccounts.title', '2. User Accounts')}
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.userAccounts.registration', 'You may create an account to save calculations and access additional features.')}</li>
                  <li>{t('terms.userAccounts.accuracy', 'You are responsible for maintaining the accuracy of your account information.')}</li>
                  <li>{t('terms.userAccounts.security', 'You are responsible for maintaining the security of your account credentials.')}</li>
                  <li>{t('terms.userAccounts.activity', 'You are responsible for all activities that occur under your account.')}</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.dataUsage.title', '3. Data Usage and Privacy')}
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.dataUsage.collection', 'We collect only the information necessary to provide our services.')}</li>
                  <li>{t('terms.dataUsage.storage', 'Your calculation data is stored securely and is only accessible to you.')}</li>
                  <li>{t('terms.dataUsage.sharing', 'We do not share your personal information with third parties without your consent.')}</li>
                  <li>{t('terms.dataUsage.cookies', 'We use cookies to improve your experience and remember your preferences.')}</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.limitations.title', '4. Limitations and Disclaimers')}
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.limitations.estimates', 'All calculations are estimates and may not reflect actual loan terms.')}</li>
                  <li>{t('terms.limitations.advice', 'This service does not provide financial, legal, or tax advice.')}</li>
                  <li>{t('terms.limitations.accuracy', 'We strive for accuracy but cannot guarantee the precision of all calculations.')}</li>
                  <li>{t('terms.limitations.decisions', 'You should consult with financial professionals before making mortgage decisions.')}</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.premiumServices.title', '5. Premium Services')}
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.premiumServices.features', 'Premium features provide additional calculation tools and export options.')}</li>
                  <li>{t('terms.premiumServices.billing', 'Premium subscriptions are billed according to the selected plan.')}</li>
                  <li>{t('terms.premiumServices.cancellation', 'You may cancel your premium subscription at any time.')}</li>
                  <li>{t('terms.premiumServices.refunds', 'Refunds are provided according to our refund policy.')}</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.userConduct.title', '6. User Conduct')}
                </h3>
                <p>{t('terms.userConduct.intro', 'You agree not to:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.userConduct.misuse', 'Use the service for any unlawful purpose or in violation of these terms.')}</li>
                  <li>{t('terms.userConduct.interference', 'Interfere with or disrupt the service or servers.')}</li>
                  <li>{t('terms.userConduct.access', 'Attempt to gain unauthorized access to any part of the service.')}</li>
                  <li>{t('terms.userConduct.content', 'Upload or transmit any harmful, offensive, or inappropriate content.')}</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.intellectualProperty.title', '7. Intellectual Property')}
                </h3>
                <p>
                  {t('terms.intellectualProperty.content', 'The service, including its design, functionality, and content, is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.termination.title', '8. Termination')}
                </h3>
                <p>
                  {t('terms.termination.content', 'We reserve the right to terminate or suspend your account and access to the service at our discretion, with or without notice, for conduct that we believe violates these terms or is harmful to other users or the service.')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.liability.title', '9. Limitation of Liability')}
                </h3>
                <p>
                  {t('terms.liability.content', 'To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.changes.title', '10. Changes to Terms')}
                </h3>
                <p>
                  {t('terms.changes.content', 'We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of the service after changes constitutes acceptance of the new terms.')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">
                  {t('terms.contact.title', '11. Contact Information')}
                </h3>
                <p>
                  {t('terms.contact.content', 'If you have any questions about these Terms and Conditions, please contact us at:')}
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <p><strong>{t('terms.contact.email', 'Email:')}</strong> support@mortgagecalculator.com</p>
                  <p><strong>{t('terms.contact.address', 'Address:')}</strong> 123 Finance Street, Calculator City, CC 12345</p>
                </div>
              </section>

              <Separator />

              <div className="text-sm text-gray-600">
                <p>
                  {t('terms.footer', 'These terms and conditions are effective as of the date last updated above. By using our service, you acknowledge that you have read and understood these terms and agree to be bound by them.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}