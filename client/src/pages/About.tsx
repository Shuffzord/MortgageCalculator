import React from 'react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6">{t('about.title')}</h1>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">{t('about.projectOverview')}</h2>
            <p className="mb-4">{t('about.projectDescription')}</p>
            <p>{t('about.purposeDescription')}</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">{t('about.features')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('about.featureCalculation')}</li>
              <li>{t('about.featureAmortization')}</li>
              <li>{t('about.featureComparison')}</li>
              <li>{t('about.featureOverpayment')}</li>
              <li>{t('about.featureExport')}</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4">{t('about.howToUse')}</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t('about.step1')}</li>
              <li>{t('about.step2')}</li>
              <li>{t('about.step3')}</li>
              <li>{t('about.step4')}</li>
            </ol>
          </section>
          
          <section>
            <h2 className="text-xl font-medium mb-4">{t('about.contactInfo')}</h2>
            <p>{t('about.contactDescription')}</p>
            <p className="mt-2">
              <strong>Email:</strong> support@mortgagecalculator.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}