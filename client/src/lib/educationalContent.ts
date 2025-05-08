export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface ConceptExplanation {
  concept: string;
  explanation: string;
  impact: string;
  example?: string;
  relatedTerms?: string[];
}

export interface InteractiveExample {
  id: string;
  title: string;
  description: string;
  defaultValues: {
    principal: number;
    interestRate: number;
    term: number;
    [key: string]: any;
  };
  scenarios: {
    name: string;
    values: {
      [key: string]: any;
    };
    outcome: string;
  }[];
}