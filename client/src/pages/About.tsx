import React from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '@/components/SEOHead';
import statistics from '../../statistics.json';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <SEOHead
        pageTitle={t('about.title')}
        pageDescription={t('about.projectDescription')}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-8 sm:px-12 lg:px-16 py-16 animate-fadeIn">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-xl p-10 lg:p-16">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-primary ">{t('about.title')}</h1>

          <section className="mb-12 transform transition-all duration-300 ">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-3">
              {t('about.projectOverview')}
            </h2>
            <div className="prose max-w-none text-foreground">
              <p className="mb-4">{t('about.projectDescription')}</p>
              <p>{t('about.purposeDescription')}</p>
            </div>
          </section>
          <section className="mb-12 transform transition-all duration-300 animate-fadeInDown ">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-3">
              {t('about.features')}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-lg">{t('about.featureCalculation')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-lg">{t('about.featureAmortization')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-lg">{t('about.featureComparison')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg">{t('about.featureOverpayment')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-lg">{t('about.featureExport')}</span>
                </div>
              </li>
            </ul>
          </section>
          <section className="mb-12 transform transition-all duration-300 ">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-3">
              {t('about.howToUse')}
            </h2>
            <ol className="grid gap-6">
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold rounded-lg">1</span>
                  <span className="text-lg">{t('about.step1')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold rounded-lg">2</span>
                  <span className="text-lg">{t('about.step2')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold rounded-lg">3</span>
                  <span className="text-lg">{t('about.step3')}</span>
                </div>
              </li>
              <li className="bg-muted rounded-lg">
                <div className="flex items-center gap-5 p-2">
                  <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold rounded-lg">4</span>
                  <span className="text-lg">{t('about.step4')}</span>
                </div>
              </li>
            </ol>
          </section>
          <section className="mb-12 transform transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-3">
              {t('about.contactInfo')}
            </h2>
            <p className="text-foreground mb-6 leading-relaxed">{t('about.passionProjectDescription')}</p>
            <p className="text-foreground mb-6 leading-relaxed">{t('about.contactDescription')}</p>
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row items-center gap-8 p-2 bg-muted rounded-xl">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-0.5 bg-primary/10 rounded-full blur"></div>
                  <img
                    src={new URL('/images/photo.jpg', import.meta.url).href}
                    alt="Mateusz Woźniak"
                    className="relative w-160 h-160 rounded-full shadow-lg object-cover ring-2 ring-card"
                  />
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-foreground leading-relaxed flex-1">{t('about.supportDescription')}</p>
                  <a
                    href="https://www.buymeacoffee.com/smarterloan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png"
                      alt="Buy Me A Coffee"
                      className="h-[60px] w-[217px]"
                    />
                  </a>
                  <strong className="text-foreground block mb-4 font-semibold text-xl">Linkedin:</strong>
                  <a
                    href="https://www.linkedin.com/in/marvelousmateuszwozniak"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="font-medium">Mateusz Woźniak</span>
                    <svg className="w-5 h-5 animate-bounce-x" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>


                </div>
              </div>
            </div>
          </section>

          <section className="transform transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-primary flex items-center gap-3">
              {t('about.developerInfo')}
            </h2>
            <p className="text-foreground mb-6 leading-relaxed">{t('about.developerInfoDescription')}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium">{t('about.statistics.cost')}</h3>
                    <p className="text-xl font-bold">{statistics.cost}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium">{t('about.statistics.profit')}</h3>
                    <p className="text-xl font-bold">{statistics.profit}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium">{t('about.statistics.linesOfCode')}</h3>
                    <p className="text-xl font-bold">{statistics.linesOfCode}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <svg className="w-10 h-10 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.71.355a1.067 1.067 0 01.64.972V16a2 2 0 01-2 2h-8a2 2 0 01-2-2v-1.302c0-.399.247-.767.64-.972l.71-.355a2.25 2.25 0 001.357-2.059" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium">{t('about.statistics.tests')}</h3>
                    <p className="text-xl font-bold">{statistics.Tests}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}