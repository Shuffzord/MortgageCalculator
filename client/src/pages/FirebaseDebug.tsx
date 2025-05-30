import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseDebug } from '@/components/auth/FirebaseDebug';
import SEOHead from '@/components/SEOHead';
import { useLanguagePrefix } from '@/lib/languageUtils';

export default function FirebaseDebugPage() {
  const { t } = useTranslation();
  const langPrefix = useLanguagePrefix();

  return (
    <>
      <SEOHead
        pageTitle={`Firebase Debug - ${t('app.title')}`}
        pageDescription="Firebase authentication debugging tools"
      />
      
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/${langPrefix}/`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Firebase Debug Console
            </h1>
            <p className="text-gray-600 mt-2">
              Test Firebase authentication connection and troubleshoot issues
            </p>
          </div>

          <FirebaseDebug />
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Check the debug log for Firebase configuration details</li>
              <li>Test anonymous authentication first (simpler test)</li>
              <li>If anonymous works, test email/password authentication</li>
              <li>Look for any error messages in the console</li>
              <li>Ensure your Firebase emulators are running on the correct ports</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}