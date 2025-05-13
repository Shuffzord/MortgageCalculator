import { useState, useEffect } from "react";
import LoanInputForm from "@/components/LoanInputForm";
import LoanSummary from "@/components/LoanSummary";
import ChartSection from "@/components/ChartSection";
import AmortizationSchedule from "@/components/AmortizationSchedule";
import OverpaymentOptimizationPanel from "@/components/OverpaymentOptimizationPanel";
import ExportPanel from "@/components/ExportPanel";
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
  showExportModal: boolean;
  setShowExportModal: React.Dispatch<React.SetStateAction<boolean>>;
  showLoadModal: boolean;
  setShowLoadModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Home({
  selectedCurrency,
  onCurrencyChange,
  showExportModal,
  setShowExportModal,
  showLoadModal,
  setShowLoadModal
}: HomeProps) {
  const { t } = useTranslation();

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
    <div className="page-container">
      <div className="bg-warning text-warning-foreground text-center py-2 sm:hidden">
        {t('app.desktopOptimized')}
      </div>
      <main className="page-content">
        <div className="content-card">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <section className="section-container">
                <h2 className="section-title">{t('calculator.inputTitle')}</h2>
                <div className="panel-item">
                  <LoanInputForm
                    loanDetails={loanDetails}
                    setLoanDetails={setLoanDetails}
                    onCalculate={handleCalculateLoan}
                    selectedCurrency={selectedCurrency}
                    onCurrencyChange={onCurrencyChange}
                  />
                </div>
              </section>
            </div>
            
            <div className="lg:col-span-2 space-y-8">
              <section className="section-container">
                <h2 className="section-title">{t('calculator.summary')}</h2>
                <div className="data-display">
                  <LoanSummary
                    calculationResults={calculationResults}
                    overpaymentResults={null}
                    loanDetails={loanDetails}
                  />
                </div>
              </section>
              
              <section className="section-container">
                <h2 className="section-title">{t('calculator.charts')}</h2>
                <div className="chart-container">
                  <ChartSection
                    loanDetails={loanDetails}
                    calculationResults={calculationResults}
                  />
                </div>
              </section>
              
              <section className="section-container">
                <h2 className="section-title">{t('calculator.schedule')}</h2>
                <div className="data-display">
                  <AmortizationSchedule
                    yearlyData={calculationResults?.yearlyData || []}
                    currency={selectedCurrency}
                  />
                </div>
              </section>
              
              <section className="section-container">
                <h2 className="section-title">{t('calculator.optimization')}</h2>
                <div className="panel-item">
                  <OverpaymentOptimizationPanel
                    loanDetails={loanDetails}
                    onApplyOptimization={(optimizedOverpayments) => {
                      const updatedDetails = {
                        ...loanDetails,
                        overpaymentPlans: optimizedOverpayments
                      };
                      setLoanDetails(updatedDetails);
                      handleCalculateLoan(updatedDetails);
                    }}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-6">
          <p className="text-sm text-muted-foreground text-center">
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
