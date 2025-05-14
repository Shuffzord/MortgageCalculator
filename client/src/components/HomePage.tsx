import React, { useState, useEffect } from 'react';
import LoanInputForm from "@/components/LoanInputForm";
import LoanSummary from "@/components/LoanSummary";
import ChartSection from "@/components/ChartSection";
import AmortizationSchedule from "@/components/AmortizationSchedule";
import OverpaymentOptimizationPanel from "@/components/OverpaymentOptimizationPanel";
import DataTransferPanel from "@/components/DataTransferPanel";
import LoadModal from "@/components/LoadModal";
import { 
  CalculationResults, 
  LoanDetails,
  SavedCalculation
} from "@/lib/types";
import {
  calculationService
} from "@/lib/services/calculationService";
import { saveCalculation, getSavedCalculations } from "@/lib/storageService";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface HomePageProps {
  showExportModal?: boolean;
  setShowExportModal?: React.Dispatch<React.SetStateAction<boolean>>;
  showLoadModal?: boolean;
  setShowLoadModal?: React.Dispatch<React.SetStateAction<boolean>>;
}

const HomePage: React.FC<HomePageProps> = ({
  showExportModal: externalShowExportModal,
  setShowExportModal: externalSetShowExportModal,
  showLoadModal: externalShowLoadModal,
  setShowLoadModal: externalSetShowLoadModal
}) => {
  const { t } = useTranslation();
  
  // State management
  const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem("selectedCurrency") || "USD");
  const [internalShowExportModal, setInternalShowExportModal] = useState(false);
  const [internalShowLoadModal, setInternalShowLoadModal] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const showExportModal = externalShowExportModal !== undefined ? externalShowExportModal : internalShowExportModal;
  const setShowExportModal = externalSetShowExportModal || setInternalShowExportModal;
  const showLoadModal = externalShowLoadModal !== undefined ? externalShowLoadModal : internalShowLoadModal;
  const setShowLoadModal = externalSetShowLoadModal || setInternalShowLoadModal;
  
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
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

  // Update localStorage when currency changes
  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    setLoanDetails(prev => ({
      ...prev,
      currency
    }));
  };

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
  
  // Listen for the openLoadModal event
  useEffect(() => {
    const handleOpenLoadModal = () => {
      setShowLoadModal(true);
    };
    
    window.addEventListener('openLoadModal', handleOpenLoadModal);
    
    return () => {
      window.removeEventListener('openLoadModal', handleOpenLoadModal);
    };
  }, []);

  // This function is called directly by the form when calculate is clicked
  const handleCalculateLoan = (loanDetailsToCalculate?: LoanDetails) => {
    // Use the provided loan details if available, otherwise use the current state
    const detailsToUse = loanDetailsToCalculate || loanDetails;
    
    const results = calculationService.calculateLoanDetails(detailsToUse);
    
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

  const handleImportData = (importedLoanDetails: LoanDetails, importedResults?: Partial<CalculationResults>) => {
    // Update loan details with the imported data
    const updatedDetails = {
      ...importedLoanDetails,
      currency: selectedCurrency // Ensure we use the current currency
    };
    
    // Update state
    setLoanDetails(updatedDetails);
    
    // If results were imported, use them; otherwise recalculate
    if (importedResults && Object.keys(importedResults).length > 0) {
      // We need to recalculate anyway to ensure all data is consistent
      handleCalculateLoan(updatedDetails);
    } else {
      handleCalculateLoan(updatedDetails);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <div className="bg-yellow-500 text-yellow-900 text-center py-2 sm:hidden block">
        {t('app.desktopOptimized')}
      </div>
      <div className="bg-yellow-500 text-yellow-900 text-center py-2 block">
        {t('app.beta')}
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
                onCurrencyChange={handleCurrencyChange}
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
              }
              currency={selectedCurrency}
            />
            
            {/* <OverpaymentOptimizationPanel
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
            /> */}
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
        <DataTransferPanel
          loanDetails={loanDetails}
          results={calculationResults}
          open={showExportModal}
          onOpenChange={setShowExportModal}
          savedCalculations={savedCalculations}
          onSaveCalculation={handleSaveCalculation}
          onImportData={handleImportData}
        />
      )}
    </div>
  );
};

export default HomePage;