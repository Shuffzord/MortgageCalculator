import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LoanDetails, 
  OptimizationParameters, 
  OptimizationResult,
  OverpaymentDetails
} from "@/lib/types";
import { 
  optimizeOverpayments, 
  analyzeOverpaymentImpact,
  compareLumpSumVsRegular
} from "@/lib/optimizationEngine";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import Chart from "chart.js/auto";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OverpaymentOptimizationPanelProps {
  loanDetails: LoanDetails;
  onApplyOptimization: (overpayments: OverpaymentDetails[]) => void;
}

export default function OverpaymentOptimizationPanel({
  loanDetails,
  onApplyOptimization
}: OverpaymentOptimizationPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("optimize");
  const [params, setParams] = useState<OptimizationParameters>({
    maxMonthlyOverpayment: 200,
    maxOneTimeOverpayment: 10000,
    optimizationStrategy: 'maximizeInterestSavings',
    feePercentage: 0
  });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [comparisonData, setComparisonData] = useState<{
    lumpSum: { interestSaved: number; termReduction: number };
    monthly: { interestSaved: number; termReduction: number };
    breakEvenMonth: number;
  } | null>(null);
  const [impactData, setImpactData] = useState<{ amount: number; interestSaved: number; termReduction: number }[] | null>(null);
  
  const optimizationChartRef = useRef<HTMLCanvasElement | null>(null);
  const comparisonChartRef = useRef<HTMLCanvasElement | null>(null);
  const impactChartRef = useRef<HTMLCanvasElement | null>(null);
  
  const [optimizationChart, setOptimizationChart] = useState<Chart | null>(null);
  const [comparisonChart, setComparisonChart] = useState<Chart | null>(null);
  const [impactChart, setImpactChart] = useState<Chart | null>(null);
  
  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (optimizationChart) optimizationChart.destroy();
      if (comparisonChart) comparisonChart.destroy();
      if (impactChart) impactChart.destroy();
    };
  }, []);
  
  // Handle optimization
  const handleOptimize = () => {
    const optimizationResult = optimizeOverpayments(loanDetails, params);
    setResult(optimizationResult);
  };
  
  // Handle applying the optimization
  const handleApply = () => {
    if (result) {
      onApplyOptimization(result.optimizedOverpayments);
    }
  };
  
  // Handle comparison analysis
  const handleCompare = () => {
    const comparison = compareLumpSumVsRegular(
      loanDetails,
      params.maxOneTimeOverpayment,
      params.maxMonthlyOverpayment
    );
    setComparisonData(comparison);
  };
  
  // Handle impact analysis
  const handleAnalyzeImpact = () => {
    const impact = analyzeOverpaymentImpact(
      loanDetails,
      params.maxMonthlyOverpayment,
      5
    );
    setImpactData(impact);
  };
  
  // Create or update optimization chart when result changes
  useEffect(() => {
    if (!result || !optimizationChartRef.current || !result.comparisonChart) return;
    
    if (optimizationChart) optimizationChart.destroy();
    
    const newChart = new Chart(optimizationChartRef.current, {
      type: 'line',
      data: {
        labels: result.comparisonChart.labels,
        datasets: [
          {
            label: t('overpayment.originalLoan', 'Original Loan'),
            data: result.comparisonChart.originalData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.1
          },
          {
            label: t('overpayment.withOptimizedOverpayments', 'With Optimized Overpayments'),
            data: result.comparisonChart.optimizedData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: {
              display: true,
              text: t('overpayment.totalInterest', 'Total Interest')
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number, 'en-US', loanDetails.currency);
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return context.dataset.label + ': ' + formatCurrency(value, 'en-US', loanDetails.currency);
              }
            }
          },
          title: {
            display: true,
            text: t('overpayment.interestComparison', 'Interest Comparison')
          }
        }
      }
    });
    
    setOptimizationChart(newChart);
  }, [result, loanDetails.currency]);
  
  // Create or update comparison chart when comparison data changes
  useEffect(() => {
    if (!comparisonData || !comparisonChartRef.current) return;
    
    if (comparisonChart) comparisonChart.destroy();
    
    const newChart = new Chart(comparisonChartRef.current, {
      type: 'bar',
      data: {
        labels: [t('overpayment.interestSaved', 'Interest Saved'), t('overpayment.termReductionYears', 'Term Reduction (Years)')],
        datasets: [
          {
            label: t('overpayment.lumpSum', 'Lump Sum'),
            data: [
              comparisonData.lumpSum.interestSaved,
              comparisonData.lumpSum.termReduction
            ],
            backgroundColor: '#3b82f6'
          },
          {
            label: t('overpayment.monthlyOverpayments', 'Monthly Overpayments'),
            data: [
              comparisonData.monthly.interestSaved,
              comparisonData.monthly.termReduction
            ],
            backgroundColor: '#22c55e'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: function(value, index) {
                // Format as currency for interest saved, as years for term reduction
                if (index === 0) {
                  return formatCurrency(value as number, 'en-US', loanDetails.currency);
                } else {
                  return value + ' ' + t('form.years', 'years');
                }
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                const datasetIndex = context.datasetIndex;
                const dataIndex = context.dataIndex;
                
                if (dataIndex === 0) {
                  return context.dataset.label + ': ' + formatCurrency(value, 'en-US', loanDetails.currency);
                } else {
                  return context.dataset.label + ': ' + value.toFixed(2) + ' ' + t('form.years', 'years');
                }
              }
            }
          },
          title: {
            display: true,
            text: t('overpayment.comparisonTitle', 'Lump Sum vs Regular Overpayments')
          }
        }
      }
    });
    
    setComparisonChart(newChart);
  }, [comparisonData, loanDetails.currency]);
  
  // Create or update impact chart when impact data changes
  useEffect(() => {
    if (!impactData || !impactChartRef.current) return;
    
    if (impactChart) impactChart.destroy();
    
    const newChart = new Chart(impactChartRef.current, {
      type: 'line',
      data: {
        labels: impactData.map(d => formatCurrency(d.amount, 'en-US', loanDetails.currency)),
        datasets: [
          {
            label: t('overpayment.interestSaved', 'Interest Saved'),
            data: impactData.map(d => d.interestSaved),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            yAxisID: 'y'
          },
          {
            label: t('overpayment.termReductionYears', 'Term Reduction (Years)'),
            data: impactData.map(d => d.termReduction),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: t('overpayment.interestSaved', 'Interest Saved')
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number, 'en-US', loanDetails.currency);
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: t('overpayment.termReductionYears', 'Term Reduction (Years)')
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                const datasetIndex = context.datasetIndex;
                
                if (datasetIndex === 0) {
                  return t('overpayment.interestSaved', 'Interest Saved') + ': ' + formatCurrency(value, 'en-US', loanDetails.currency);
                } else {
                  return t('overpayment.termReduction', 'Term Reduction') + ': ' + value.toFixed(2) + ' ' + t('form.years', 'years');
                }
              }
            }
          },
          title: {
            display: true,
            text: t('overpayment.impactTitle', 'Impact of Different Overpayment Amounts')
          }
        }
      }
    });
    
    setImpactChart(newChart);
  }, [impactData, loanDetails.currency]);
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("overpayment.title")}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1 inline" /></span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{t('overpayment.optimizationTip', 'Optimize your overpayment strategy to save interest and reduce your loan term.')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
        
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setActiveTab(prev => prev === "optimize" ? "analyze" : prev === "analyze" ? "compare" : "optimize")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous visualization"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-sm font-medium">
            {activeTab === "optimize" ? t('overpayment.optimizationStrategy', 'Optimization Strategy') : 
             activeTab === "compare" ? t('overpayment.strategyComparison', 'Strategy Comparison') : 
             t('overpayment.impactAnalysis', 'Impact Analysis')}
          </div>
          
          <button 
            onClick={() => setActiveTab(prev => prev === "optimize" ? "compare" : prev === "compare" ? "analyze" : "optimize")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next visualization"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Optimization View */}
          <div className={activeTab === "optimize" ? "block" : "hidden"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  {t('overpayment.maxMonthly', 'Max Monthly Overpayment')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{t('overpayment.maxMonthlyTooltip', 'The maximum amount you can afford to overpay each month.')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(loanDetails.currency || 'USD')}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={params.maxMonthlyOverpayment}
                    onChange={(e) => setParams({...params, maxMonthlyOverpayment: Number(e.target.value)})}
                    className="pl-7"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center">
                  {t('overpayment.maxOneTime', 'Max One-Time Overpayment')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{t('overpayment.maxOneTimeTooltip', 'The maximum lump sum amount you can afford to pay at once.')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(loanDetails.currency || 'USD')}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={params.maxOneTimeOverpayment}
                    onChange={(e) => setParams({...params, maxOneTimeOverpayment: Number(e.target.value)})}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center">
                {t('overpayment.optimizationStrategy', 'Optimization Strategy')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('overpayment.strategyTooltip', 'Choose what to prioritize in your overpayment strategy.')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={params.optimizationStrategy}
                onChange={(e) => setParams({...params, optimizationStrategy: e.target.value as any})}
              >
                <option value="maximizeInterestSavings">{t('overpayment.maximizeInterest', 'Maximize Interest Savings')}</option>
                <option value="minimizeTime">{t('overpayment.minimizeTerm', 'Minimize Loan Term')}</option>
                <option value="balanced">{t('overpayment.balancedApproach', 'Balanced Approach')}</option>
              </select>
            </div>
            
            <Button onClick={handleOptimize} className="w-full mb-4">
              {t('overpayment.calculateStrategy', 'Calculate Optimal Strategy')}
            </Button>
            
            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">{t('overpayment.optimizationResults', 'Optimization Results')}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{t('overpayment.interestSaved', 'Interest Saved')}:</p>
                      <p className="font-medium">{formatCurrency(result.interestSaved, 'en-US', loanDetails.currency)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">{t('overpayment.termReduction', 'Term Reduction')}:</p>
                      <p className="font-medium">{result.timeOrPaymentSaved.toFixed(2)} {t('form.years', 'years')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">{t('overpayment.recommendedStrategy', 'Recommended Strategy')}:</p>
                    <ul className="mt-2 space-y-2">
                      {result.optimizedOverpayments.map((op, index) => (
                        <li key={index} className="text-sm">
                          {op.isRecurring ? (
                            <span>
                              {formatCurrency(op.amount, 'en-US', loanDetails.currency)} {op.frequency} overpayment
                              {(op.startMonth ?? 0) > 1 ? ` starting at month ${op.startMonth}` : ''}
                              {op.endMonth ? ` until month ${op.endMonth}` : ''}
                            </span>
                          ) : (
                            <span>
                              {formatCurrency(op.amount, 'en-US', loanDetails.currency)} one-time payment at month {op.startMonth ?? 1}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button onClick={handleApply} className="mt-4 w-full">
                    {t('overpayment.applyStrategy', 'Apply This Strategy')}
                  </Button>
                </div>
                
                {result.comparisonChart && (
                  <div className="aspect-[16/9] w-full min-h-[400px] relative bg-white p-4 rounded-lg shadow-sm">
                    <canvas ref={optimizationChartRef}></canvas>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comparison View */}
          <div className={activeTab === "compare" ? "block" : "hidden"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>{t('overpayment.lumpSumAmount', 'Lump Sum Amount')}</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(loanDetails.currency || 'USD')}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={params.maxOneTimeOverpayment}
                    onChange={(e) => setParams({...params, maxOneTimeOverpayment: Number(e.target.value)})}
                    className="pl-7"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('overpayment.monthlyAmount', 'Monthly Overpayment')}</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(loanDetails.currency || 'USD')}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={params.maxMonthlyOverpayment}
                    onChange={(e) => setParams({...params, maxMonthlyOverpayment: Number(e.target.value)})}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={handleCompare} className="w-full mb-4">
              {t('overpayment.compareStrategies', 'Compare Strategies')}
            </Button>
            
            {comparisonData && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">{t('overpayment.comparisonResults', 'Comparison Results')}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">{t('overpayment.lumpSumStrategy', 'Lump Sum Strategy')}:</p>
                      <p className="text-sm">{t('overpayment.interestSaved', 'Interest Saved')}: {formatCurrency(comparisonData.lumpSum.interestSaved, 'en-US', loanDetails.currency)}</p>
                      <p className="text-sm">{t('overpayment.termReduction', 'Term Reduction')}: {comparisonData.lumpSum.termReduction.toFixed(2)} {t('form.years', 'years')}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">{t('overpayment.monthlyStrategy', 'Monthly Overpayment Strategy')}:</p>
                      <p className="text-sm">{t('overpayment.interestSaved', 'Interest Saved')}: {formatCurrency(comparisonData.monthly.interestSaved, 'en-US', loanDetails.currency)}</p>
                      <p className="text-sm">{t('overpayment.termReduction', 'Term Reduction')}: {comparisonData.monthly.termReduction.toFixed(2)} {t('form.years', 'years')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm">
                      <span className="font-medium">{t('overpayment.breakEvenPoint', 'Break-even Point')}:</span> {comparisonData.breakEvenMonth} {t('overpayment.months', 'months')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t('overpayment.breakEvenDescription', 'This is when the total amount paid in monthly overpayments equals the lump sum amount.')}
                    </p>
                  </div>
                </div>
                
                <div className="aspect-[16/9] w-full min-h-[400px] relative bg-white p-4 rounded-lg shadow-sm">
                  <canvas ref={comparisonChartRef}></canvas>
                </div>
              </div>
            )}
          </div>

          {/* Impact Analysis View */}
          <div className={activeTab === "analyze" ? "block" : "hidden"}>
            <div className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label>{t('overpayment.maxMonthlyAnalyze', 'Maximum Monthly Overpayment to Analyze')}</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(loanDetails.currency || 'USD')}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={params.maxMonthlyOverpayment}
                    onChange={(e) => setParams({...params, maxMonthlyOverpayment: Number(e.target.value)})}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={handleAnalyzeImpact} className="w-full mb-4">
              {t('overpayment.analyzeImpact', 'Analyze Impact')}
            </Button>
            
            {impactData && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">{t('overpayment.impactAnalysis', 'Impact Analysis')}</h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {t('overpayment.impactDescription', 'This chart shows how different monthly overpayment amounts affect your interest savings and loan term.')}
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="p-2 text-left">{t('overpayment.monthlyOverpayment', 'Monthly Overpayment')}</th>
                          <th className="p-2 text-right">{t('overpayment.interestSaved', 'Interest Saved')}</th>
                          <th className="p-2 text-right">{t('overpayment.termReduction', 'Term Reduction')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {impactData.map((data, index) => (
                          <tr key={index} className="border-b border-blue-100">
                            <td className="p-2">{formatCurrency(data.amount, 'en-US', loanDetails.currency)}</td>
                            <td className="p-2 text-right">{formatCurrency(data.interestSaved, 'en-US', loanDetails.currency)}</td>
                            <td className="p-2 text-right">{data.termReduction.toFixed(2)} {t('form.years', 'years')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="aspect-[16/9] w-full min-h-[400px] relative bg-white p-4 rounded-lg shadow-sm">
                  <canvas ref={impactChartRef}></canvas>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}