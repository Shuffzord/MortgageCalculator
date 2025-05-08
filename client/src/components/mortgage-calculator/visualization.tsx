import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { PaymentData } from "@/lib/types";
import { Chart, registerables } from 'chart.js';
import { cn } from "@/lib/utils";

// Register Chart.js components
Chart.register(...registerables);

interface VisualizationProps {
  schedule: PaymentData[];
  totalPrincipal: number;
  totalInterest: number;
  currency?: string;
}

export default function Visualization({ schedule, totalPrincipal, totalInterest, currency = "USD" }: VisualizationProps) {
  const [activeTab, setActiveTab] = useState<'pie' | 'bar'>('pie');
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartInstanceRef = useRef<Chart | null>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInstanceRef = useRef<Chart | null>(null);
  
  const currencySymbol = getCurrencySymbol(currency);

  // Group by year for the bar chart
  const getYearlyData = () => {
    const yearlyData: { [key: number]: { principal: number; interest: number } } = {};
    
    schedule.forEach(payment => {
      const year = Math.ceil(payment.payment / 12);
      if (!yearlyData[year]) {
        yearlyData[year] = { principal: 0, interest: 0 };
      }
      yearlyData[year].principal += payment.principalPayment;
      yearlyData[year].interest += payment.interestPayment;
    });
    
    return yearlyData;
  };

  // Create pie chart
  const createPieChart = () => {
    if (!pieChartRef.current) return;
    
    const ctx = pieChartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous instance if it exists
    if (pieChartInstanceRef.current) {
      pieChartInstanceRef.current.destroy();
    }
    
    pieChartInstanceRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Principal', 'Interest'],
        datasets: [{
          label: 'Total Amount',
          data: [totalPrincipal, totalInterest],
          backgroundColor: [
            '#1A6B72', // Primary blue-green
            '#E8A87C'  // Secondary warm accent
          ],
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = Math.round(value / total * 100);
                return `${label}: ${formatCurrency(value, 'en-US', currency)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };

  // Create bar chart
  const createBarChart = () => {
    if (!barChartRef.current) return;
    
    const ctx = barChartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous instance if it exists
    if (barChartInstanceRef.current) {
      barChartInstanceRef.current.destroy();
    }
    
    const yearlyData = getYearlyData();
    const years = Object.keys(yearlyData).map(Number);
    const principalData = years.map(year => yearlyData[year].principal);
    const interestData = years.map(year => yearlyData[year].interest);
    
    barChartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Principal',
            data: principalData,
            backgroundColor: '#1A6B72' // Primary blue-green
          },
          {
            label: 'Interest',
            data: interestData,
            backgroundColor: '#E8A87C' // Secondary warm accent
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${formatCurrency(context.raw as number, 'en-US', currency)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Year'
            },
            stacked: true
          },
          y: {
            title: {
              display: true,
              text: 'Amount'
            },
            stacked: true,
            ticks: {
              callback: function(value) {
                if ((value as number) >= 1000) {
                  return formatCurrency((value as number) / 1000, 'en-US', currency) + 'k';
                }
                return formatCurrency(value as number, 'en-US', currency);
              }
            }
          }
        }
      }
    });
  };

  // Initialize and update charts when data changes
  useEffect(() => {
    createPieChart();
    createBarChart();
    
    return () => {
      if (pieChartInstanceRef.current) {
        pieChartInstanceRef.current.destroy();
      }
      if (barChartInstanceRef.current) {
        barChartInstanceRef.current.destroy();
      }
    };
  }, [schedule, totalPrincipal, totalInterest, currency]);

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <div className="px-6 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium" style={{ color: "#111111" }}>Visualizations</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('pie')}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200"
              style={{ 
                color: activeTab === 'pie' ? '#1A6B72' : '#6B7280',
                backgroundColor: activeTab === 'pie' ? 'rgba(26, 107, 114, 0.1)' : 'transparent'
              }}
            >
              Total Breakdown
            </button>
            <button 
              onClick={() => setActiveTab('bar')}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200"
              style={{ 
                color: activeTab === 'bar' ? '#1A6B72' : '#6B7280',
                backgroundColor: activeTab === 'bar' ? 'rgba(26, 107, 114, 0.1)' : 'transparent'
              }}
            >
              Yearly Breakdown
            </button>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className={cn("aspect-[4/3] w-full min-h-[400px]", activeTab !== 'pie' && "hidden")}>
          <canvas ref={pieChartRef}></canvas>
        </div>
        <div className={cn("aspect-[4/3] w-full min-h-[400px]", activeTab !== 'bar' && "hidden")}>
          <canvas ref={barChartRef}></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
