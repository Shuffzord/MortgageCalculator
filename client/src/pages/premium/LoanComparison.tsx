import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BarChart3, Download, Save, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumGate } from '@/components/gating/PremiumGate';
import { useAuth } from '@/lib/auth/context';
import { comparisonService } from '@/lib/api/services/comparisonService';
import type { Calculation, Comparison } from '@/lib/api/types';

interface LoanOption {
  id: string;
  name: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  monthlyPayment?: number;
  totalInterest?: number;
  totalAmount?: number;
}

export function LoanComparison() {
  const { isPremium } = useAuth();
  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([
    {
      id: '1',
      name: 'Option 1',
      loanAmount: 300000,
      interestRate: 6.5,
      loanTerm: 30,
      downPayment: 60000
    }
  ]);
  const [comparisonName, setComparisonName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (loanOptions.length > 0) {
      calculateAllOptions();
    }
  }, [loanOptions]);

  const calculateAllOptions = async () => {
    setIsCalculating(true);
    try {
      const updatedOptions = loanOptions.map(option => {
        const principal = option.loanAmount - option.downPayment;
        const monthlyRate = option.interestRate / 100 / 12;
        const numPayments = option.loanTerm * 12;
        
        const monthlyPayment = principal * 
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
          (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        const totalAmount = monthlyPayment * numPayments;
        const totalInterest = totalAmount - principal;

        return {
          ...option,
          monthlyPayment,
          totalInterest,
          totalAmount: totalAmount + option.downPayment
        };
      });
      
      setLoanOptions(updatedOptions);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const addLoanOption = () => {
    const newOption: LoanOption = {
      id: Date.now().toString(),
      name: `Option ${loanOptions.length + 1}`,
      loanAmount: 300000,
      interestRate: 6.5,
      loanTerm: 30,
      downPayment: 60000
    };
    setLoanOptions([...loanOptions, newOption]);
  };

  const removeLoanOption = (id: string) => {
    setLoanOptions(loanOptions.filter(option => option.id !== id));
  };

  const updateLoanOption = (id: string, field: keyof LoanOption, value: string | number) => {
    setLoanOptions(loanOptions.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    ));
  };

  const saveComparison = async () => {
    if (!comparisonName.trim()) {
      alert('Please enter a comparison name');
      return;
    }

    setIsSaving(true);
    try {
      // In a real app, this would save to the backend
      console.log('Saving comparison:', { name: comparisonName, options: loanOptions });
      alert('Comparison saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save comparison');
    } finally {
      setIsSaving(false);
    }
  };

  const exportComparison = () => {
    // In a real app, this would generate and download a report
    console.log('Exporting comparison:', loanOptions);
    alert('Export functionality would be implemented here');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBestOption = (field: 'monthlyPayment' | 'totalInterest' | 'totalAmount') => {
    if (loanOptions.length === 0) return null;
    
    const validOptions = loanOptions.filter(option => option[field] !== undefined);
    if (validOptions.length === 0) return null;
    
    return validOptions.reduce((best, current) => 
      (current[field] as number) < (best[field] as number) ? current : best
    );
  };

  return (
    <PremiumGate feature="Advanced Loan Comparison">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loan Comparison</h1>
            <p className="text-gray-600">
              Compare multiple loan options side-by-side to find the best deal
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={saveComparison} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Comparison Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparison Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label htmlFor="comparison-name">Comparison Name</Label>
              <Input
                id="comparison-name"
                placeholder="e.g., First Home Purchase Options"
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loan Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Loan Options</CardTitle>
                <CardDescription>
                  Add and configure different loan scenarios to compare
                </CardDescription>
              </div>
              <Button onClick={addLoanOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanOptions.map((option, index) => (
                <Card key={option.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Input
                        value={option.name}
                        onChange={(e) => updateLoanOption(option.id, 'name', e.target.value)}
                        className="font-medium text-lg border-none p-0 h-auto"
                      />
                      {loanOptions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLoanOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Loan Amount</Label>
                        <Input
                          type="number"
                          value={option.loanAmount}
                          onChange={(e) => updateLoanOption(option.id, 'loanAmount', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Interest Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={option.interestRate}
                          onChange={(e) => updateLoanOption(option.id, 'interestRate', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Loan Term (years)</Label>
                        <Input
                          type="number"
                          value={option.loanTerm}
                          onChange={(e) => updateLoanOption(option.id, 'loanTerm', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Down Payment</Label>
                        <Input
                          type="number"
                          value={option.downPayment}
                          onChange={(e) => updateLoanOption(option.id, 'downPayment', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Comparison Table</TabsTrigger>
            <TabsTrigger value="chart">Visual Chart</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
                <CardDescription>
                  Compare all loan options side-by-side
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan Option</TableHead>
                        <TableHead>Monthly Payment</TableHead>
                        <TableHead>Total Interest</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Term</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loanOptions.map((option) => {
                        const bestMonthly = getBestOption('monthlyPayment');
                        const bestInterest = getBestOption('totalInterest');
                        const bestTotal = getBestOption('totalAmount');
                        
                        return (
                          <TableRow key={option.id}>
                            <TableCell className="font-medium">{option.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {option.monthlyPayment ? formatCurrency(option.monthlyPayment) : '-'}
                                {bestMonthly?.id === option.id && (
                                  <Badge className="bg-green-100 text-green-800">Best</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {option.totalInterest ? formatCurrency(option.totalInterest) : '-'}
                                {bestInterest?.id === option.id && (
                                  <Badge className="bg-green-100 text-green-800">Lowest</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {option.totalAmount ? formatCurrency(option.totalAmount) : '-'}
                                {bestTotal?.id === option.id && (
                                  <Badge className="bg-green-100 text-green-800">Lowest</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{option.interestRate}%</TableCell>
                            <TableCell>{option.loanTerm} years</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Visual Comparison
                </CardTitle>
                <CardDescription>
                  Chart visualization of loan options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Visualization</h3>
                  <p className="text-gray-600">
                    Interactive charts would be implemented here using a charting library like Chart.js or Recharts
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Best Monthly Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  {getBestOption('monthlyPayment') ? (
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(getBestOption('monthlyPayment')!.monthlyPayment!)}
                      </p>
                      <p className="text-gray-600">{getBestOption('monthlyPayment')!.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lowest Total Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  {getBestOption('totalInterest') ? (
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(getBestOption('totalInterest')!.totalInterest!)}
                      </p>
                      <p className="text-gray-600">{getBestOption('totalInterest')!.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lowest Total Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  {getBestOption('totalAmount') ? (
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(getBestOption('totalAmount')!.totalAmount!)}
                      </p>
                      <p className="text-gray-600">{getBestOption('totalAmount')!.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PremiumGate>
  );
}