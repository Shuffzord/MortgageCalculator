import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mortgage-calculator";
import { LoanDetails, Schedule } from "@/lib/mortgage-calculator";
import { getCurrencySymbol } from "@/components/ui/currency-selector";

interface PaymentSummaryProps {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  loanDetails: LoanDetails;
  schedule: Schedule[];
  savedMonths: number;
  interestSavings: number;
  originalTotalInterest: number;
}

export default function PaymentSummary({
  monthlyPayment,
  totalInterest,
  totalPayment,
  loanDetails,
  schedule,
  savedMonths,
  interestSavings,
  originalTotalInterest
}: PaymentSummaryProps) {
  // Check if we have overpayment
  const hasOverpayment = loanDetails.overpaymentAmount > 0;
  
  // Format years and months for display
  const formatPeriod = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  // Calculate actual loan term with overpayment
  const actualPayments = schedule.length;
  const newTermText = formatPeriod(actualPayments);

  // Calculate savings information
  const savedYearsMonthsText = formatPeriod(savedMonths);
  const savingsPercentage = Math.round((interestSavings / originalTotalInterest) * 100);
  
  return (
    <Card className="bg-white shadow mb-6">
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Monthly Payment</p>
            <p className="text-2xl font-semibold text-gray-900 financial-figure">
              {formatCurrency(monthlyPayment, 'en-US', loanDetails.currency || 'USD')}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Total Interest</p>
            <p className="text-2xl font-semibold text-gray-900 financial-figure">
              {formatCurrency(totalInterest, 'en-US', loanDetails.currency || 'USD')}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Total Payment</p>
            <p className="text-2xl font-semibold text-gray-900 financial-figure">
              {formatCurrency(totalPayment, 'en-US', loanDetails.currency || 'USD')}
            </p>
          </div>
        </div>

        {hasOverpayment && (
          <div className="mt-6" id="overpaymentSummary">
            <h3 className="text-md font-medium text-gray-800 mb-2">With Overpayment:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">New Loan Term</p>
                <p className="text-lg font-semibold text-gray-900 financial-figure">
                  {newTermText}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {savedYearsMonthsText} saved
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Interest Savings</p>
                <p className="text-lg font-semibold text-gray-900 financial-figure">
                  {formatCurrency(interestSavings, 'en-US', loanDetails.currency || 'USD')}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {savingsPercentage}% of original interest
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
