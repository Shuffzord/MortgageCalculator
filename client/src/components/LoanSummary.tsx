import { formatCurrency, formatDate, formatInterestRate } from '@/lib/formatters';
import { CalculationResults, LoanDetails, InterestRatePeriod } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { calculationService } from '@/lib/services/calculationService';
import { useComparison } from '../hooks/use-comparison';
import SavingsSpotlight from './SavingsSpotlight';

interface LoanSummaryProps {
  calculationResults: CalculationResults | null;
  noOverpaymentsResult: CalculationResults | null;
  loanDetails: LoanDetails;
}

export default function LoanSummary({
  calculationResults,
  noOverpaymentsResult,
  loanDetails,
}: LoanSummaryProps) {
  const { t } = useTranslation();

  // Add the comparison hook with CORRECT parameter order
  const { interestSaved, timeSaved, percentageSaved, isLoading, error, runComparison } =
    useComparison(
      noOverpaymentsResult,
      calculationResults,
      true // Auto-compare when results change
    );

  if (!calculationResults) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('summary.title')}</h2>
        </div>
      </div>
    );
  }
  // Format a date to show month and year
  const formatMonthYear = (date: Date, monthsToAdd: number = 0): string => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    return formatDate(newDate, 'MMM yyyy');
  };

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
    <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="loan-summary">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('summary.title')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div id="payment-breakdown" className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.monthlyPayment')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(
                Number(calculationResults.monthlyPayment),
                undefined,
                loanDetails.currency
              )}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.totalInterest')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(
                Number(calculationResults.totalInterest),
                undefined,
                loanDetails.currency
              )}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.totalPayment')}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {formatCurrency(
                Number(loanDetails.principal) + Number(calculationResults.totalInterest),
                undefined,
                loanDetails.currency
              )}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">{t('summary.apr') || 'APR'}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 font-mono">
              {calculationResults.apr ? formatInterestRate(calculationResults.apr / 100) : 'N/A'}
            </p>
          </div>

          {/* Interest Rate Periods Information */}
          <div className="md:col-span-4 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <h3 className="text-sm font-medium text-blue-700 mb-2">
              {t('summary.interestRatePeriods')}
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('summary.period')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('schedule.dateRange', 'Date Range')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('summary.interestRate')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {t('summary.monthlyPayment')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loanDetails.interestRatePeriods.map((period, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index === 0
                          ? t('summary.initialRate')
                          : `${t('summary.period')} ${index + 1}`}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {getInterestPeriodMonthRange(period, index)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatInterestRate(period.interestRate / 100)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {formatCurrency(
                          Number(calculationResults.monthlyPayment),
                          undefined,
                          loanDetails.currency
                        )}
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
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        #
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {t('overpayment.amount')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {t('form.startMonth')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {t('overpayment.frequency')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {t('overpayment.effect')}
                      </th>
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
                          {loanDetails.startDate &&
                            formatMonthYear(new Date(loanDetails.startDate), plan.startMonth)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {plan.frequency === 'monthly' && t('overpayment.monthly')}
                          {plan.frequency === 'quarterly' && t('overpayment.quarterly')}
                          {plan.frequency === 'annual' && t('overpayment.annual')}
                          {plan.frequency === 'one-time' && t('overpayment.oneTime')}
                          {plan.isRecurring &&
                            plan.endMonth &&
                            ` (${t('until')} ${loanDetails.startDate && formatMonthYear(new Date(loanDetails.startDate), plan.endMonth)})`}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {plan.effect === 'reduceTerm'
                            ? t('overpayment.reduceTerm')
                            : t('overpayment.reducePayment')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Removed duplicate overpayment results section - now using SavingsSpotlight component */}

          {/* Savings Spotlight */}
          <div className="md:col-span-4">
            <SavingsSpotlight
              moneySaved={interestSaved}
              timeSaved={timeSaved}
              percentageSaved={percentageSaved}
              currency={loanDetails.currency || 'USD'}
              isLoading={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
