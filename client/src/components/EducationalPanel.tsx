import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Search, BookOpen, Lightbulb, Calculator } from 'lucide-react';

interface EducationalPanelProps {
  activeLanguage: string;
  onLanguageChange?: (language: string) => void;
}

export default function EducationalPanel({
  activeLanguage,
  onLanguageChange
}: EducationalPanelProps) {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('glossary');
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  
  // Change language when activeLanguage prop changes
  useEffect(() => {
    if (activeLanguage && i18n.language !== activeLanguage) {
      i18n.changeLanguage(activeLanguage);
    }
  }, [activeLanguage, i18n]);
  
  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };
  
  // Filter glossary terms based on search
  const filteredGlossary: any[] = [];
  // Object.values(financialGlossary).filter(term =>
  //   searchTerm === '' ||
  //   term.term?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   term.definition?.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  
  // Filter concepts based on search
  const filteredConcepts: any[] = [];
  // Object.values(mortgageConcepts).filter(concept =>
  //   searchTerm === '' ||
  //   concept.concept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   concept.explanation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   concept.impact?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // Filter interactive examples based on search
  const filteredExamples: any[] = [];
  // interactiveExamples.filter(example =>
  //   searchTerm === '' ||
  //   example.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   example.description?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{t('education.title') || 'Mortgage Education Center'}</h2>
          <div className="flex space-x-2">
            <Button
              variant={activeLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('en')}
            >
              EN
            </Button>
            <Button
              variant={activeLanguage === 'es' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('es')}
            >
              ES
            </Button>
            <Button
              variant={activeLanguage === 'pl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('pl')}
            >
              PL
            </Button>
          </div>
        </div>
        <p className="text-gray-600 mb-4">{t('education.description') || 'Learn about mortgage concepts and how different factors affect your loan.'}</p>
        
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder={t('education.search') || "Search terms, concepts, or examples..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs defaultValue="glossary" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="glossary" className="flex items-center justify-center">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('education.glossary') || 'Glossary'}
            </TabsTrigger>
            <TabsTrigger value="concepts" className="flex items-center justify-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              {t('education.concepts') || 'Key Concepts'}
            </TabsTrigger>
            <TabsTrigger value="interactive" className="flex items-center justify-center">
              <Calculator className="h-4 w-4 mr-2" />
              {t('education.interactive') || 'Interactive Examples'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="glossary" className="space-y-4">
            {filteredGlossary.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('education.noResults') || 'No matching terms found'}</p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {/* {filteredGlossary.map((term, index) => (
                  <AccordionItem key={index} value={`term-${index}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {term.term}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-1">
                        <p className="text-gray-700">{term.definition}</p>
                        {term.example && (
                          <div className="mt-2 bg-gray-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{t('education.example') || 'Example'}:</span> {term.example}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))} */}
              </Accordion>
            )}
          </TabsContent>
          
          <TabsContent value="concepts" className="space-y-4">
            {filteredConcepts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('education.noResults') || 'No matching concepts found'}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* {filteredConcepts.map((concept, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{concept.concept}</CardTitle>
                      <CardDescription>{concept.explanation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">{t('education.impact') || 'Impact'}</h4>
                          <p className="text-gray-700">{concept.impact}</p>
                        </div>
                        
                        {concept.example && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <h4 className="font-medium text-sm mb-1">{t('education.example') || 'Example'}</h4>
                            <p className="text-sm text-gray-600">{concept.example}</p>
                          </div>
                        )}
                        
                        {concept.relatedTerms && concept.relatedTerms.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">{t('education.relatedTerms') || 'Related Terms'}</h4>
                            <div className="flex flex-wrap gap-2">
                              {concept.relatedTerms.map((term, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSearchTerm(term);
                                    setActiveTab('glossary');
                                  }}
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))} */}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="interactive" className="space-y-4">
            {filteredExamples.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('education.noResults') || 'No matching examples found'}</p>
            ) : (
              <div className="space-y-6">
                {selectedExample ? (
                  <div>
                    <Button 
                      variant="outline" 
                      className="mb-4"
                      onClick={() => setSelectedExample(null)}
                    >
                      ← Back to examples
                    </Button>
                    
                    {/* Display the selected interactive example */}
                    {(() => {
                      const example = null;
                      // const example = interactiveExamples.find(ex => ex.id === selectedExample);
                      if (!example) return null;
                      
                      return (
                        <></>
                        // <Card>
                        //   <CardHeader>
                        //     <CardTitle>{example.title}</CardTitle>
                        //     <CardDescription>{example.description}</CardDescription>
                        //   </CardHeader>
                        //   <CardContent>
                        //     <div className="space-y-6">
                        //       <div className="bg-gray-50 p-4 rounded-md">
                        //         <h4 className="font-medium mb-2">Default Scenario</h4>
                        //         <div className="grid grid-cols-2 gap-4 text-sm">
                        //           <div>
                        //             <span className="font-medium">Principal:</span> ${example.defaultValues.principal.toLocaleString()}
                        //           </div>
                        //           <div>
                        //             <span className="font-medium">Interest Rate:</span> {example.defaultValues.interestRate}%
                        //           </div>
                        //           <div>
                        //             <span className="font-medium">Term:</span> {example.defaultValues.term} years
                        //           </div>
                        //           {Object.entries(example.defaultValues)
                        //             .filter(([key]) => !['principal', 'interestRate', 'term'].includes(key))
                        //             .map(([key, value]) => (
                        //               <div key={key}>
                        //                 {/* <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {value} */}
                        //               </div>
                        //             ))
                        //           }
                        //         </div>
                        //       </div>
                              
                        //       <div className="space-y-4">
                        //         <h4 className="font-medium">Scenarios</h4>
                        //         {/* {example.scenarios.map((scenario, i) => (
                        //           <Card key={i} className="border border-gray-200">
                        //             <CardHeader className="py-3 px-4">
                        //               <CardTitle className="text-base">{scenario.name}</CardTitle>
                        //             </CardHeader>
                        //             <CardContent className="py-3 px-4">
                        //               <div className="space-y-3">
                        //                 <div className="grid grid-cols-2 gap-2 text-sm">
                        //                   {Object.entries(scenario.values).map(([key, value]) => (
                        //                     <div key={key} className="text-blue-600">
                        //                       <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {value}
                        //                       {key === 'interestRate' ? '%' : ''}
                        //                       {key === 'term' ? ' years' : ''}
                        //                       {key === 'overpayment' ? '/month' : ''}
                        //                     </div>
                        //                   ))}
                        //                 </div>
                        //                 <div className="pt-2 border-t border-gray-100">
                        //                   <p className="text-sm">{scenario.outcome}</p>
                        //                 </div>
                        //               </div>
                        //             </CardContent>
                        //           </Card>
                        //         ))} */}
                        //       </div>
                        //     </div>
                        //   </CardContent>
                        // </Card>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredExamples.map((example, index) => (
                      <Card 
                        key={index} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedExample(example.id)}
                      >
                        <CardHeader>
                          <CardTitle>{example.title}</CardTitle>
                          <CardDescription>{example.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="outline" className="w-full">
                            Explore Example
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}