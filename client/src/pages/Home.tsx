import { useState, useEffect } from "react";
import LoanInputForm from "@/components/LoanInputForm";
import OverpaymentSection from "@/components/OverpaymentSection";
import LoanSummary from "@/components/LoanSummary";
import ChartSection from "@/components/ChartSection";
import AmortizationSchedule from "@/components/AmortizationSchedule";
import LoadModal from "@/components/LoadModal";
import { 
  CalculationResults, 
  LoanDetails, 
  OverpaymentDetails,
  SavedCalculation
} from "@/lib/types";
import { 
  calculateLoanDetails, 
  applyOverpayment 
} from "@/lib/calculationEngine";
import { saveCalculation, getSavedCalculations } from "@/lib/storageService";
import { Button } from "@/components/ui/button";
import { Save, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  
  // State management
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    principal: 250000,
    interestRate: 4.5,
    loanTerm: 30
  });

  const [overpaymentDetails, setOverpaymentDetails] = useState<OverpaymentDetails>({
    amount: 10000,
    afterPayment: 12,
    effect: 'reduceTerm'
  });

  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [overpaymentResults, setOverpaymentResults] = useState<CalculationResults | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

  // Calculate loan details on initial load
  useEffect(() => {
    handleCalculateLoan();
  }, []);

  // Load saved calculations when modal opens
  useEffect(() => {
    if (showLoadModal) {
      const calculations = getSavedCalculations();
      setSavedCalculations(calculations);
    }
  }, [showLoadModal]);

  const handleCalculateLoan = () => {
    const results = calculateLoanDetails(
      loanDetails.principal,
      loanDetails.interestRate,
      loanDetails.loanTerm
    );
    setCalculationResults(results);
    setOverpaymentResults(null); // Reset overpayment results when recalculating
  };

  const handleApplyOverpayment = () => {
    if (!calculationResults) return;

    const results = applyOverpayment(
      calculationResults.amortizationSchedule,
      overpaymentDetails.amount,
      overpaymentDetails.afterPayment,
      overpaymentDetails.effect
    );

    setOverpaymentResults({
      ...results.newCalculation,
      timeOrPaymentSaved: results.timeOrPaymentSaved
    });
  };

  const handleSaveCalculation = () => {
    if (!calculationResults) return;
    
    const savedCalc = saveCalculation(loanDetails, overpaymentDetails);
    alert("Calculation saved successfully!");
  };

  const handleLoadCalculation = (calculation: SavedCalculation) => {
    setLoanDetails(calculation.loanDetails);
    setOverpaymentDetails(calculation.overpayment);
    setShowLoadModal(false);
    
    // Recalculate with loaded values
    setTimeout(() => {
      handleCalculateLoan();
    }, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">{t('app.title')}</h1>
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                onClick={handleSaveCalculation}
                className="flex items-center"
              >
                <Save className="mr-1 h-4 w-4" />
                {t('form.saveCalculation')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowLoadModal(true)}
                className="flex items-center"
              >
                <FolderOpen className="mr-1 h-4 w-4" />
                {t('form.loadCalculation')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <LoanInputForm 
                loanDetails={loanDetails} 
                setLoanDetails={setLoanDetails} 
                onCalculate={handleCalculateLoan} 
              />
              <OverpaymentSection 
                overpaymentDetails={overpaymentDetails}
                setOverpaymentDetails={setOverpaymentDetails}
                onApplyOverpayment={handleApplyOverpayment}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <LoanSummary 
              calculationResults={calculationResults} 
              overpaymentResults={overpaymentResults}
              loanDetails={loanDetails}
            />
            
            <ChartSection 
              loanDetails={loanDetails}
              calculationResults={
                overpaymentResults || calculationResults
              }
            />
            
            <AmortizationSchedule 
              yearlyData={
                overpaymentResults?.yearlyData || 
                calculationResults?.yearlyData || []
              }
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
    </div>
  );
}
