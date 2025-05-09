import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from 'react-i18next';

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOFAQSectionProps {
  faqs: FAQItem[];
}

const SEOFAQSection: React.FC<SEOFAQSectionProps> = ({ faqs }) => {
  const { t, i18n } = useTranslation();
    // Create structured data for FAQs
  React.useEffect(() => {
    // Remove any existing FAQ structured data
    const existingScript = document.getElementById('faq-structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create structured data for FAQs
    const faqStructuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq, index) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
    
    // Add structured data to the page
    const script = document.createElement('script');
    script.id = 'faq-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqStructuredData);
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [faqs, i18n.language, t]);
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">{t('education.faqTitle') || 'Frequently Asked Questions'}</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default SEOFAQSection;