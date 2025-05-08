import { useState, useEffect } from "react";
import LoanInputForm from "@/components/LoanInputForm";
import LoanSummary from "@/components/LoanSummary";
import ChartSection from "@/components/ChartSection";
import AmortizationSchedule from "@/components/AmortizationSchedule";
import OverpaymentOptimizationPanel from "@/components/OverpaymentOptimizationPanel";
import ExportPanel from "@/components/ExportPanel";
import EducationalPanel from "@/components/EducationalPanel";
import LoadModal from "@/components/LoadModal";
import { 
  CalculationResults, 
  LoanDetails,
  SavedCalculation
} from "@/lib/types";
import { 
  calculateLoanDetails
} from "@/lib/calculationEngine";
import { saveCalculation, getSavedCalculations } from "@/lib/storageService";
import { Button } from "@/components/ui/button";
import { Save, FolderOpen, Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface HomeProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function Home({ selectedCurrency, onCurrencyChange }: HomeProps) {
  const { t, i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState<string>(i18n.language || 'en');

  // State management
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    name: "My Calculation",
    principal: 250000,
    interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date(),
    currency: selectedCurrency
  });

const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
const [showLoadModal, setShowLoadModal] = useState(false);
const [showExportModal, setShowExportModal] = useState(false);
const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

  // Calculate loan details on initial load
  useEffect(() => {
    handleCalculateLoan(loanDetails);
  }, []);

  // Load saved calculations when modal opens
  useEffect(() => {
    if (showLoadModal) {
      const calculations = getSavedCalculations();
      setSavedCalculations(calculations);
    }
  }, [showLoadModal]);

  // This function is called directly by the form when calculate is clicked
  const handleCalculateLoan = (loanDetailsToCalculate?: LoanDetails) => {
    // Use the provided loan details if available, otherwise use the current state
    const detailsToUse = loanDetailsToCalculate || loanDetails;
    
    const results = calculateLoanDetails(
      detailsToUse.principal,
      detailsToUse.interestRatePeriods,
      detailsToUse.loanTerm,
      undefined, // Don't pass a single overpayment plan
      detailsToUse.repaymentModel,
      detailsToUse.additionalCosts,
      detailsToUse.overpaymentPlans, // Pass all overpayment plans
      detailsToUse.startDate // Pass the loan start date for date-based overpayments
    );
    
    setCalculationResults(results);
  };

  const handleSaveCalculation = () => {
    if (calculationResults) {
      const savedCalc = saveCalculation(loanDetails, {
        amount: 0,
        startDate: new Date(),
        startMonth: 0,
        endMonth: 0,
        isRecurring: false,
        frequency: 'one-time'
      });
      
      // Update local state with newly saved calculation
      setSavedCalculations([...savedCalculations, savedCalc]);
    }
  };

  const handleLoadCalculation = (calculation: SavedCalculation) => {
    // Create updated loan details from the loaded calculation
    const updatedDetails = { ...calculation.loanDetails, currency: selectedCurrency };
    
    // Update state and close modal
    setLoanDetails(updatedDetails);
    setShowLoadModal(false);

    // Calculate using the loaded details directly
    handleCalculateLoan(updatedDetails);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-900">{t('app.title')}</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSwitcher />
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-2 py-1"
              >
                <Download className="mr-0 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLoadModal(true)}
                className="flex items-center px-2 py-1"
              >
                <Upload className="mr-0 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="bg-yellow-500 text-yellow-900 text-center py-2 sm:hidden block">
        {t('app.desktopOptimized')}
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <LoanInputForm
                loanDetails={loanDetails}
                setLoanDetails={setLoanDetails}
                onCalculate={handleCalculateLoan}
                selectedCurrency={selectedCurrency}
                onCurrencyChange={onCurrencyChange}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <LoanSummary
              calculationResults={calculationResults}
              overpaymentResults={null}
              loanDetails={loanDetails}
            />
            
            <ChartSection
              loanDetails={loanDetails}
              calculationResults={calculationResults}
            />
            
            <AmortizationSchedule
              yearlyData={
                calculationResults?.yearlyData || []
              }currency={selectedCurrency}
            />
            
            <OverpaymentOptimizationPanel
              loanDetails={loanDetails}
              onApplyOptimization={(optimizedOverpayments) => {
                // Create updated loan details with optimized overpayments
                const updatedDetails = {
                  ...loanDetails,
                  overpaymentPlans: optimizedOverpayments
                };
                
                // Update state
                setLoanDetails(updatedDetails);
                
                // Calculate using the new details directly
                handleCalculateLoan(updatedDetails);
              }}
            />
            
            
            <EducationalPanel
              activeLanguage={activeLanguage}
              onLanguageChange={setActiveLanguage}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            {t('app.description')}
          </p>
        </div>
      </footer>

      {showLoadModal && (
        <LoadModal
          savedCalculations={savedCalculations}
          onLoadCalculation={handleLoadCalculation}
          onClose={() => setShowLoadModal(false)}
        />
      )}
      
      {calculationResults && (
        <ExportPanel
          loanDetails={loanDetails}
          results={calculationResults}
          open={showExportModal}
          onOpenChange={setShowExportModal}
          savedCalculations={savedCalculations}
          onSaveCalculation={handleSaveCalculation}
        />
      )}
    </div>
  );
}
