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
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import Chart from "chart.js/auto";
import { HelpCircle } from "lucide-react";
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
    if (!result || !result.comparisonChart || !optimizationChartRef.current) return;
    
    if (optimizationChart) optimizationChart.destroy();
    
    const newChart = new Chart(optimizationChartRef.current, {
      type: 'line',
      data: {
        labels: result.comparisonChart.labels,
        datasets: [
          {
            label: 'Original Loan',
            data: result.comparisonChart.originalData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.1
          },
          {
            label: 'With Optimized Overpayments',
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
              text: 'Total Interest'
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number, 'en-US', loanDetails.currency || 'USD');
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return context.dataset.label + ': ' + formatCurrency(value, 'en-US', loanDetails.currency || 'USD');
              }
            }
          },
          title: {
            display: true,
            text: 'Interest Comparison'
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
        labels: ['Interest Saved', 'Term Reduction (Years)'],
        datasets: [
          {
            label: 'Lump Sum',
            data: [
              comparisonData.lumpSum.interestSaved,
              comparisonData.lumpSum.termReduction
            ],
            backgroundColor: '#3b82f6'
          },
          {
            label: 'Monthly Overpayments',
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
                  return formatCurrency(value as number, 'en-US', loanDetails.currency || 'USD');
                } else {
                  return value + ' years';
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
                  return context.dataset.label + ': ' + formatCurrency(value, 'en-US', loanDetails.currency || 'USD');
                } else {
                  return context.dataset.label + ': ' + value.toFixed(2) + ' years';
                }
              }
            }
          },
          title: {
            display: true,
            text: 'Lump Sum vs Regular Overpayments'
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
        labels: impactData.map(d => formatCurrency(d.amount, 'en-US', loanDetails.currency || 'USD')),
        datasets: [
          {
            label: 'Interest Saved',
            data: impactData.map(d => d.interestSaved),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Term Reduction (Years)',
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
              text: 'Interest Saved'
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value as number, 'en-US', loanDetails.currency || 'USD');
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Term Reduction (Years)'
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
                  return 'Interest Saved: ' + formatCurrency(value, 'en-US', loanDetails.currency || 'USD');
                } else {
                  return 'Term Reduction: ' + value.toFixed(2) + ' years';
                }
              }
            }
          },
          title: {
            display: true,
            text: 'Impact of Different Overpayment Amounts'
          }
        }
      }
    });
    
    setImpactChart(newChart);
  }, [impactData, loanDetails.currency]);
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Overpayment Optimization
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1 inline" /></span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Optimize your overpayment strategy to save interest and reduce your loan term.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
        
        <Tabs defaultValue="optimize" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="optimize" className="flex-1">Optimize</TabsTrigger>
            <TabsTrigger value="compare" className="flex-1">Compare Strategies</TabsTrigger>
            <TabsTrigger value="analyze" className="flex-1">Analyze Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="optimize" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  Max Monthly Overpayment
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">The maximum amount you can afford to overpay each month.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
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
                  Max One-Time Overpayment
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">The maximum lump sum amount you can afford to pay at once.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
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
                Optimization Strategy
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Choose what to prioritize in your overpayment strategy.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={params.optimizationStrategy}
                onChange={(e) => setParams({...params, optimizationStrategy: e.target.value as any})}
              >
                <option value="maximizeInterestSavings">Maximize Interest Savings</option>
                <option value="minimizeTime">Minimize Loan Term</option>
                <option value="balanced">Balanced Approach</option>
              </select>
            </div>
            
            <Button onClick={handleOptimize} className="w-full">
              Calculate Optimal Strategy
            </Button>
            
            {result && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">Optimization Results</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Interest Saved:</p>
                      <p className="font-medium">{formatCurrency(result.interestSaved, 'en-US', loanDetails.currency || 'USD')}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Term Reduction:</p>
                      <p className="font-medium">{result.timeOrPaymentSaved.toFixed(2)} years</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Recommended Strategy:</p>
                    <ul className="mt-2 space-y-2">
                      {result.optimizedOverpayments.map((op, index) => (
                        <li key={index} className="text-sm">
                          {op.isRecurring ? (
                            <span>
                              {formatCurrency(op.amount, 'en-US', loanDetails.currency || 'USD')} {op.frequency} overpayment
                              {op.startMonth > 1 ? ` starting at month ${op.startMonth}` : ''}
                              {op.endMonth ? ` until month ${op.endMonth}` : ''}
                            </span>
                          ) : (
                            <span>
                              {formatCurrency(op.amount, 'en-US', loanDetails.currency || 'USD')} one-time payment at month {op.startMonth}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button onClick={handleApply} className="mt-4 w-full">
                    Apply This Strategy
                  </Button>
                </div>
                
                {result.comparisonChart && (
                  <div className="h-64 relative">
                    <canvas ref={optimizationChartRef}></canvas>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="compare" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lump Sum Amount</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
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
                <Label>Monthly Overpayment</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
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
            
            <Button onClick={handleCompare} className="w-full">
              Compare Strategies
            </Button>
            
            {comparisonData && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">Comparison Results</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Lump Sum Strategy:</p>
                      <p className="text-sm">Interest Saved: {formatCurrency(comparisonData.lumpSum.interestSaved, 'en-US', loanDetails.currency || 'USD')}</p>
                      <p className="text-sm">Term Reduction: {comparisonData.lumpSum.termReduction.toFixed(2)} years</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Monthly Overpayment Strategy:</p>
                      <p className="text-sm">Interest Saved: {formatCurrency(comparisonData.monthly.interestSaved, 'en-US', loanDetails.currency || 'USD')}</p>
                      <p className="text-sm">Term Reduction: {comparisonData.monthly.termReduction.toFixed(2)} years</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm">
                      <span className="font-medium">Break-even Point:</span> {comparisonData.breakEvenMonth} months
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      This is when the total amount paid in monthly overpayments equals the lump sum amount.
                    </p>
                  </div>
                </div>
                
                <div className="h-64 relative">
                  <canvas ref={comparisonChartRef}></canvas>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analyze" className="space-y-4">
            <div className="space-y-2">
              <Label>Maximum Monthly Overpayment to Analyze</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
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
            
            <Button onClick={handleAnalyzeImpact} className="w-full">
              Analyze Impact
            </Button>
            
            {impactData && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">Impact Analysis</h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    This chart shows how different monthly overpayment amounts affect your interest savings and loan term.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="p-2 text-left">Monthly Overpayment</th>
                          <th className="p-2 text-right">Interest Saved</th>
                          <th className="p-2 text-right">Term Reduction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {impactData.map((data, index) => (
                          <tr key={index} className="border-b border-blue-100">
                            <td className="p-2">{formatCurrency(data.amount, 'en-US', loanDetails.currency || 'USD')}</td>
                            <td className="p-2 text-right">{formatCurrency(data.interestSaved, 'en-US', loanDetails.currency || 'USD')}</td>
                            <td className="p-2 text-right">{data.termReduction.toFixed(2)} years</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="h-64 relative">
                  <canvas ref={impactChartRef}></canvas>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}