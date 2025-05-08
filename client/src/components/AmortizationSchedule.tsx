import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YearlyData } from "@/lib/types";

interface AmortizationScheduleProps {
  yearlyData: YearlyData[];
  currency?: string;
}

export default function AmortizationSchedule({ yearlyData, currency = 'USD' }: AmortizationScheduleProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleData = showAll ? yearlyData : yearlyData.slice(0, 5);

  if (yearlyData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amortization Schedule</h2>
          <p>Please calculate loan details first to see the amortization schedule.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Amortization Schedule</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleData.map((year) => (
                <tr key={year.year} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {formatCurrency(year.payment, 'en-US', currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {formatCurrency(year.principal, 'en-US', currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {formatCurrency(year.interest, 'en-US', currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {formatCurrency(year.balance, 'en-US', currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {yearlyData.length > 5 && (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="link" 
                onClick={() => setShowAll(!showAll)}
                className="text-primary-600 hover:text-primary-700"
              >
                {showAll ? "Show Less" : "Show More"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
