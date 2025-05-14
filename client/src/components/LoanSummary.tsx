import { formatTimePeriod, formatCurrency, formatDate } from "@/lib/formatters";
import { getCurrencySymbol } from "@/lib/utils";
import { CalculationResults, LoanDetails, InterestRatePeriod } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { calculationService } from "@/lib/services/calculationService";
import SavingsSpotlight from "./SavingsSpotlight";

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
  
  // State for impact analysis data
  const [impactData, setImpactData] = useState<{ amount: number; interestSaved: number; termReduction: number }[] | null>(null);
  
  // Calculate impact data when overpayment results are available
  useEffect(() => {
    console.log("useEffect for impact data triggered");
    console.log("overpaymentResults:", overpaymentResults);
    console.log("loanDetails.overpaymentPlans:", loanDetails.overpaymentPlans);
    
    // Changed condition to not require overpaymentResults
    // We only need overpayment plans to calculate impact data
    if (loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0) {
      console.log("Overpayment plans:", loanDetails.overpaymentPlans);
      
      // Calculate the maximum monthly overpayment amount to analyze
      let maxMonthlyAmount = loanDetails.overpaymentPlans.reduce((max, plan) => {
        if (plan.frequency === 'monthly') {
          return Math.max(max, plan.amount);
        }
        return max;
      }, 0);
      
      console.log("Initial maxMonthlyAmount:", maxMonthlyAmount);
      
      // If no monthly overpayment, use the first overpayment amount as a base
      if (maxMonthlyAmount === 0 && loanDetails.overpaymentPlans.length > 0) {
        // For non-monthly plans, use a reasonable monthly equivalent
        const firstPlan = loanDetails.overpaymentPlans[0];
        console.log("Using first plan for calculation:", firstPlan);
        
        if (firstPlan.frequency === 'one-time') {
          // For one-time payments, divide by 12 to get a monthly equivalent
          maxMonthlyAmount = firstPlan.amount / 12;
          console.log("One-time payment converted to monthly:", maxMonthlyAmount);
        } else if (firstPlan.frequency === 'quarterly') {
          // For quarterly payments, divide by 3 to get a monthly equivalent
          maxMonthlyAmount = firstPlan.amount / 3;
          console.log("Quarterly payment converted to monthly:", maxMonthlyAmount);
        } else if (firstPlan.frequency === 'annual') {
          // For annual payments, divide by 12 to get a monthly equivalent
          maxMonthlyAmount = firstPlan.amount / 12;
          console.log("Annual payment converted to monthly:", maxMonthlyAmount);
        } else {
          // Default fallback
          maxMonthlyAmount = firstPlan.amount / 10;
          console.log("Using default conversion to monthly:", maxMonthlyAmount);
        }
        
        console.log("No monthly overpayment found, using calculated amount:", maxMonthlyAmount);
      }
      
      // Always analyze impact as long as there's an overpayment plan
      // Ensure we have a reasonable amount to analyze (at least 1% of principal)
      const minAnalysisAmount = Math.max(
        maxMonthlyAmount,
        loanDetails.principal * 0.01 / 12 // At least 1% of principal per year (divided by 12 for monthly)
      );
      
      console.log("Final analysis amount:", minAnalysisAmount);
      console.log("Analyzing impact with amount:", minAnalysisAmount);
      
      try {
        const impact = calculationService.analyzeOverpaymentImpact(
          loanDetails,
          minAnalysisAmount * 2, // Analyze up to double the amount
          5 // 5 data points
        );
        console.log("Impact data calculated:", impact);
        setImpactData(impact);
      } catch (error) {
        console.error("Error calculating impact data:", error);
      }
    } else {
      console.log("Conditions not met for impact analysis");
      if (!overpaymentResults) console.log("No overpaymentResults");
      if (!loanDetails.overpaymentPlans) console.log("No overpaymentPlans");
      if (loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length === 0) console.log("Empty overpaymentPlans");
    }
  }, [overpaymentResults, loanDetails]);
  
  // No chart creation useEffect needed anymore
  
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
    ? Number(calculationResults.totalInterest) - Number(overpaymentResults.totalInterest)
    : 0;
    
  // Format a date to show month and year
  const formatMonthYear = (date: Date, monthsToAdd: number = 0): string => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    return formatDate(newDate, 'MMM yyyy');
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
      return `${formatMonthYear(startDate)} - ${formatMonthYear(loanDetails.startDate, loanDetails.loanTerm * 12)}`;
    }
    
    // If there's a next period
    const endDate = new Date(loanDetails.startDate);
    endDate.setMonth(endDate.getMonth() + nextPeriod.startMonth - 1);
    return `${formatMonthYear(startDate)} - ${formatMonthYear(endDate)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('summary.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.monthlyPayment')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(Number(calculationResults.monthlyPayment), undefined, loanDetails.currency)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.totalInterest')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(Number(calculationResults.totalInterest), undefined, loanDetails.currency)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.totalPayment')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(Number(loanDetails.principal) + Number(calculationResults.totalInterest), undefined, loanDetails.currency)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.apr') || "APR"}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {calculationResults.apr ? `${calculationResults.apr.toFixed(2)}%` : 'N/A'}
            </p>
          </div>
          
          {/* Interest Rate Periods Information */}
          <div className="md:col-span-4 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
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
                        {formatCurrency(Number(calculationResults.monthlyPayment), undefined, loanDetails.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          
          {loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0 && (
            <div className="md:col-span-4 bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
              <h3 className="text-sm font-medium text-amber-700 mb-2">{t('overpayment.title')}</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-amber-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('overpayment.amount')}</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('form.startMonth')}</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('overpayment.frequency')}</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('overpayment.effect')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loanDetails.overpaymentPlans.map((plan, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {formatCurrency(Number(plan.amount), undefined, loanDetails.currency)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {loanDetails.startDate && formatMonthYear(new Date(loanDetails.startDate), plan.startMonth)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {plan.frequency === 'monthly' && t('overpayment.monthly')}
                          {plan.frequency === 'quarterly' && t('overpayment.quarterly')}
                          {plan.frequency === 'annual' && t('overpayment.annual')}
                          {plan.frequency === 'one-time' && t('overpayment.oneTime')}
                          {plan.isRecurring && plan.endMonth && 
                           ` (${t('until')} ${loanDetails.startDate && formatMonthYear(new Date(loanDetails.startDate), plan.endMonth)})`}
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
            <div className="md:col-span-4 bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700">{t('overpayment.results')}</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-green-600">{t('overpayment.newMonthlyPayment')}</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formatCurrency(Number(overpaymentResults.monthlyPayment), undefined, loanDetails.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">{t('overpayment.interestSaved')}</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formatCurrency(Number(interestSaved), undefined, loanDetails.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">
                    {typeof overpaymentResults.timeOrPaymentSaved === 'number' &&
                     Number(overpaymentResults.timeOrPaymentSaved) > 100
                      ? t('overpayment.timeSaved')
                      : t('overpayment.paymentReduced')}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {typeof overpaymentResults.timeOrPaymentSaved === 'number' &&
                     Number(overpaymentResults.timeOrPaymentSaved) > 100
                      ? formatTimePeriod(Number(overpaymentResults.timeOrPaymentSaved))
                      : formatCurrency(Number(overpaymentResults.timeOrPaymentSaved ?? 0), undefined, loanDetails.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Combined Savings Spotlight */}
          {console.log("Rendering savings spotlight section, conditions:", {
            hasOverpaymentResults: !!overpaymentResults,
            hasImpactData: !!impactData,
            impactDataLength: impactData?.length,
            hasOverpaymentPlans: !!(loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0)
          })}
          {impactData && calculationResults && (
            <div className="md:col-span-4">
              {overpaymentResults ? (
                // When we have actual overpayment results
                <SavingsSpotlight
                  moneySaved={interestSaved}
                  timeSaved={Number(overpaymentResults.timeOrPaymentSaved || 0)}
                  percentageSaved={(interestSaved / Number(calculationResults.totalInterest)) * 100}
                  currency={loanDetails.currency || 'USD'}
                />
              ) : (
                // When we only have potential impact data
                <SavingsSpotlight
                  moneySaved={Number(impactData[impactData.length - 1].interestSaved)}
                  timeSaved={Number(impactData[impactData.length - 1].termReduction) * 12} // Convert years to months
                  percentageSaved={(Number(impactData[impactData.length - 1].interestSaved) / Number(calculationResults.totalInterest)) * 100}
                  currency={loanDetails.currency || 'USD'}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

