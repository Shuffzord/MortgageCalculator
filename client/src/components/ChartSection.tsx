import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalculationResults, LoanDetails, YearlyData } from "@/lib/types";
import Chart from "chart.js/auto";
import { formatCurrency } from "@/lib/utils";

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
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const comparisonChartRef = useRef<HTMLCanvasElement | null>(null);
  const [pieChart, setPieChart] = useState<Chart | null>(null);
  const [barChart, setBarChart] = useState<Chart | null>(null);
  const [comparisonChart, setComparisonChart] = useState<Chart | null>(null);

  useEffect(() => {
    // Cleanup function to destroy charts on unmount
    return () => {
      if (pieChart) pieChart.destroy();
      if (barChart) barChart.destroy();
      if (comparisonChart) comparisonChart.destroy();
    };
  }, []);

  useEffect(() => {
    if (!calculationResults) return;
    
    // Wait for the DOM to be ready
    setTimeout(() => {
      if (!pieChartRef.current) return;
      
      // Create or update the pie chart
      if (pieChart) pieChart.destroy();
      
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
          }
        }
      }
    });
    
      setPieChart(newPieChart);
    }, 0);
    
    // Create or update the bar chart
    setTimeout(() => {
      if (!barChartRef.current) return;
      
      if (barChart) barChart.destroy();
      
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
            stacked: true
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
          }
        }
      }
    });
    
      setBarChart(newBarChart);
    }, 0);
  }, [calculationResults, loanDetails, pieChart, barChart]);

  // Create comparison chart when comparison data is available
  useEffect(() => {
    if (!comparisonResults || comparisonResults.length === 0) return;
    
    setTimeout(() => {
      if (!comparisonChartRef.current) return;
      
      if (comparisonChart) comparisonChart.destroy();
    
    // Prepare data for comparison chart
    const scenarios = [
      { name: 'Current', loanDetails, calculationResults },
      ...comparisonResults
    ].filter(s => s.calculationResults); // Filter out scenarios without results
    
    // Find the maximum number of years across all scenarios
    const maxYears = Math.max(
      ...scenarios.map(s => Math.ceil(s.calculationResults!.actualTerm))
    );
    
    // Create labels for all years
    const years = Array.from({ length: maxYears }, (_, i) => `Year ${i + 1}`);
    
    // Create datasets for each scenario
    const datasets = scenarios.map((scenario, index) => {
      // Get yearly data or create empty array
      const yearlyData = scenario.calculationResults?.yearlyData || [];
      
      // Create color based on index
      const colors = [
        '#3b82f6', // blue
        '#ef4444', // red
        '#22c55e', // green
        '#f59e0b', // amber
        '#8b5cf6'  // purple
      ];
      const color = colors[index % colors.length];
      
      // Map yearly data to total payments (principal + interest)
      const payments = years.map((_, yearIndex) => {
        const yearData = yearlyData.find(d => d.year === yearIndex + 1);
        return yearData ? yearData.principal + yearData.interest : 0;
      });
      
      return {
        label: scenario.name,
        data: payments,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2,
        fill: false,
        tension: 0.1
      };
    });
    
    // Create the comparison chart
    const newComparisonChart = new Chart(comparisonChartRef.current, {
      type: 'line',
      data: {
        labels: years,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: {
              display: true,
              text: 'Yearly Payment'
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
            text: 'Scenario Comparison - Yearly Payments'
          }
        }
      }
    });
    
      setComparisonChart(newComparisonChart);
    }, 0);
  }, [comparisonResults, calculationResults, loanDetails, comparisonChart]);

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

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visualization</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Principal vs. Interest Distribution</h3>
            <div className="h-64 relative">
              <canvas ref={pieChartRef}></canvas>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Yearly Breakdown</h3>
            <div className="h-64 relative">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </div>
        
        {/* Comparison chart - only shown when comparison data is available */}
        {comparisonResults && comparisonResults.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Scenario Comparison</h3>
            <div className="h-64 relative">
              <canvas ref={comparisonChartRef}></canvas>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
