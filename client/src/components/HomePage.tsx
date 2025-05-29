import React, { useState, useEffect } from 'react';
import { Clippy } from './ui/Clippy';
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
import Footer from './ui/footer';
import { ExperienceLevelAssessment } from "@/components/ExperienceLevelAssessment";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { useTutorialStore } from "@/lib/tutorial/tutorialState";

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
  
  // Tutorial state management
  const {
    experienceLevel,
    hasCompletedTutorial,
    isActive,
    setExperienceLevel,
    startTutorial,
    completeTutorial,
    abandonTutorial,
    resetTutorial
  } = useTutorialStore();

  // Experience level modal state
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  // Initialize tutorial state
  // Track tutorial state changes
  useEffect(() => {
    console.log('[HomePage] Tutorial state changed:', {
      experienceLevel,
      hasCompletedTutorial,
      isActive,
      showExperienceModal,
      stateInStorage: localStorage.getItem('tutorial-storage')
    });
  }, [experienceLevel, hasCompletedTutorial, isActive, showExperienceModal]);

  // Initialize tutorial modal
  useEffect(() => {
    console.log('[HomePage] Initializing tutorial modal');
    setShowExperienceModal(!experienceLevel);
  }, [experienceLevel]);

  const handleExperienceSelect = (level: 'beginner' | 'intermediate' | 'advanced') => {
    console.log('[HomePage] Experience Level Selected:', level);
    
    if (level === 'beginner') {
      console.log('[HomePage] Starting tutorial for beginner');
      // First clear any existing tutorial state
      localStorage.removeItem('tutorial-storage');
      // Then update experience level and start tutorial
      setExperienceLevel(level);
      setShowExperienceModal(false);
      startTutorial();
    } else {
      console.log('[HomePage] Completing tutorial for non-beginner');
      setExperienceLevel(level);
      setShowExperienceModal(false);
      completeTutorial();
    }
  };

  // Main state management
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
    overpaymentPlans: [{
      amount: 1000, startMonth: 0, endMonth: 30, isRecurring: true, frequency: 'monthly',
      afterPayment: 0, effect: 'reduceTerm',
      startDate: new Date()
    }],
    startDate: new Date(),
    currency: selectedCurrency
  });

  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [noOverpaymentResults, setOverpaymentResults] = useState<CalculationResults | null>(null);
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
    
    // Calculate with overpayments (full calculation)
    const resultsWithOverpayments = calculationService.calculateLoanDetails(detailsToUse);
    
    // Create a version of loan details without overpayments
    const detailsWithoutOverpayments = {
      ...detailsToUse,
      overpaymentPlans: [] // Empty array for no overpayments
    };
    
    // Calculate without overpayments (base calculation)
    const resultsWithoutOverpayments = calculationService.calculateLoanDetails(detailsWithoutOverpayments);
    
    // Set both results
    setCalculationResults(resultsWithOverpayments);
    setOverpaymentResults(resultsWithoutOverpayments);
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
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800 relative">
      {/* Tutorial components */}
      <ExperienceLevelAssessment
        isOpen={showExperienceModal}
        onClose={() => {
          console.log('[HomePage] Modal closed');
          setShowExperienceModal(false);
        }}
        onExperienceLevelSet={handleExperienceSelect}
      />

      {/* Tutorial overlay */}
      {experienceLevel === 'beginner' && !hasCompletedTutorial && (
        <TutorialOverlay
          isActive={isActive}
          experienceLevel="beginner"
          onComplete={() => {
            console.log('[HomePage] Tutorial completed');
            completeTutorial();
          }}
          onSkip={() => {
            console.log('[HomePage] Tutorial skipped');
            abandonTutorial();
            completeTutorial();
          }}
        />
      )}

      {/* Tutorial reset button with Clippy */}
      <Clippy
        onClick={() => {
          // Reset tutorial state completely
          resetTutorial();
          setShowExperienceModal(true);
        }}
        isAnimated={!hasCompletedTutorial}
      />

      <div className="bg-yellow-500 text-yellow-900 text-center py-2 sm:hidden block">
        {t('app.desktopOptimized')}
      </div>
      <div className="bg-yellow-500 text-yellow-900 text-center py-2 block">
        {t('app.beta')}
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div id="loan-form" className="bg-white rounded-lg shadow overflow-hidden">
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
            <div id="results-section">
              <LoanSummary
                calculationResults={calculationResults}
                noOverpaymentsResult={noOverpaymentResults}
                loanDetails={loanDetails}
              />
            </div>
            
            <ChartSection
              loanDetails={loanDetails}
              calculationResults={calculationResults}
            />
            
            <AmortizationSchedule
              yearlyData={calculationResults?.yearlyData || []}
              currency={selectedCurrency}
            />
            
            {/* Advanced features section */}
            <div id="advanced-features">
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
        </div>
      </main>

      <Footer />
      
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
