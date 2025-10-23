import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, validateLanguage, useLanguagePrefix } from '../lib/languageUtils';

interface SEOHeadProps {
  pageTitle?: string;
  pageDescription?: string;
  path?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ pageTitle, pageDescription, path = '' }) => {
  const { i18n } = useTranslation();
  const currentLanguage = useLanguagePrefix();
  const baseUrl = 'https://www.smarter-loan.com';

  useEffect(() => {
    // Remove any existing structured data script
    const existingScript = document.getElementById('structured-data-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Create a new script element for structured data
    const script = document.createElement('script');
    script.id = 'structured-data-script';
    script.type = 'application/ld+json';

    // Set the appropriate structured data file based on language
    let structuredDataPath = '/structured-data.json';

    if (i18n.language === 'es') {
      structuredDataPath = '/structured-data-es.json';
    } else if (i18n.language === 'pl') {
      structuredDataPath = '/structured-data-pl.json';
    }

    // Fetch and inject the structured data
    fetch(structuredDataPath)
      .then((response) => response.json())
      .then((data) => {
        // Add language context to structured data
        data['@context'] = 'https://schema.org';
        data.inLanguage = i18n.language;

        // Add language alternates to structured data
        data.workTranslation = SUPPORTED_LANGUAGES.map((lang) => ({
          '@type': 'WebPage',
          inLanguage: lang,
          url: `${baseUrl}${lang === 'en' ? '' : `/${lang}`}${path}`,
        }));

        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      })
      .catch((error) => {
        console.error('Error loading structured data:', error);
      });

    // Update page title and description with language context
    if (pageTitle) {
      const localizedTitle = `${pageTitle} | Smarter Loan ${i18n.language.toUpperCase()}`;
      document.title = localizedTitle;

      // Update Open Graph and Twitter title tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const twitterTitle = document.querySelector('meta[property="twitter:title"]');

      if (ogTitle) ogTitle.setAttribute('content', localizedTitle);
      if (twitterTitle) twitterTitle.setAttribute('content', localizedTitle);
    }

    if (pageDescription) {
      const metaDescription = document.querySelector('meta[name="description"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const twitterDescription = document.querySelector('meta[property="twitter:description"]');

      if (metaDescription) metaDescription.setAttribute('content', pageDescription);
      if (ogDescription) ogDescription.setAttribute('content', pageDescription);
      if (twitterDescription) twitterDescription.setAttribute('content', pageDescription);
    }

    // Update language attributes
    document.documentElement.setAttribute('lang', i18n.language);

    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const langPath = i18n.language === 'en' ? '' : `/${i18n.language}`;
      canonical.setAttribute('href', `${baseUrl}${langPath}${path}`);
    }

    // Update OpenGraph locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.setAttribute(
        'content',
        i18n.language === 'en' ? 'en_US' : i18n.language === 'es' ? 'es_ES' : 'pl_PL'
      );
    }

    // Remove existing hreflang tags
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());

    // Add hreflang tags for all language variants
    SUPPORTED_LANGUAGES.forEach((lang) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${baseUrl}${lang === 'en' ? '' : `/${lang}`}${path}`;
      document.head.appendChild(link);
    });

    // Add x-default hreflang tag (pointing to English version)
    const xDefaultLink = document.createElement('link');
    xDefaultLink.rel = 'alternate';
    xDefaultLink.hreflang = 'x-default';
    xDefaultLink.href = `${baseUrl}${path}`;
    document.head.appendChild(xDefaultLink);

    return () => {
      // Clean up when component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clean up hreflang tags
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    };
  }, [i18n.language, pageTitle, pageDescription, path]);

  // This component doesn't render anything visible
  return null;
};

export default SEOHead;
