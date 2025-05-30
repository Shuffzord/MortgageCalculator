import React, { useState, useEffect } from 'react';
import { Download, FileText, Table, BarChart3, Calendar, Settings, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PremiumGate } from '@/components/gating/PremiumGate';
import { calculationService } from '@/lib/api/services/calculationService';
import { exportService } from '@/lib/api/services/exportService';
import type { Calculation, ExportRequest } from '@/lib/api/types';

interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeAmortization: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
  includeComparison: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export function ExportCenter() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeAmortization: true,
    includeCharts: true,
    includeSummary: true,
    includeComparison: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalculations();
    loadExportHistory();
  }, []);

  const loadCalculations = async () => {
    try {
      setIsLoading(true);
      // Mock calculations data - in real app this would come from API
      const mockCalculations: Calculation[] = [
        {
          id: '1',
          userId: 'user1',
          title: 'Primary Home Mortgage',
          loanAmount: 400000,
          interestRate: 6.5,
          loanTerm: 30,
          downPayment: 80000,
          results: {
            monthlyPayment: 2021,
            totalInterest: 407560,
            totalAmount: 727560,
            payoffDate: '2054-12-01',
            amortizationSchedule: [],
            summary: {
              principalPaid: 320000,
              interestPaid: 407560,
              totalPayments: 360
            }
          },
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user1',
          title: 'Investment Property Analysis',
          loanAmount: 300000,
          interestRate: 7.0,
          loanTerm: 25,
          downPayment: 60000,
          results: {
            monthlyPayment: 1696,
            totalInterest: 268800,
            totalAmount: 508800,
            payoffDate: '2049-12-01',
            amortizationSchedule: [],
            summary: {
              principalPaid: 240000,
              interestPaid: 268800,
              totalPayments: 300
            }
          },
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setCalculations(mockCalculations);
      if (mockCalculations.length > 0) {
        setSelectedCalculation(mockCalculations[0].id);
      }
    } catch (error) {
      console.error('Failed to load calculations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExportHistory = async () => {
    // Mock export history - in real app this would come from API
    setExportHistory([
      {
        id: '1',
        calculationTitle: 'Primary Home Mortgage',
        format: 'pdf',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        downloadUrl: '#'
      },
      {
        id: '2',
        calculationTitle: 'Investment Property Analysis',
        format: 'excel',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed',
        downloadUrl: '#'
      }
    ]);
  };

  const handleExport = async () => {
    if (!selectedCalculation) {
      alert('Please select a calculation to export');
      return;
    }

    setIsExporting(true);
    try {
      const exportRequest: ExportRequest = {
        calculationId: selectedCalculation,
        format: exportOptions.format,
        options: {
          includeAmortization: exportOptions.includeAmortization,
          includeCharts: exportOptions.includeCharts,
          includeSummary: exportOptions.includeSummary
        }
      };

      const response = await exportService.exportCalculation(exportRequest);
      
      // In a real app, this would either download the file or show a success message
      alert(`Export started! Download will be available at: ${response.downloadUrl}`);
      
      // Refresh export history
      await loadExportHistory();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'excel':
        return <Table className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'Professional report with charts and detailed analysis';
      case 'excel':
        return 'Spreadsheet with calculations and amortization schedule';
      case 'csv':
        return 'Raw data for further analysis and processing';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <PremiumGate feature="PDF & Excel Export">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Export Center</h1>
          <p className="text-gray-600">
            Generate professional reports and export your mortgage calculations
          </p>
        </div>

        <Tabs defaultValue="export" className="space-y-6">
          <TabsList>
            <TabsTrigger value="export">Create Export</TabsTrigger>
            <TabsTrigger value="history">Export History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Export Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your export settings and options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Calculation Selection */}
                  <div>
                    <Label>Select Calculation</Label>
                    <Select value={selectedCalculation} onValueChange={setSelectedCalculation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a calculation to export" />
                      </SelectTrigger>
                      <SelectContent>
                        {calculations.map((calc) => (
                          <SelectItem key={calc.id} value={calc.id}>
                            {calc.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format Selection */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">Export Format</Label>
                    <div className="space-y-3">
                      {(['pdf', 'excel', 'csv'] as const).map((format) => (
                        <div
                          key={format}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            exportOptions.format === format
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setExportOptions({ ...exportOptions, format })}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={exportOptions.format === format}
                              onChange={() => setExportOptions({ ...exportOptions, format })}
                              className="text-blue-600"
                            />
                            {getFormatIcon(format)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium capitalize">{format.toUpperCase()}</p>
                            <p className="text-sm text-gray-600">
                              {getFormatDescription(format)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">Include in Export</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="summary"
                          checked={exportOptions.includeSummary}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeSummary: !!checked })
                          }
                        />
                        <Label htmlFor="summary">Loan Summary & Key Metrics</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="amortization"
                          checked={exportOptions.includeAmortization}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeAmortization: !!checked })
                          }
                        />
                        <Label htmlFor="amortization">Full Amortization Schedule</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="charts"
                          checked={exportOptions.includeCharts}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeCharts: !!checked })
                          }
                          disabled={exportOptions.format === 'csv'}
                        />
                        <Label htmlFor="charts" className={exportOptions.format === 'csv' ? 'text-gray-400' : ''}>
                          Charts & Visualizations
                          {exportOptions.format === 'csv' && (
                            <span className="text-xs text-gray-500 ml-1">(Not available for CSV)</span>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="comparison"
                          checked={exportOptions.includeComparison}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeComparison: !!checked })
                          }
                        />
                        <Label htmlFor="comparison">Scenario Comparisons</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview & Export */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Preview</CardTitle>
                  <CardDescription>
                    Preview what will be included in your export
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCalculation ? (
                    <div className="space-y-4">
                      {/* Selected Calculation Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Selected Calculation</h4>
                        <p className="text-sm text-gray-600">
                          {calculations.find(c => c.id === selectedCalculation)?.title || 'Unknown'}
                        </p>
                      </div>

                      {/* Export Contents */}
                      <div>
                        <h4 className="font-medium mb-3">Export Contents</h4>
                        <div className="space-y-2">
                          {exportOptions.includeSummary && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Loan summary and key metrics</span>
                            </div>
                          )}
                          {exportOptions.includeAmortization && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Complete amortization schedule</span>
                            </div>
                          )}
                          {exportOptions.includeCharts && exportOptions.format !== 'csv' && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Payment breakdown charts</span>
                            </div>
                          )}
                          {exportOptions.includeComparison && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Scenario comparison data</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Export Button */}
                      <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        size="lg"
                      >
                        {isExporting ? (
                          <>
                            <Download className="h-4 w-4 mr-2 animate-pulse" />
                            Generating Export...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate {exportOptions.format.toUpperCase()} Export
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Select a calculation to preview export options
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Export History
                </CardTitle>
                <CardDescription>
                  View and download your previous exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exportHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No exports yet</h3>
                    <p className="text-gray-600">
                      Your export history will appear here once you create your first export.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exportHistory.map((export_) => (
                      <div
                        key={export_.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          {getFormatIcon(export_.format)}
                          <div>
                            <p className="font-medium">{export_.calculationTitle}</p>
                            <p className="text-sm text-gray-600">
                              {export_.format.toUpperCase()} • {formatDate(export_.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={export_.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {export_.status}
                          </Badge>
                          {export_.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Export Templates</CardTitle>
                <CardDescription>
                  Pre-configured export templates for common use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Lender Presentation',
                      description: 'Professional PDF with charts for lender meetings',
                      format: 'pdf',
                      includes: ['Summary', 'Charts', 'Amortization']
                    },
                    {
                      name: 'Financial Analysis',
                      description: 'Detailed Excel spreadsheet for financial planning',
                      format: 'excel',
                      includes: ['Summary', 'Amortization', 'Scenarios']
                    },
                    {
                      name: 'Data Export',
                      description: 'Raw data in CSV format for external analysis',
                      format: 'csv',
                      includes: ['Amortization', 'Summary']
                    }
                  ].map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {getFormatIcon(template.format)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Includes:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.includes.map((item) => (
                              <Badge key={item} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PremiumGate>
  );
}