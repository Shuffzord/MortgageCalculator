import { formatTimePeriod } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { CalculationResults, LoanDetails, InterestRatePeriod } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { getCurrencySymbol } from "@/components/ui/currency-selector";

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('summary.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.monthlyPayment')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(calculationResults.monthlyPayment)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.totalInterest')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(calculationResults.totalInterest)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.totalPayment')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(loanDetails.principal + calculationResults.totalInterest)}
            </p>
          </div>
          
          {/* Interest Rate Periods Information */}
          <div className="md:col-span-3 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <h3 className="text-sm font-medium text-blue-700 mb-2">{t('summary.interestRatePeriods')}</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('summary.period')}</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('schedule.dateRange', 'Date Range')}</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('summary.interestRate')}</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('summary.monthlyPayment')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loanDetails.interestRatePeriods.map((period, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index === 0 ? t('summary.initialRate') : `${t('summary.period')} ${index + 1}`}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {getInterestPeriodMonthRange(period, index)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {period.interestRate}%
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {/* For simplicity, we're showing the main monthly payment for now */}
                        {formatCurrency(calculationResults.monthlyPayment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Overpayment Information */}
          {loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0 && (
            <div className="md:col-span-3 bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
              <h3 className="text-sm font-medium text-amber-700 mb-2">{t('overpayment.title')}</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-amber-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loanDetails.overpaymentPlans.map((plan, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {formatCurrency(plan.amount)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {loanDetails.startDate && formatDate(new Date(loanDetails.startDate), plan.startMonth)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {plan.frequency}
                          {plan.isRecurring && plan.endMonth && 
                           ` (until ${loanDetails.startDate && formatDate(new Date(loanDetails.startDate), plan.endMonth)})`}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {plan.effect === 'reduceTerm' ? t('overpayment.reduceTerm') : t('overpayment.reducePayment')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {overpaymentResults && (
            <div className="md:col-span-3 bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700">{t('overpayment.results')}</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-green-600">{t('overpayment.newMonthlyPayment')}</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formatCurrency(overpaymentResults.monthlyPayment)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">{t('overpayment.interestSaved')}</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formatCurrency(interestSaved)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">
                    {typeof overpaymentResults.timeOrPaymentSaved === 'number' && 
                     overpaymentResults.timeOrPaymentSaved > 100 
                      ? t('overpayment.timeSaved')
                      : t('overpayment.paymentReduced')}
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
