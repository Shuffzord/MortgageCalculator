import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  compareScenarios,
  calculateCumulativeCostDifference,
  calculateMonthlyPaymentDifference,
} from '@/lib/comparisonEngine';
import { LoanDetails, ScenarioComparison, ScenarioComparisonOptions } from '@/lib/types';
import { calculationService } from '@/lib/services/calculationService';
import { useTranslation } from 'react-i18next';
import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';

interface ScenarioComparisonProps {
  savedScenarios: Array<{ id: string; name: string; loanDetails: LoanDetails }>;
}

export default function ScenarioComparisonComponent({ savedScenarios }: ScenarioComparisonProps) {
  const { t } = useTranslation();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [options, setOptions] = useState<ScenarioComparisonOptions>({
    includeBreakEvenAnalysis: true,
    includeAmortizationComparison: true,
    includeMonthlyPaymentComparison: true,
    includeTotalCostComparison: true,
  });

  const costChartRef = useRef<HTMLCanvasElement | null>(null);
  const paymentChartRef = useRef<HTMLCanvasElement | null>(null);
  const [costChart, setCostChart] = useState<Chart | null>(null);
  const [paymentChart, setPaymentChart] = useState<Chart | null>(null);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (costChart) costChart.destroy();
      if (paymentChart) paymentChart.destroy();
    };
  }, [costChart, paymentChart]);

  const handleCompare = () => {
    if (selectedScenarios.length < 2) return;

    const scenariosToCompare = savedScenarios.filter((s) => selectedScenarios.includes(s.id));

    const result = compareScenarios(scenariosToCompare, options);
    setComparison(result);
  };

  // Create or update charts when comparison data changes
  useEffect(() => {
    if (!comparison || comparison.scenarios.length < 2) return;

    // Destroy existing charts before creating new ones
    if (costChart) {
      costChart.destroy();
      setCostChart(null);
    }

    if (paymentChart) {
      paymentChart.destroy();
      setPaymentChart(null);
    }

    const scenario1 = comparison.scenarios[0];
    const scenario2 = comparison.scenarios[1];

    // Create cost comparison chart
    const costChartTimer = setTimeout(() => {
      // Only create charts if we have the necessary refs and options
      if (options.includeTotalCostComparison && costChartRef.current) {
        const costDifferences = calculateCumulativeCostDifference(
          scenario1.results.amortizationSchedule,
          scenario2.results.amortizationSchedule
        );

        // Create labels for months (1, 2, 3, etc.)
        const months = Array.from({ length: costDifferences.length }, (_, i) => (i + 1).toString());

        const newCostChart = new Chart(costChartRef.current, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              {
                label: `${scenario1.name} vs ${scenario2.name} - Cumulative Cost Difference`,
                data: costDifferences,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Cost Difference',
                },
                ticks: {
                  callback: function (value) {
                    return calculationService.formatCurrency(
                      value as number,
                      undefined,
                      scenario1.loanDetails.currency || 'USD'
                    );
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Month',
                },
                ticks: {
                  maxTicksLimit: 12,
                  callback: function (value, index) {
                    // Show every 12th month (yearly)
                    return index % 12 === 0 ? `Year ${Math.floor(index / 12) + 1}` : '';
                  },
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = context.raw as number;
                    return `Difference: ${calculationService.formatCurrency(value, undefined, scenario1.loanDetails.currency || 'USD')}`;
                  },
                  title: function (context) {
                    const index = context[0].dataIndex;
                    const years = Math.floor(index / 12);
                    const months = index % 12;
                    return `Month ${index + 1} (Year ${years + 1}, Month ${months + 1})`;
                  },
                },
              },
            },
          },
        });

        setCostChart(newCostChart);
      }
    }, 0);

    // Create payment comparison chart
    const paymentChartTimer = setTimeout(() => {
      if (options.includeMonthlyPaymentComparison && paymentChartRef.current) {
        const paymentDifferences = calculateMonthlyPaymentDifference(
          scenario1.results.amortizationSchedule,
          scenario2.results.amortizationSchedule
        );

        // Create labels for months (1, 2, 3, etc.)
        const months = Array.from({ length: paymentDifferences.length }, (_, i) =>
          (i + 1).toString()
        );

        const newPaymentChart = new Chart(paymentChartRef.current, {
          type: 'bar',
          data: {
            labels: months,
            datasets: [
              {
                label: `${scenario1.name} vs ${scenario2.name} - Monthly Payment Difference`,
                data: paymentDifferences,
                backgroundColor: function (context) {
                  const value = context.raw as number;
                  return value >= 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)';
                },
                borderColor: function (context) {
                  const value = context.raw as number;
                  return value >= 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)';
                },
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Payment Difference',
                },
                ticks: {
                  callback: function (value) {
                    return calculationService.formatCurrency(
                      value as number,
                      undefined,
                      scenario1.loanDetails.currency || 'USD'
                    );
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Month',
                },
                ticks: {
                  maxTicksLimit: 12,
                  callback: function (value, index) {
                    // Show every 12th month (yearly)
                    return index % 12 === 0 ? `Year ${Math.floor(index / 12) + 1}` : '';
                  },
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = context.raw as number;
                    return `Difference: ${calculationService.formatCurrency(value, undefined, scenario1.loanDetails.currency || 'USD')}`;
                  },
                  title: function (context) {
                    const index = context[0].dataIndex;
                    const years = Math.floor(index / 12);
                    const months = index % 12;
                    return `Month ${index + 1} (Year ${years + 1}, Month ${months + 1})`;
                  },
                },
              },
            },
          },
        });

        setPaymentChart(newPaymentChart);
      }
    }, 0);

    // Cleanup function for timers
    return () => {
      clearTimeout(costChartTimer);
      clearTimeout(paymentChartTimer);
    };
  }, [comparison, options]);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('comparison.title') || 'Scenario Comparison'}
        </h2>

        <div className="space-y-4">
          {/* Scenario selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('comparison.selectScenarios') || 'Select Scenarios to Compare'}
            </h3>

            {savedScenarios.map((scenario) => (
              <div key={scenario.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`scenario-${scenario.id}`}
                  checked={selectedScenarios.includes(scenario.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedScenarios([...selectedScenarios, scenario.id]);
                    } else {
                      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenario.id));
                    }
                  }}
                />
                <Label htmlFor={`scenario-${scenario.id}`}>{scenario.name}</Label>
              </div>
            ))}
          </div>

          {/* Comparison options */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('comparison.options') || 'Comparison Options'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="option-breakeven"
                  checked={options.includeBreakEvenAnalysis}
                  onCheckedChange={(checked) => {
                    setOptions({ ...options, includeBreakEvenAnalysis: !!checked });
                  }}
                />
                <Label htmlFor="option-breakeven">
                  {t('comparison.breakEvenAnalysis') || 'Break-even Analysis'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="option-amortization"
                  checked={options.includeAmortizationComparison}
                  onCheckedChange={(checked) => {
                    setOptions({ ...options, includeAmortizationComparison: !!checked });
                  }}
                />
                <Label htmlFor="option-amortization">
                  {t('comparison.amortizationComparison') || 'Amortization Comparison'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="option-monthly"
                  checked={options.includeMonthlyPaymentComparison}
                  onCheckedChange={(checked) => {
                    setOptions({ ...options, includeMonthlyPaymentComparison: !!checked });
                  }}
                />
                <Label htmlFor="option-monthly">
                  {t('comparison.monthlyPaymentComparison') || 'Monthly Payment Comparison'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="option-total"
                  checked={options.includeTotalCostComparison}
                  onCheckedChange={(checked) => {
                    setOptions({ ...options, includeTotalCostComparison: !!checked });
                  }}
                />
                <Label htmlFor="option-total">
                  {t('comparison.totalCostComparison') || 'Total Cost Comparison'}
                </Label>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={selectedScenarios.length < 2}
            className="w-full"
          >
            {t('comparison.compare') || 'Compare Scenarios'}
          </Button>

          {comparison && (
            <div className="mt-6 space-y-6">
              <h3 className="font-medium mb-2">
                {t('comparison.results') || 'Comparison Results'}
              </h3>

              {/* Comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">{t('comparison.scenario') || 'Scenario'}</th>
                      <th className="p-2 text-right">
                        {t('comparison.monthlyPayment') || 'Monthly Payment'}
                      </th>
                      <th className="p-2 text-right">
                        {t('comparison.totalInterest') || 'Total Interest'}
                      </th>
                      <th className="p-2 text-right">{t('comparison.term') || 'Term'}</th>
                      <th className="p-2 text-right">
                        {t('comparison.totalCost') || 'Total Cost'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.scenarios.map((scenario) => {
                      const totalCost =
                        scenario.loanDetails.principal +
                        scenario.results.totalInterest +
                        (scenario.results.oneTimeFees || 0) +
                        (scenario.results.recurringFees || 0);

                      return (
                        <tr key={scenario.id} className="border-b">
                          <td className="p-2">{scenario.name}</td>
                          <td className="p-2 text-right">
                            {calculationService.formatCurrency(
                              scenario.results.monthlyPayment,
                              undefined,
                              scenario.loanDetails.currency || 'USD'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {calculationService.formatCurrency(
                              scenario.results.totalInterest,
                              undefined,
                              scenario.loanDetails.currency || 'USD'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {calculationService.formatTimePeriod(scenario.results.actualTerm * 12)}
                          </td>
                          <td className="p-2 text-right">
                            {calculationService.formatCurrency(
                              totalCost,
                              undefined,
                              scenario.loanDetails.currency || 'USD'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Differences */}
              {comparison.differences.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">
                    {t('comparison.differences') || 'Differences'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('comparison.monthlyPaymentDiff') || 'Monthly Payment Difference'}:
                      </p>
                      <p className="font-medium">
                        {calculationService.formatCurrency(
                          comparison.differences[0].monthlyPaymentDiff,
                          undefined,
                          comparison.scenarios[0].loanDetails.currency || 'USD'
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        {t('comparison.totalInterestDiff') || 'Total Interest Difference'}:
                      </p>
                      <p className="font-medium">
                        {calculationService.formatCurrency(
                          comparison.differences[0].totalInterestDiff,
                          undefined,
                          comparison.scenarios[0].loanDetails.currency || 'USD'
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        {t('comparison.termDiff') || 'Term Difference'}:
                      </p>
                      <p className="font-medium">
                        {calculationService.formatTimePeriod(
                          comparison.differences[0].termDiff * 12
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        {t('comparison.totalCostDiff') || 'Total Cost Difference'}:
                      </p>
                      <p className="font-medium">
                        {calculationService.formatCurrency(
                          comparison.differences[0].totalCostDiff,
                          undefined,
                          comparison.scenarios[0].loanDetails.currency || 'USD'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Break-even point */}
              {comparison.breakEvenPoint && options.includeBreakEvenAnalysis && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium mb-2">
                    {t('comparison.breakEvenPoint') || 'Break-even Point'}
                  </h4>
                  <p>
                    {t('comparison.breakEvenDescription') || 'The scenarios break even at'}:
                    <span className="ml-2 font-medium">
                      {t('comparison.month') || 'Month'} {comparison.breakEvenPoint}(
                      {Math.floor(comparison.breakEvenPoint / 12)} {t('form.years') || 'years'},{' '}
                      {comparison.breakEvenPoint % 12} {t('comparison.months') || 'months'})
                    </span>
                  </p>
                </div>
              )}

              {/* Visualization */}
              {options.includeTotalCostComparison && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">
                    {t('comparison.cumulativeCostDiff') || 'Cumulative Cost Difference'}
                  </h4>
                  <div className="h-64 relative">
                    <canvas
                      key={`cost-chart-${comparison?.scenarios[0]?.id}-${comparison?.scenarios[1]?.id}`}
                      ref={costChartRef}
                    ></canvas>
                  </div>
                </div>
              )}

              {options.includeMonthlyPaymentComparison && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">
                    {t('comparison.monthlyPaymentDiff') || 'Monthly Payment Difference'}
                  </h4>
                  <div className="h-64 relative">
                    <canvas
                      key={`payment-chart-${comparison?.scenarios[0]?.id}-${comparison?.scenarios[1]?.id}`}
                      ref={paymentChartRef}
                    ></canvas>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
