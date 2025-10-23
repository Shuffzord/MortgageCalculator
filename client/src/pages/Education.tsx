import React from 'react';
import EducationalPanel from '@/components/EducationalPanel';
import SEOFAQSection from '@/components/SEOFAQSection';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mortgageFAQs } from '@/lib/seoFAQs';
import SEOHead from '@/components/SEOHead';

export default function Education() {
  const { t, i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState<string>(i18n.language || 'en');

  // Update activeLanguage when i18n.language changes
  React.useEffect(() => {
    setActiveLanguage(i18n.language);
  }, [i18n.language]);

  // Get FAQs for the current language - use i18n.language directly to ensure it's always up to date
  const faqs = mortgageFAQs[i18n.language as keyof typeof mortgageFAQs] || mortgageFAQs.en;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <SEOHead pageTitle={t('education.title')} pageDescription={t('education.description')} />
      <main className="flex-grow max-w-7xl w-full mx-auto px-8 sm:px-12 lg:px-16 py-16 animate-fadeIn">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-xl p-10 lg:p-16">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-primary">
            {t('education.title')}
          </h1>

          <EducationalPanel activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />

          {/* SEO-friendly FAQ section */}
          <SEOFAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}
