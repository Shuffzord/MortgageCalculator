import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCSV, exportToJSON, importFromCSV, importFromJSON } from '@/lib/dataTransferEngine';
import {
  LoanDetails,
  CalculationResults,
  ExportOptions,
  ExportFormat,
  ScenarioComparison,
  SavedCalculation,
} from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/formatters';
import { Download, FileText, FileCode, Save, X, Upload, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { saveCalculation, getSavedCalculations } from '@/lib/storageService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DataTransferPanelProps {
  loanDetails: LoanDetails;
  results: CalculationResults;
  comparisonData?: ScenarioComparison;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedCalculations: SavedCalculation[];
  onSaveCalculation: () => void;
  onImportData: (loanDetails: LoanDetails, results?: Partial<CalculationResults>) => void;
}

export default function DataTransferPanel({
  loanDetails,
  results,
  comparisonData,
  open,
  onOpenChange,
  savedCalculations,
  onSaveCalculation,
  onImportData,
}: DataTransferPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeAmortizationSchedule: true,
    includeCharts: false,
    includeSummary: true,
    includeComparisonData: !!comparisonData,
    selectedColumns: [
      'payment',
      'date',
      'monthlyPayment',
      'principalPayment',
      'interestPayment',
      'balance',
      'totalInterest',
    ],
  });

  const [dateRange, setDateRange] = useState<[number, number]>([
    1,
    results.amortizationSchedule.length,
  ]);
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('json');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      // Set date range in options if amortization schedule is included
      const options = {
        ...exportOptions,
        dateRange: exportOptions.includeAmortizationSchedule
          ? {
              startMonth: dateRange[0],
              endMonth: dateRange[1],
            }
          : undefined,
      };

      // Generate export content based on format
      switch (exportOptions.format) {
        case 'csv':
          content = exportToCSV(
            loanDetails,
            results,
            options,
            options.includeComparisonData ? comparisonData : undefined
          );
          filename = `mortgage-calculation-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          content = exportToJSON(
            loanDetails,
            results,
            options,
            options.includeComparisonData ? comparisonData : undefined
          );
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const content = await file.text();
      let importedData;

      if (importFormat === 'csv') {
        importedData = importFromCSV(content);
      } else {
        importedData = importFromJSON(content);
      }

      // Call parent component handler to update state with imported data
      onImportData(importedData.loanDetails, importedData.results);

      // Close the dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportError(error.message || 'Failed to import data');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    { id: 'fees', label: t('export.columns.fees', 'Fees') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex justify-between items-center">
            {t('dataTransfer.title', 'Import & Export Data')}
          </DialogTitle>
          <p id="dialog-description" className="text-sm text-gray-500 mt-1">
            {t('dataTransfer.description', 'Import or export your mortgage calculation data')}
          </p>
        </DialogHeader>

        <Tabs
          defaultValue="export"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'export' | 'import')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="export">{t('dataTransfer.export', 'Export')}</TabsTrigger>
            <TabsTrigger value="import">{t('dataTransfer.import', 'Import')}</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            {/* Format selection */}
            <div>
              <h3 className="text-sm font-medium mb-2">{t('export.format', 'Export Format')}</h3>
              <div className="flex space-x-4">
                {/* <div 
                  className={`flex flex-col items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                    exportOptions.format === 'csv' 
                      ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                      : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                  }`}
                  onClick={() => setExportOptions({ ...exportOptions, format: 'csv' })}
                  role="radio"
                  aria-checked={exportOptions.format === 'csv'}
                >
                  <FileText className={`h-6 w-6 mb-1 ${exportOptions.format === 'csv' ? 'text-primary' : 'text-gray-500'}`} />
                  <span>CSV</span>
                </div> */}
                <div
                  className={`flex flex-col items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                    exportOptions.format === 'json'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                  }`}
                  onClick={() => setExportOptions({ ...exportOptions, format: 'json' })}
                  role="radio"
                  aria-checked={exportOptions.format === 'json'}
                >
                  <FileCode
                    className={`h-6 w-6 mb-1 ${exportOptions.format === 'json' ? 'text-primary' : 'text-gray-500'}`}
                  />
                  <span>JSON</span>
                </div>
              </div>
            </div>

            {/* Content options */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                {t('export.includeContent', 'Include Content')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox
                    id="include-summary"
                    checked={exportOptions.includeSummary}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeSummary: checked as boolean })
                    }
                    className="mr-2"
                  />
                  <Label htmlFor="include-summary">
                    {t('export.includeSummary', 'Loan Summary')}
                  </Label>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id="include-amortization"
                    checked={exportOptions.includeAmortizationSchedule}
                    onCheckedChange={(checked) =>
                      setExportOptions({
                        ...exportOptions,
                        includeAmortizationSchedule: checked as boolean,
                      })
                    }
                    className="mr-2"
                  />
                  <Label htmlFor="include-amortization">
                    {t('export.includeAmortizationSchedule', 'Amortization Schedule')}
                  </Label>
                </div>

                {comparisonData && (
                  <div className="flex items-center">
                    <Checkbox
                      id="include-comparison"
                      checked={exportOptions.includeComparisonData}
                      onCheckedChange={(checked) =>
                        setExportOptions({
                          ...exportOptions,
                          includeComparisonData: checked as boolean,
                        })
                      }
                      className="mr-2"
                    />
                    <Label htmlFor="include-comparison">
                      {t('export.includeComparisonData', 'Comparison Data')}
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Amortization schedule options */}
            {exportOptions.includeAmortizationSchedule && (
              <div className="space-y-4 p-4 border border-gray-100 rounded-md bg-gray-50">
                <h3 className="text-sm font-medium">
                  {t('export.scheduleOptions', 'Schedule Options')}
                </h3>

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
                    {availableColumns.map((column) => (
                      <div key={column.id} className="flex items-center">
                        <Checkbox
                          id={`col-${column.id}`}
                          checked={exportOptions.selectedColumns?.includes(column.id)}
                          onCheckedChange={(checked) => {
                            const newColumns = checked
                              ? [...(exportOptions.selectedColumns || []), column.id]
                              : (exportOptions.selectedColumns || []).filter(
                                  (id) => id !== column.id
                                );

                            setExportOptions({ ...exportOptions, selectedColumns: newColumns });
                          }}
                          className="mr-2"
                        />
                        <Label htmlFor={`col-${column.id}`} className="text-sm">
                          {column.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleExport} className="w-full" disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting
                ? t('export.exporting', 'Exporting...')
                : t('export.download', 'Download')}
            </Button>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            {/* Format selection */}
            <div>
              <h3 className="text-sm font-medium mb-2">{t('import.format', 'Import Format')}</h3>
              <div className="flex space-x-4">
                {/* <div 
                  className={`flex flex-col items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                    importFormat === 'csv' 
                      ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                      : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                  }`}
                  onClick={() => setImportFormat('csv')}
                  role="radio"
                  aria-checked={importFormat === 'csv'}
                >
                  <FileText className={`h-6 w-6 mb-1 ${importFormat === 'csv' ? 'text-primary' : 'text-gray-500'}`} />
                  <span>CSV</span>
                </div> */}
                <div
                  className={`flex flex-col items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
                    importFormat === 'json'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                  }`}
                  onClick={() => setImportFormat('json')}
                  role="radio"
                  aria-checked={importFormat === 'json'}
                >
                  <FileCode
                    className={`h-6 w-6 mb-1 ${importFormat === 'json' ? 'text-primary' : 'text-gray-500'}`}
                  />
                  <span>JSON</span>
                </div>
              </div>
            </div>

            {/* Import instructions */}
            <div className="p-4 border border-gray-100 rounded-md bg-gray-50">
              <h3 className="text-sm font-medium mb-2">
                {t('import.instructions', 'Import Instructions')}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {importFormat === 'json'
                  ? t(
                      'import.jsonInstructions',
                      'Select a JSON file previously exported from this application. JSON files contain more complete data and are recommended for importing.'
                    )
                  : t(
                      'import.csvInstructions',
                      'Select a CSV file previously exported from this application. CSV imports may have limited data compared to JSON imports.'
                    )}
              </p>

              {/* File input */}
              <div className="mt-4">
                <input
                  type="file"
                  accept={importFormat === 'json' ? '.json' : '.csv'}
                  onChange={handleImport}
                  className="hidden"
                  ref={fileInputRef}
                  id="file-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={isImporting}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting
                    ? t('import.importing', 'Importing...')
                    : t('import.selectFile', `Select ${importFormat.toUpperCase()} File`)}
                </Button>
              </div>
            </div>

            {/* Import error */}
            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('import.error', 'Import Error')}</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t border-gray-200 mt-6 pt-6">
          <h3 className="text-sm font-medium mb-4">{t('export.browserCache', 'Browser Cache')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={onSaveCalculation} variant="outline" className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {t('form.saveCalculation', 'Save Calculation')}
            </Button>

            {/* Load from cache button - opens the LoadModal */}
            <Button
              onClick={() => {
                // Close this dialog and open the load modal
                onOpenChange(false);
                // We need to set a timeout to ensure the current dialog is closed before opening the load modal
                setTimeout(() => {
                  // This will trigger the LoadModal to open in the parent component
                  if (typeof window !== 'undefined') {
                    const loadEvent = new CustomEvent('openLoadModal');
                    window.dispatchEvent(loadEvent);
                  }
                }, 100);
              }}
              variant="outline"
              className="w-full"
              disabled={savedCalculations.length === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t('import.loadFromCache', 'Load from Cache')}
            </Button>
          </div>

          {savedCalculations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                {t('export.savedCalculations', 'Saved Calculations')}
              </h4>
              <div className="max-h-40 overflow-y-auto">
                {savedCalculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="text-sm py-2 border-b border-gray-100 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{calc.name}</div>
                      <div className="text-gray-500 text-xs">{formatDate(new Date(calc.date))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
