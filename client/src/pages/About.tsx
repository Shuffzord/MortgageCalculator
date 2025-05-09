import React from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '@/components/SEOHead';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <SEOHead
        pageTitle={t('about.title')}
        pageDescription={t('about.projectDescription')}
      />
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
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300">
                  <img 
                  src="https://media.licdn.com/dms/image/v2/C5603AQF3FeRYHuyydg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1658399611298?e=1752105600&v=beta&t=8mHhwAV1qd0XEhnvjOEkPFPdMv-GicyIdqvoW_lxYZ8" 
                  alt="Mateusz Woźniak" 
                  className="w-24 h-24 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 object-cover"
                  />
                  <div className="transform hover:translate-x-2 transition-transform duration-300">
                  <strong className="text-gray-700 block mb-1">Linkedin:</strong>
                  <a 
                    href="https://www.linkedin.com/in/marvelousmateuszwozniak" 
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 group"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Mateusz Woźniak</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                  </div>
                </div>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}