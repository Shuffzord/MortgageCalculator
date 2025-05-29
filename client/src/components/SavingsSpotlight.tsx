import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatTimePeriod, formatInterestRate } from '../lib/formatters';

interface SavingsSpotlightProps {
  moneySaved: number;
  timeSaved: number;
  percentageSaved: number;
  currency: string;
  isLoading?: boolean;
}

/**
 * SavingsSpotlight component displays the impact of overpayments
 * in a visually appealing way, focusing on three key metrics:
 * money saved, time saved, and percentage value.
 */
const SavingsSpotlight: React.FC<SavingsSpotlightProps> = ({
  moneySaved,
  timeSaved,
  percentageSaved,
  currency,
  isLoading = false
}) => {
  const { t } = useTranslation();

  // Add loading state UI
  if (isLoading) {
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
        <div className="text-center">
          <p className="text-sm text-green-600">{t('summary.calculatingSavings', 'Calculating savings...')}</p>
        </div>
      </div>
    );
  }

  // Only show if there are actual savings
  if (moneySaved <= 0 && timeSaved <= 0) {
    // Instead of returning null, show a message
    return ( null
      // <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mt-4">

      //   <div className="text-center">
      //     <p className="text-sm text-yellow-600">
      //       {t('summary.noSavingsYet', 'No savings calculated yet. Try adding or adjusting overpayments.')}
      //     </p>
      //   </div>
      // </div>
    );
  }

  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">

      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-green-700">
          {t('summary.overpaymentSavingsHighlight', {
            amount: formatCurrency(moneySaved, undefined, currency)
          })}
        </h3>
        <p className="text-sm text-green-600">
          {t('summary.impactDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Money Saved Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-500 uppercase">
            {t('summary.moneySaved', 'Money Saved')}
          </h4>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatCurrency(moneySaved, undefined, currency)}
          </p>
        </div>

        {/* Time Saved Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-500 uppercase">
            {t('summary.timeSaved', 'Time Saved')}
          </h4>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatTimePeriod(timeSaved)}
          </p>
        </div>

        {/* Value Percentage Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-500 uppercase">
            {t('summary.valuePercentage', 'Value')}
          </h4>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {formatInterestRate(percentageSaved / 100)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SavingsSpotlight;