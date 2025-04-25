import React from "react";
import CalculatorForm from "@/components/mortgage-calculator/calculator-form";
import PaymentSummary from "@/components/mortgage-calculator/payment-summary";
import Visualization from "@/components/mortgage-calculator/visualization";
import AmortizationSchedule from "@/components/mortgage-calculator/amortization-schedule";
import SavedCalculationsModal from "@/components/mortgage-calculator/saved-calculations-modal";
import { useState } from "react";
import { 
  generateAmortizationSchedule, 
  calculateMonthlyPayment, 
  LoanDetails,
  Schedule
} from "@/lib/mortgage-calculator";
import { loadCalculation, saveCalculation, getSavedCalculations } from "@/lib/storage";
import { useTranslation } from "react-i18next";
import { 
  Calculator, 
  Save, 
  FolderOpen, 
  Home as HomeIcon,
  BarChart4, 
  Calendar, 
  HelpCircle 
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Initial loan details
const defaultLoanDetails: LoanDetails = {
  principal: 250000,
  interestRate: 4.5,
  loanTerm: 30,
  overpaymentAmount: 10000,
  overpaymentMonth: 24,
  reduceTermNotPayment: true,
  name: "Home Purchase - 30 Year",
  startDate: new Date(),
  currency: "USD"
};

export default function Home() {
  // State management
  const [loanDetails, setLoanDetails] = useState<LoanDetails>(defaultLoanDetails);
  const [schedule, setSchedule] = useState<Schedule[]>(() => 
    generateAmortizationSchedule(
      defaultLoanDetails.principal,
      defaultLoanDetails.interestRate,
      defaultLoanDetails.loanTerm,
      defaultLoanDetails.overpaymentAmount,
      defaultLoanDetails.overpaymentMonth,
      defaultLoanDetails.reduceTermNotPayment,
      defaultLoanDetails.startDate
    )
  );
  const [savedCalculationsOpen, setSavedCalculationsOpen] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState(getSavedCalculations());

  // Calculate financial summaries
  const monthlyPayment = calculateMonthlyPayment(
    loanDetails.principal,
    loanDetails.interestRate,
    loanDetails.loanTerm
  );

  const totalPrincipal = loanDetails.principal;
  const totalInterest = schedule
    .filter(item => !item.isOverpayment)
    .reduce((sum, item) => sum + item.interestPayment, 0);
  const totalPayment = totalPrincipal + totalInterest + (loanDetails.overpaymentAmount || 0);

  // Original expected total without overpayment
  const originalTotalInterest = monthlyPayment * (loanDetails.loanTerm * 12) - loanDetails.principal;

  // Calculate overpayment savings
  const actualPayments = schedule.length;
  const originalMonths = loanDetails.loanTerm * 12;
  const savedMonths = originalMonths - actualPayments;
  const interestSavings = originalTotalInterest - totalInterest;

  // Handle form submission
  const handleFormSubmit = (newLoanDetails: LoanDetails) => {
    setLoanDetails(newLoanDetails);
    const newSchedule = generateAmortizationSchedule(
      newLoanDetails.principal,
      newLoanDetails.interestRate,
      newLoanDetails.loanTerm,
      newLoanDetails.overpaymentAmount,
      newLoanDetails.overpaymentMonth,
      newLoanDetails.reduceTermNotPayment,
      newLoanDetails.startDate
    );
    setSchedule(newSchedule);
  };

  // Handle saving current calculation
  const handleSave = () => {
    saveCalculation({
      ...loanDetails,
      dateCreated: new Date().toISOString()
    });
    setSavedCalculations(getSavedCalculations());
  };

  // Handle loading a saved calculation
  const handleLoad = (calculation: LoanDetails) => {
    setLoanDetails(calculation);
    const newSchedule = generateAmortizationSchedule(
      calculation.principal,
      calculation.interestRate,
      calculation.loanTerm,
      calculation.overpaymentAmount,
      calculation.overpaymentMonth,
      calculation.reduceTermNotPayment,
      calculation.startDate
    );
    setSchedule(newSchedule);
    setSavedCalculationsOpen(false);
  };

  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold flex items-center" style={{ color: "#111111" }}>
              <Calculator className="mr-2 h-6 w-6" style={{ color: "#1A6B72" }} />
              {t('app.title')}
            </h1>
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              <button 
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
                style={{ backgroundColor: "#1A6B72", color: "#FFFFFF", borderColor: "transparent" }}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {t('form.saveCalculation')}
              </button>
              <button 
                onClick={() => setSavedCalculationsOpen(true)}
                className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
                style={{ backgroundColor: "#FFFFFF", color: "#333333", borderColor: "#E5E7EB" }}
              >
                <FolderOpen className="mr-1.5 h-4 w-4" />
                {t('form.loadCalculation')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Calculator form */}
            <div className="lg:col-span-4">
              <div className="rounded-lg shadow-md border overflow-hidden animate-fade-in" 
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
                <div className="p-4 border-b" 
                  style={{ backgroundColor: "rgba(26, 107, 114, 0.05)", borderColor: "#E5E7EB" }}>
                  <h2 className="flex items-center text-xl font-semibold" style={{ color: "#111111" }}>
                    <HomeIcon className="mr-2 h-5 w-5" style={{ color: "#1A6B72" }} />
                    {t('form.loanDetails')}
                  </h2>
                </div>
                <div className="p-6">
                  <CalculatorForm 
                    loanDetails={loanDetails} 
                    onFormSubmit={handleFormSubmit} 
                  />
                </div>
              </div>
            </div>

            {/* Results area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Payment Summary */}
              <div className="rounded-lg shadow-md border overflow-hidden animate-fade-in"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
                <div className="p-4 border-b" 
                  style={{ backgroundColor: "rgba(232, 168, 124, 0.1)", borderColor: "#E5E7EB" }}>
                  <h2 className="flex items-center text-xl font-semibold" style={{ color: "#111111" }}>
                    <BarChart4 className="mr-2 h-5 w-5" style={{ color: "#E8A87C" }} />
                    {t('summary.title')}
                  </h2>
                </div>
                <div className="p-6">
                  <PaymentSummary 
                    monthlyPayment={monthlyPayment}
                    totalInterest={totalInterest}
                    totalPayment={totalPayment}
                    loanDetails={loanDetails}
                    schedule={schedule}
                    savedMonths={savedMonths}
                    interestSavings={interestSavings}
                    originalTotalInterest={originalTotalInterest}
                  />
                </div>
              </div>
              
              {/* Visualization */}
              <div className="rounded-lg shadow-md border overflow-hidden animate-fade-in"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
                <div className="p-4 border-b" 
                  style={{ backgroundColor: "rgba(52, 152, 219, 0.1)", borderColor: "#E5E7EB" }}>
                  <h2 className="flex items-center text-xl font-semibold" style={{ color: "#111111" }}>
                    <BarChart4 className="mr-2 h-5 w-5" style={{ color: "#3498DB" }} />
                    {t('chart.title')}
                  </h2>
                </div>
                <div className="p-6">
                  <Visualization 
                    schedule={schedule}
                    totalPrincipal={totalPrincipal}
                    totalInterest={totalInterest}
                  />
                </div>
              </div>
              
              {/* Amortization Schedule */}
              <div className="rounded-lg shadow-md border overflow-hidden animate-fade-in"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
                <div className="p-4 border-b" 
                  style={{ backgroundColor: "rgba(46, 139, 87, 0.1)", borderColor: "#E5E7EB" }}>
                  <h2 className="flex items-center text-xl font-semibold" style={{ color: "#111111" }}>
                    <Calendar className="mr-2 h-5 w-5" style={{ color: "#2E8B57" }} />
                    {t('schedule.title')}
                  </h2>
                </div>
                <div className="p-6">
                  <AmortizationSchedule 
                    schedule={schedule} 
                    loanDetails={loanDetails} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6" 
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-2 md:mb-0" style={{ color: "#737373" }}>
              <p>{t('app.title')} | &copy; {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center text-sm" style={{ color: "#737373" }}>
              <HelpCircle className="h-4 w-4 mr-1" style={{ color: "#737373" }} />
              <p>{t('app.description')}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Saved calculations modal */}
      <SavedCalculationsModal
        isOpen={savedCalculationsOpen} 
        onClose={() => setSavedCalculationsOpen(false)}
        savedCalculations={savedCalculations}
        onLoadCalculation={handleLoad}
      />
    </div>
  );
}
