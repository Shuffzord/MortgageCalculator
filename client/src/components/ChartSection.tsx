import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalculationResults, LoanDetails } from "@/lib/types";
import Chart from "chart.js/auto";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChartSectionProps {
  loanDetails: LoanDetails;
  calculationResults: CalculationResults | null;
  comparisonResults?: {
    name: string;
    loanDetails: LoanDetails;
    calculationResults: CalculationResults;
  }[];
}

export default function ChartSection({
  loanDetails,
  calculationResults,
  comparisonResults
}: ChartSectionProps) {
  const { t } = useTranslation();
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'barMonthly' | 'line' | 'area' | 'comparison'>('pie');
  const [timeFrame, setTimeFrame] = useState<'monthly' | 'yearly'>('yearly');
  
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const barMonthlyChartRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const areaChartRef = useRef<HTMLCanvasElement | null>(null);
  const comparisonChartRef = useRef<HTMLCanvasElement | null>(null);

  const [pieChart, setPieChart] = useState<Chart | null>(null);
  const [barChart, setBarChart] = useState<Chart | null>(null);
  const [barMonthlyChart, setBarMonthlyChart] = useState<Chart | null>(null);
  const [lineChart, setLineChart] = useState<Chart | null>(null);
  const [areaChart, setAreaChart] = useState<Chart | null>(null);
  const [comparisonChart, setComparisonChart] = useState<Chart | null>(null);

  const chartTitles = {
    pie: t('chart.pieTitle', "Principal vs. Interest Distribution"),
    bar: t('chart.barTitle', "Yearly Payment Breakdown"),
    barMonthly: t('chart.barMonthlyTitle', "Monthly Payment Breakdown"),
    line: t('chart.lineTitle', "Balance Over Time"),
    area: t('chart.areaTitle', "Cumulative Payments Over Time"),
    comparison: t('chart.comparisonTitle', "Scenario Comparison")
  };

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (pieChart) pieChart.destroy();
      if (barChart) barChart.destroy();
      if (barMonthlyChart) barMonthlyChart.destroy();
      if (lineChart) lineChart.destroy();
      if (areaChart) areaChart.destroy();
      if (comparisonChart) comparisonChart.destroy();
    };
  }, [pieChart, barChart, barMonthlyChart, lineChart, areaChart, comparisonChart]);

  // Create/update main charts when data changes
  useEffect(() => {
    if (!calculationResults) return;

    if (pieChart) {
      pieChart.destroy();
      setPieChart(null);
    }

    if (barChart) {
      barChart.destroy();
      setBarChart(null);
    }
    
    if (barMonthlyChart) {
      barMonthlyChart.destroy();
      setBarMonthlyChart(null);
    }
    
    if (lineChart) {
      lineChart.destroy();
      setLineChart(null);
    }
    
    if (areaChart) {
      areaChart.destroy();
      setAreaChart(null);
    }

    // Create pie chart with consistent currency formatting
    const pieChartTimer = setTimeout(() => {
      if (!pieChartRef.current) return;

      const newPieChart = new Chart(pieChartRef.current, {
        type: 'pie',
        data: {
          labels: [t('chart.principal', 'Principal'), t('chart.interest', 'Interest')],
          datasets: [{
            data: [loanDetails.principal, calculationResults.totalInterest],
            backgroundColor: ['#1A6B72', '#E8A87C'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const label = context.label || '';
                  const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                  const percentage = Math.round(value / total * 100);
                  return `${label}: ${formatCurrency(value, 'en-US', loanDetails.currency)} (${percentage}%)`;
                }
              }
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      setPieChart(newPieChart);
    }, 0);

    // Create bar chart with consistent currency formatting
    const barChartTimer = setTimeout(() => {
      if (!barChartRef.current) return;

      const yearlyData = calculationResults.yearlyData;
      const years = yearlyData.map(data => 'Year ' + data.year);
      const principalData = yearlyData.map(data => data.principal);
      const interestData = yearlyData.map(data => data.interest);

      const newBarChart = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Principal',
              data: principalData,
              backgroundColor: '#1A6B72',
              stack: 'Stack 0'
            },
            {
              label: 'Interest',
              data: interestData,
              backgroundColor: '#E8A87C',
              stack: 'Stack 0'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              }
            },
            y: {
              stacked: true,
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
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 14
                },
                padding: 20
              }
            }
          }
        }
      });

      setBarChart(newBarChart);
    }, 0);

    // Create monthly bar chart
    const barMonthlyChartTimer = setTimeout(() => {
      if (!barMonthlyChartRef.current) return;

      // Get monthly data from amortization schedule
      const monthlyData = calculationResults.amortizationSchedule;
      const months = monthlyData.map(data => `Month ${data.payment}`);
      const principalData = monthlyData.map(data => data.principalPayment);
      const interestData = monthlyData.map(data => data.interestPayment);

      const newBarMonthlyChart = new Chart(barMonthlyChartRef.current, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Principal',
              data: principalData,
              backgroundColor: '#1A6B72',
              stack: 'Stack 0'
            },
            {
              label: 'Interest',
              data: interestData,
              backgroundColor: '#E8A87C',
              stack: 'Stack 0'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              },
              ticks: {
                // Show fewer labels for readability
                callback: function(value, index) {
                  return index % 6 === 0 ? months[index] : '';
                }
              }
            },
            y: {
              stacked: true,
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
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 14
                },
                padding: 20
              }
            }
          }
        }
      });

      setBarMonthlyChart(newBarMonthlyChart);
    }, 0);
    
    // Create line chart for balance over time
    const lineChartTimer = setTimeout(() => {
      if (!lineChartRef.current) return;

      const data = timeFrame === 'yearly'
        ? calculationResults.yearlyData.map(data => ({
            x: `Year ${data.year}`,
            y: data.balance
          }))
        : calculationResults.amortizationSchedule.map(data => ({
            x: `Month ${data.payment}`,
            y: data.balance
          }));

      const labels = data.map(item => item.x);

      const newLineChart = new Chart(lineChartRef.current, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: t('chart.remainingBalance', 'Remaining Balance'),
              data: data.map(item => item.y),
              borderColor: '#1A6B72',
              backgroundColor: 'rgba(26, 107, 114, 0.1)',
              fill: true,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                // Show fewer labels for monthly view
                callback: function(value, index) {
                  if (timeFrame === 'monthly') {
                    return index % 12 === 0 ? labels[index] : '';
                  }
                  return labels[index];
                }
              }
            },
            y: {
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
                  return t('chart.balance', 'Balance') + ': ' + formatCurrency(value, 'en-US', loanDetails.currency);
                }
              }
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      setLineChart(newLineChart);
    }, 0);
    
    // Create area chart for cumulative payments
    const areaChartTimer = setTimeout(() => {
      if (!areaChartRef.current) return;

      const data = timeFrame === 'yearly'
        ? calculationResults.yearlyData
        : calculationResults.amortizationSchedule;
      
      const labels = timeFrame === 'yearly'
        ? data.map(item => `Year ${(item as any).year || Math.ceil((item as any).payment / 12)}`)
        : data.map(item => `Month ${(item as any).payment}`);
      
      // Calculate cumulative principal and interest
      let cumulativePrincipal = 0;
      let cumulativeInterest = 0;
      
      const principalData = data.map(item => {
        cumulativePrincipal += timeFrame === 'yearly'
          ? (item as any).principal
          : (item as any).principalPayment;
        return cumulativePrincipal;
      });
      
      const interestData = data.map(item => {
        cumulativeInterest += timeFrame === 'yearly'
          ? (item as any).interest
          : (item as any).interestPayment;
        return cumulativeInterest;
      });

      const newAreaChart = new Chart(areaChartRef.current, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: t('chart.principalPaid', 'Principal Paid'),
              data: principalData,
              borderColor: '#1A6B72',
              backgroundColor: 'rgba(26, 107, 114, 0.7)',
              fill: true,
              tension: 0.1
            },
            {
              label: t('chart.interestPaid', 'Interest Paid'),
              data: interestData,
              borderColor: '#E8A87C',
              backgroundColor: 'rgba(232, 168, 124, 0.7)',
              fill: true,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                // Show fewer labels for monthly view
                callback: function(value, index) {
                  if (timeFrame === 'monthly') {
                    return index % 12 === 0 ? labels[index] : '';
                  }
                  return labels[index];
                }
              }
            },
            y: {
              stacked: true,
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
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      setAreaChart(newAreaChart);
    }, 0);

    return () => {
      clearTimeout(pieChartTimer);
      clearTimeout(barChartTimer);
      clearTimeout(barMonthlyChartTimer);
      clearTimeout(lineChartTimer);
      clearTimeout(areaChartTimer);
    };
  }, [calculationResults, loanDetails, timeFrame]);

  // Create/update comparison chart when comparison data changes
  useEffect(() => {
    if (!comparisonResults?.length || !comparisonChartRef.current) return;

    if (comparisonChart) {
      comparisonChart.destroy();
      setComparisonChart(null);
    }

    const comparisonChartTimer = setTimeout(() => {
      const labels = Array.from(
        { length: Math.max(...comparisonResults.map(r => r.calculationResults.yearlyData.length)) }, 
        (_, i) => `Year ${i + 1}`
      );
      
      const datasets = comparisonResults.map((result, index) => ({
        label: result.name,
        data: result.calculationResults.yearlyData.map(year => year.totalInterest),
        borderColor: index === 0 ? '#1A6B72' : index === 1 ? '#E8A87C' : '#3498DB',
        backgroundColor: index === 0 ? 'rgba(26, 107, 114, 0.1)' : index === 1 ? 'rgba(232, 168, 124, 0.1)' : 'rgba(52, 152, 219, 0.1)',
        fill: true
      }));

      const newComparisonChart = new Chart(comparisonChartRef.current!, {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              title: {
                display: true,
                text: t('chart.cumulativeInterest', 'Cumulative Interest')
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
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 14
                },
                padding: 20
              }
            }
          }
        }
      });

      setComparisonChart(newComparisonChart);
    }, 0);

    return () => {
      clearTimeout(comparisonChartTimer);
    };
  }, [comparisonResults, loanDetails.currency]);

  if (!calculationResults) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('chart.title', 'Visualization')}</h2>
          <p>{t('chart.noData', 'Please calculate loan details first to see visualizations.')}</p>
        </CardContent>
      </Card>
    );
  }

  // Handle chart navigation
  const handlePrevChart = () => {
    setActiveChart(current => {
      switch (current) {
        case 'pie': return comparisonResults?.length ? 'comparison' : 'area';
        case 'bar': return 'pie';
        case 'barMonthly': return 'bar';
        case 'line': return 'barMonthly';
        case 'area': return 'line';
        case 'comparison': return 'area';
        default: return 'pie';
      }
    });
  };

  const handleNextChart = () => {
    setActiveChart(current => {
      switch (current) {
        case 'pie': return 'bar';
        case 'bar': return 'barMonthly';
        case 'barMonthly': return 'line';
        case 'line': return 'area';
        case 'area': return comparisonResults?.length ? 'comparison' : 'pie';
        case 'comparison': return 'pie';
        default: return 'bar';
      }
    });
  };
  
  // Toggle between monthly and yearly views
  const toggleTimeFrame = () => {
    setTimeFrame(current => current === 'yearly' ? 'monthly' : 'yearly');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{t('chart.title', 'Visualization')}</h2>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevChart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous visualization"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <span className="text-sm font-medium">
                {chartTitles[activeChart]}
              </span>
              
              <button
                onClick={handleNextChart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next visualization"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Time frame toggle for charts that support it */}
          {(activeChart === 'line' || activeChart === 'area') && (
            <div className="flex justify-end">
              <button
                onClick={toggleTimeFrame}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {timeFrame === 'yearly' 
                  ? t('chart.switchToMonthly', 'Switch to Monthly View') 
                  : t('chart.switchToYearly', 'Switch to Yearly View')}
              </button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden">
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'pie' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={pieChartRef}></canvas>
          </div>
          
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'bar' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={barChartRef}></canvas>
          </div>
          
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'barMonthly' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={barMonthlyChartRef}></canvas>
          </div>
          
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'line' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={lineChartRef}></canvas>
          </div>
          
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'area' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={areaChartRef}></canvas>
          </div>
          
          {comparisonResults && comparisonResults.length > 0 && (
            <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'comparison' ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <canvas ref={comparisonChartRef}></canvas>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
