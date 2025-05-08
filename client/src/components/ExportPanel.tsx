import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { exportToCSV, exportToJSON } from '@/lib/exportEngine';
import { LoanDetails, CalculationResults, ExportOptions, ExportFormat, ScenarioComparison, SavedCalculation } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Download, FileText, FileCode, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { saveCalculation, getSavedCalculations } from '@/lib/storageService';

interface ExportPanelProps {
  loanDetails: LoanDetails;
  results: CalculationResults;
  comparisonData?: ScenarioComparison;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedCalculations: SavedCalculation[];
  onSaveCalculation: () => void;
}

export default function ExportPanel({
  loanDetails,
  results,
  comparisonData,
  open,
  onOpenChange,
  savedCalculations,
  onSaveCalculation
}: ExportPanelProps) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeAmortizationSchedule: true,
    includeCharts: false,
    includeSummary: true,
    includeComparisonData: !!comparisonData,
    selectedColumns: ['payment', 'date', 'monthlyPayment', 'principalPayment', 'interestPayment', 'balance', 'totalInterest']
  });
  
  const [dateRange, setDateRange] = useState<[number, number]>([1, results.amortizationSchedule.length]);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let filename: string;
      let mimeType: string;
      
      // Set date range in options if amortization schedule is included
      const exportOptions = {
        ...options,
        dateRange: options.includeAmortizationSchedule ? {
          startMonth: dateRange[0],
          endMonth: dateRange[1]
        } : undefined
      };
      
      // Generate export content based on format
      switch (options.format) {
        case 'csv':
          content = exportToCSV(loanDetails, results, exportOptions, options.includeComparisonData ? comparisonData : undefined);
          filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'json':
          content = exportToJSON(loanDetails, results, exportOptions, options.includeComparisonData ? comparisonData : undefined);
          filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
          
        default:
          setIsExporting(false);
          return;
      }
      
      // Create download link
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Available columns for selection
  const availableColumns = [
    { id: 'payment', label: t('export.columns.payment', 'Payment #') },
    { id: 'date', label: t('export.columns.date', 'Date') },
    { id: 'monthlyPayment', label: t('export.columns.monthlyPayment', 'Payment Amount') },
    { id: 'principalPayment', label: t('export.columns.principalPayment', 'Principal') },
    { id: 'interestPayment', label: t('export.columns.interestPayment', 'Interest') },
    { id: 'balance', label: t('export.columns.balance', 'Balance') },
    { id: 'totalInterest', label: t('export.columns.totalInterest', 'Total Interest') },
    { id: 'overpaymentAmount', label: t('export.columns.overpaymentAmount', 'Overpayment') },
    { id: 'fees', label: t('export.columns.fees', 'Fees') }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex justify-between items-center">
            {t('export.title', 'Export & Save Data')}           
          </DialogTitle>
          <p id="dialog-description" className="text-sm text-gray-500 mt-1">
            {t('export.description', 'Choose export format and options for your mortgage calculation data')}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format selection */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('export.format', 'Export Format')}</h3>
            <div className="flex space-x-4">
              <div 
                className={`flex flex-col items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                  options.format === 'csv' 
                    ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                    : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                }`}
                onClick={() => setOptions({ ...options, format: 'csv' })}
                role="radio"
                aria-checked={options.format === 'csv'}
              >
                <FileText className={`h-6 w-6 mb-1 ${options.format === 'csv' ? 'text-primary' : 'text-gray-500'}`} />
                <span>CSV</span>
              </div>
              <div 
                className={`flex flex-col items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                  options.format === 'json' 
                    ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                    : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                }`}
                onClick={() => setOptions({ ...options, format: 'json' })}
                role="radio"
                aria-checked={options.format === 'json'}
              >
                <FileCode className={`h-6 w-6 mb-1 ${options.format === 'json' ? 'text-primary' : 'text-gray-500'}`} />
                <span>JSON</span>
              </div>
            </div>
          </div>
          
          {/* Content options */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('export.includeContent', 'Include Content')}</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox
                  id="include-summary"
                  checked={options.includeSummary}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeSummary: checked as boolean })
                  }
                  className="mr-2"
                />
                <Label htmlFor="include-summary">{t('export.includeSummary', 'Loan Summary')}</Label>
              </div>
              
              <div className="flex items-center">
                <Checkbox
                  id="include-amortization"
                  checked={options.includeAmortizationSchedule}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeAmortizationSchedule: checked as boolean })
                  }
                  className="mr-2"
                />
                <Label htmlFor="include-amortization">{t('export.includeAmortizationSchedule', 'Amortization Schedule')}</Label>
              </div>
              
              {comparisonData && (
                <div className="flex items-center">
                  <Checkbox
                    id="include-comparison"
                    checked={options.includeComparisonData}
                    onCheckedChange={(checked) => 
                      setOptions({ ...options, includeComparisonData: checked as boolean })
                    }
                    className="mr-2"
                  />
                  <Label htmlFor="include-comparison">{t('export.includeComparisonData', 'Comparison Data')}</Label>
                </div>
              )}
            </div>
          </div>
          
          {/* Amortization schedule options */}
          {options.includeAmortizationSchedule && (
            <div className="space-y-4 p-4 border border-gray-100 rounded-md bg-gray-50">
              <h3 className="text-sm font-medium">{t('export.scheduleOptions', 'Schedule Options')}</h3>
              
              {/* Date range slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t('export.dateRange', 'Date Range')}</Label>
                  <span className="text-sm text-gray-500">
                    {t('export.payments', 'Payments')} {dateRange[0]} - {dateRange[1]}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={results.amortizationSchedule.length}
                  step={1}
                  value={dateRange}
                  onValueChange={(value) => setDateRange(value as [number, number])}
                  className="my-4"
                />
              </div>
              
              {/* Column selection */}
              <div className="space-y-2">
                <Label>{t('export.selectColumns', 'Select Columns')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {availableColumns.map(column => (
                    <div key={column.id} className="flex items-center">
                      <Checkbox
                        id={`col-${column.id}`}
                        checked={options.selectedColumns?.includes(column.id)}
                        onCheckedChange={(checked) => {
                          const newColumns = checked
                            ? [...(options.selectedColumns || []), column.id]
                            : (options.selectedColumns || []).filter(id => id !== column.id);
                          
                          setOptions({ ...options, selectedColumns: newColumns });
                        }}
                        className="mr-2"
                      />
                      <Label htmlFor={`col-${column.id}`} className="text-sm">{column.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleExport} 
            className="w-full"
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting 
              ? t('export.exporting', 'Exporting...') 
              : t('export.download', 'Download')}
          </Button>
          
          <div className="border-t border-gray-200 mt-6 pt-6">
            <h3 className="text-sm font-medium mb-4">{t('export.saveToCache', 'Save to Browser Cache')}</h3>
            <Button
              onClick={onSaveCalculation}
              variant="outline"
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {t('form.saveCalculation', 'Save Calculation')}
            </Button>
            
            {savedCalculations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">{t('export.savedCalculations', 'Saved Calculations')}</h4>
                <div className="max-h-40 overflow-y-auto">
                  {savedCalculations.map((calc) => (
                    <div key={calc.id} className="text-sm py-2 border-b border-gray-100">
                      <div className="font-medium">{calc.name}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(calc.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}