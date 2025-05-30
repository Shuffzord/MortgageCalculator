import React, { useEffect, useState } from 'react';
import { GlossaryTerm, ConceptExplanation, InteractiveExample } from '../../lib/educationalContent';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EducationalContentProps {
  glossaryTerms?: GlossaryTerm[];
  concepts?: ConceptExplanation[];
  interactiveExample?: InteractiveExample | null;
  onExampleComplete?: () => void;
  onContentView?: (contentId: string) => void;
}

interface ExpandableSection {
  title: string;
  isExpanded: boolean;
  content: React.ReactNode;
}

export const EducationalContent: React.FC<EducationalContentProps> = ({
  glossaryTerms = [],
  concepts = [],
  interactiveExample,
  onExampleComplete,
  onContentView
}) => {
  const { t } = useTranslation();

  const availableSections = [
    glossaryTerms.length > 0 && {
      title: t('education.glossary'),
      isExpanded: true,
      content: (
        <div className="space-y-2">
          {glossaryTerms.map((term) => (
            <div key={term.term} className="bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
              <h5 className="font-medium text-sm">{term.term}</h5>
              <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
              {term.example && (
                <p className="text-sm text-gray-500 mt-1 italic">
                  {t('education.example')}: {term.example}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    },
    concepts.length > 0 && {
      title: t('education.concepts'),
      isExpanded: false,
      content: (
        <div className="space-y-3">
          {concepts.map((concept) => (
            <div key={concept.concept} className="bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
              <h5 className="font-medium text-sm">{concept.concept}</h5>
              <p className="text-sm text-gray-600 mt-1">{concept.explanation}</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{t('education.impact')}: </span>
                {concept.impact}
              </p>
              {concept.example && (
                <p className="text-sm text-gray-500 mt-1 italic">
                  {t('education.example')}: {concept.example}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    },
    interactiveExample && {
      title: t('education.interactive'),
      isExpanded: false,
      content: (
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
            <h5 className="font-medium text-sm">{interactiveExample.title}</h5>
            <p className="text-sm text-gray-600 mt-1">
              {interactiveExample.description}
            </p>
            <div className="mt-3 space-y-2">
              {interactiveExample.scenarios.map((scenario) => (
                <div key={scenario.name} className="text-sm">
                  <h6 className="font-medium">{scenario.name}</h6>
                  <p className="text-gray-600">{scenario.outcome}</p>
                </div>
              ))}
            </div>
            {onExampleComplete && (
              <button
                onClick={onExampleComplete}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                {t('tutorial.common.next')}
              </button>
            )}
          </div>
        </div>
      )
    }
  ].filter(Boolean) as ExpandableSection[];

  const [sections, setSections] = useState<ExpandableSection[]>(availableSections);

  // Update sections when props change
  useEffect(() => {
    setSections(availableSections);
  }, [glossaryTerms, concepts, interactiveExample]);

  useEffect(() => {
    if (onContentView) {
      glossaryTerms.forEach(term => {
        onContentView(`glossary-${term.term}`);
      });
      concepts.forEach(concept => {
        onContentView(`concept-${concept.concept}`);
      });
    }
  }, [glossaryTerms, concepts, onContentView]);

  const toggleSection = (index: number) => {
    setSections(prev => prev.map((section, i) => ({
      ...section,
      isExpanded: i === index ? !section.isExpanded : section.isExpanded
    })));
  };

  return (
    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {sections.map((section, index) => (
        <div key={section.title} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(index)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h4 className="font-semibold text-sm text-gray-700">{section.title}</h4>
            {section.isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {section.isExpanded && (
            <div className="p-3 space-y-2">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};