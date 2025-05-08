import React from 'react';
import EducationalPanel from "@/components/EducationalPanel";
import SEOFAQSection from "@/components/SEOFAQSection";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mortgageFAQs } from "@/lib/seoFAQs";
import SEOHead from "@/components/SEOHead";

export default function Education() {
  const { t, i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState<string>(i18n.language || 'en');

  // Get FAQs for the current language
  const faqs = mortgageFAQs[activeLanguage as keyof typeof mortgageFAQs] || mortgageFAQs.en;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <SEOHead
        pageTitle={t('education.title')}
        pageDescription={t('education.description')}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6">{t('education.title')}</h1>
          
          <EducationalPanel
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
          />
          
          {/* SEO-friendly FAQ section */}
          <SEOFAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}