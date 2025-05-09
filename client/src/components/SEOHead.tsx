import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  pageTitle?: string;
  pageDescription?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  pageTitle, 
  pageDescription 
}) => {
  const { i18n } = useTranslation();
  
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
      .then(response => response.json())
      .then(data => {
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      })
      .catch(error => {
        console.error('Error loading structured data:', error);
      });
      
    // Update page title and description if provided
    if (pageTitle) {
      document.title = pageTitle;
      
      // Update Open Graph and Twitter title tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const twitterTitle = document.querySelector('meta[property="twitter:title"]');
      
      if (ogTitle) ogTitle.setAttribute('content', pageTitle);
      if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);
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
      // Update canonical and alternate links
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const baseUrl = 'https://smarter-loan.com';
      const langPath = i18n.language === 'en' ? '' : `/${i18n.language}`;
      canonical.setAttribute('href', `${baseUrl}${langPath}/`);
    }
    
    return () => {
      // Clean up when component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [i18n.language, pageTitle, pageDescription]);
  
  // This component doesn't render anything visible
  return null;
};

export default SEOHead;