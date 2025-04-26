import { formatTimePeriod } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { CalculationResults, LoanDetails } from "@/lib/types";

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
  if (!calculationResults) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Summary</h2>
          <p>Please calculate loan details first.</p>
        </div>
      </div>
    );
  }

  const interestSaved = overpaymentResults 
    ? calculationResults.totalInterest - overpaymentResults.totalInterest 
    : 0;

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
