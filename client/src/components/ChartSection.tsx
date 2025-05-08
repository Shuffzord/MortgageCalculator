import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalculationResults, LoanDetails } from "@/lib/types";
import Chart from "chart.js/auto";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'comparison'>('pie');
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const comparisonChartRef = useRef<HTMLCanvasElement | null>(null);

  const [pieChart, setPieChart] = useState<Chart | null>(null);
  const [barChart, setBarChart] = useState<Chart | null>(null);
  const [comparisonChart, setComparisonChart] = useState<Chart | null>(null);

  const chartTitles = {
    pie: "Principal vs. Interest Distribution",
    bar: "Yearly Breakdown",
    comparison: "Scenario Comparison"
  };

  useEffect(() => {
    return () => {
      if (pieChart) pieChart.destroy();
      if (barChart) barChart.destroy();
      if (comparisonChart) comparisonChart.destroy();
    };
  }, [pieChart, barChart, comparisonChart]);

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

    // Create pie chart
    const pieChartTimer = setTimeout(() => {
      if (!pieChartRef.current) return;

      const newPieChart = new Chart(pieChartRef.current, {
        type: 'pie',
        data: {
          labels: ['Principal', 'Interest'],
          datasets: [{
            data: [loanDetails.principal, calculationResults.totalInterest],
            backgroundColor: ['#3b82f6', '#ef4444'],
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
                  return context.label + ': ' + formatCurrency(value, 'en-US', loanDetails.currency || 'USD');
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

      setPieChart(newPieChart);
    }, 0);

    // Create bar chart
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
              backgroundColor: '#3b82f6',
              stack: 'Stack 0'
            },
            {
              label: 'Interest',
              data: interestData,
              backgroundColor: '#ef4444',
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

    return () => {
      clearTimeout(pieChartTimer);
      clearTimeout(barChartTimer);
    };
  }, [calculationResults, loanDetails]);

  useEffect(() => {
    if (!comparisonResults?.length || !comparisonChartRef.current) return;

    if (comparisonChart) {
      comparisonChart.destroy();
      setComparisonChart(null);
    }

    const comparisonChartTimer = setTimeout(() => {
      const labels = Array.from({ length: Math.max(...comparisonResults.map(r => r.calculationResults.yearlyData.length)) }, (_, i) => `Year ${i + 1}`);
      const datasets = comparisonResults.map((result, index) => ({
        label: result.name,
        data: result.calculationResults.yearlyData.map(year => year.totalInterest),
        borderColor: index === 0 ? '#3b82f6' : index === 1 ? '#ef4444' : '#22c55e',
        backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.1)' : index === 1 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
        fill: true
      }));

      const newComparisonChart = new Chart(comparisonChartRef.current, {
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
                text: 'Cumulative Interest'
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visualization</h2>
          <p>Please calculate loan details first to see visualizations.</p>
        </CardContent>
      </Card>
    );
  }

  const handlePrevChart = () => {
    setActiveChart(current => {
      if (current === 'pie') return comparisonResults?.length ? 'comparison' : 'bar';
      if (current === 'bar') return 'pie';
      return 'bar';
    });
  };

  const handleNextChart = () => {
    setActiveChart(current => {
      if (current === 'pie') return 'bar';
      if (current === 'bar') return comparisonResults?.length ? 'comparison' : 'pie';
      return 'pie';
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Visualization</h2>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevChart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Previous chart"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <span className="text-sm font-medium">
              {chartTitles[activeChart]}
            </span>
            
            <button 
              onClick={handleNextChart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Next chart"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'pie' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={pieChartRef}></canvas>
          </div>
          
          <div className={`aspect-[16/9] w-full min-h-[400px] bg-white p-4 rounded-lg shadow-sm transition-opacity duration-300 ${activeChart === 'bar' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <canvas ref={barChartRef}></canvas>
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
