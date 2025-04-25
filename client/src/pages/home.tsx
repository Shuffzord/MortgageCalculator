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

// Initial loan details
const defaultLoanDetails: LoanDetails = {
  principal: 250000,
  interestRate: 4.5,
  loanTerm: 30,
  overpaymentAmount: 10000,
  overpaymentMonth: 24,
  reduceTermNotPayment: true,
  name: "Home Purchase - 30 Year"
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
      defaultLoanDetails.reduceTermNotPayment
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
      newLoanDetails.reduceTermNotPayment
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
      calculation.reduceTermNotPayment
    );
    setSchedule(newSchedule);
    setSavedCalculationsOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <span className="material-icons mr-2 text-primary">calculate</span>
              Mortgage Calculator
            </h1>
            <div>
              <button 
                onClick={handleSave}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-2"
              >
                <span className="material-icons mr-1 text-sm">save</span>
                Save
              </button>
              <button 
                onClick={() => setSavedCalculationsOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="material-icons mr-1 text-sm">folder_open</span>
                Load
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calculator form */}
            <div className="lg:col-span-1">
              <CalculatorForm 
                loanDetails={loanDetails} 
                onFormSubmit={handleFormSubmit} 
              />
            </div>

            {/* Results area */}
            <div className="lg:col-span-2">
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
              
              <Visualization 
                schedule={schedule}
                totalPrincipal={totalPrincipal}
                totalInterest={totalInterest}
              />
              
              <AmortizationSchedule schedule={schedule} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-500 text-sm">
            <p>Mortgage Calculator POC | &copy; {new Date().getFullYear()} | All calculations are estimates only</p>
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
