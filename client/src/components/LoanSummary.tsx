import { formatTimePeriod, getCurrencySymbol } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { CalculationResults, LoanDetails, InterestRatePeriod } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

interface LoanSummaryProps {
  calculationResults: CalculationResults | null;
  overpaymentResults: CalculationResults | null;
  loanDetails: LoanDetails;
}

export default function LoanSummary({
  calculationResults,
  overpaymentResults,
  loanDetails
}: LoanSummaryProps) {
  const { t } = useTranslation();
  
  if (!calculationResults) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('summary.title')}</h2>
          <p>Please calculate loan details first.</p>
        </div>
      </div>
    );
  }

  const interestSaved = overpaymentResults 
    ? calculationResults.totalInterest - overpaymentResults.totalInterest 
    : 0;
    
  // Format a date to show month and year
  const formatDate = (date: Date, monthsToAdd: number = 0): string => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    return format(newDate, 'MMM yyyy');
  }
  
  // Get month range text for interest rate periods
  const getInterestPeriodMonthRange = (period: InterestRatePeriod, index: number): string => {
    if (!loanDetails.startDate) return '';
    
    const startMonth = period.startMonth;
    const startDate = new Date(loanDetails.startDate);
    startDate.setMonth(startDate.getMonth() + startMonth);
    
    // If this is the last period or the only period
    const nextPeriod = loanDetails.interestRatePeriods[index + 1];
    if (!nextPeriod) {
      return `${formatDate(startDate)} - ${formatDate(loanDetails.startDate, loanDetails.loanTerm * 12)}`;
    }
    
    // If there's a next period
    const endDate = new Date(loanDetails.startDate);
    endDate.setMonth(endDate.getMonth() + nextPeriod.startMonth - 1);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Monthly Payment</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(calculationResults.monthlyPayment)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Interest</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(calculationResults.totalInterest)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(loanDetails.principal + calculationResults.totalInterest)}
            </p>
          </div>
          
          {overpaymentResults && (
            <div className="md:col-span-3 bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700">With Overpayment</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-green-600">New Monthly Payment</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formatCurrency(overpaymentResults.monthlyPayment)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">Interest Saved</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formatCurrency(interestSaved)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">
                    {typeof overpaymentResults.timeOrPaymentSaved === 'number' && 
                     overpaymentResults.timeOrPaymentSaved > 100 
                      ? 'Time Saved' 
                      : 'Payment Reduced'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {typeof overpaymentResults.timeOrPaymentSaved === 'number' && 
                     overpaymentResults.timeOrPaymentSaved > 100 
                      ? formatTimePeriod(overpaymentResults.timeOrPaymentSaved)
                      : formatCurrency(overpaymentResults.timeOrPaymentSaved ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
