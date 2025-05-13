import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoanDetails, PaymentData, CalculationResults } from "@/lib/types";
import { calculationService } from "@/lib/services/calculationService";
import { getCurrencySymbol } from "@/lib/utils";

interface PaymentSummaryProps {
  calculationResults: CalculationResults | null;
  loanDetails: LoanDetails;
}

export default function PaymentSummary({
  calculationResults,
  loanDetails
}: PaymentSummaryProps) {
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

  const currency = loanDetails.currency || 'USD';
  const hasOverpayment = loanDetails.overpaymentPlans && loanDetails.overpaymentPlans.length > 0;

  return (
    <Card className="bg-white shadow mb-6">
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Monthly Payment</p>
            <p className="text-2xl font-semibold text-gray-900 financial-figure">
              {calculationService.formatCurrency(calculationResults.monthlyPayment, undefined, currency)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Total Interest</p>
            <p className="text-2xl font-semibold text-gray-900 financial-figure">
              {calculationService.formatCurrency(calculationResults.totalInterest, undefined, currency)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Total Payment</p>
            <p className="text-2xl font-semibold text-gray-900 financial-figure">
              {calculationService.formatCurrency(loanDetails.principal + calculationResults.totalInterest, undefined, currency)}
            </p>
          </div>
        </div>

        {hasOverpayment && (
          <div className="mt-6" id="overpaymentSummary">
            <h3 className="text-md font-medium text-gray-800 mb-2">With Overpayment:</h3>
            {loanDetails.overpaymentPlans.map((plan, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">New Loan Term</p>
                  <p className="text-lg font-semibold text-gray-900 financial-figure">
                    {calculationService.formatTimePeriod(calculationResults.actualTerm * 12)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {/* {savedYearsMonthsText} saved */}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Interest Savings</p>
                  <p className="text-lg font-semibold text-gray-900 financial-figure">
                    {calculationService.formatCurrency(calculationResults.totalInterest, undefined, currency)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {/* {savingsPercentage}% of original interest */}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
