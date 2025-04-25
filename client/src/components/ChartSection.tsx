import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalculationResults, LoanDetails, YearlyData } from "@/lib/types";
import Chart from "chart.js/auto";

interface ChartSectionProps {
  loanDetails: LoanDetails;
  calculationResults: CalculationResults | null;
}

export default function ChartSection({ 
  loanDetails, 
  calculationResults 
}: ChartSectionProps) {
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const [pieChart, setPieChart] = useState<Chart | null>(null);
  const [barChart, setBarChart] = useState<Chart | null>(null);

  useEffect(() => {
    // Cleanup function to destroy charts on unmount
    return () => {
      if (pieChart) pieChart.destroy();
      if (barChart) barChart.destroy();
    };
  }, []);

  useEffect(() => {
    if (!calculationResults || !pieChartRef.current || !barChartRef.current) return;

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
                return context.label + ': ' + new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value);
              }
            }
          }
        }
      }
    });
    
    setPieChart(newPieChart);

    // Create or update the bar chart
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
                return '$' + (value as number).toLocaleString();
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return context.dataset.label + ': ' + new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value);
              }
            }
          }
        }
      }
    });
    
    setBarChart(newBarChart);
  }, [calculationResults, loanDetails]);

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
      </CardContent>
    </Card>
  );
}
