import React, { useState } from 'react';
import { Plus, Play, Save, Download, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { PremiumGate } from '@/components/gating/PremiumGate';

interface ScenarioVariation {
  id: string;
  name: string;
  type: 'interest_rate' | 'extra_payment' | 'loan_term' | 'refinance';
  parameters: {
    interestRate?: number;
    extraPayment?: number;
    loanTerm?: number;
    refinanceRate?: number;
    refinanceYear?: number;
  };
  results?: {
    monthlyPayment: number;
    totalInterest: number;
    totalAmount: number;
    payoffDate: string;
    interestSaved?: number;
    timeSaved?: number;
  };
}

interface BaseScenario {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
}

export function ScenarioModeling() {
  const [scenarioName, setScenarioName] = useState('');
  const [baseScenario, setBaseScenario] = useState<BaseScenario>({
    loanAmount: 400000,
    interestRate: 6.5,
    loanTerm: 30,
    downPayment: 80000
  });

  const [variations, setVariations] = useState<ScenarioVariation[]>([
    {
      id: '1',
      name: 'Base Scenario',
      type: 'interest_rate',
      parameters: {},
      results: {
        monthlyPayment: 2021,
        totalInterest: 407560,
        totalAmount: 727560,
        payoffDate: '2054-12-01'
      }
    }
  ]);

  const [selectedVariationType, setSelectedVariationType] = useState<string>('');

  const addVariation = () => {
    if (!selectedVariationType) return;

    const newVariation: ScenarioVariation = {
      id: Date.now().toString(),
      name: `${getVariationTypeName(selectedVariationType)} Scenario`,
      type: selectedVariationType as ScenarioVariation['type'],
      parameters: getDefaultParameters(selectedVariationType),
    };

    setVariations([...variations, newVariation]);
    setSelectedVariationType('');
  };

  const getVariationTypeName = (type: string) => {
    switch (type) {
      case 'interest_rate': return 'Interest Rate';
      case 'extra_payment': return 'Extra Payment';
      case 'loan_term': return 'Loan Term';
      case 'refinance': return 'Refinance';
      default: return 'Custom';
    }
  };

  const getDefaultParameters = (type: string) => {
    switch (type) {
      case 'interest_rate':
        return { interestRate: baseScenario.interestRate + 0.5 };
      case 'extra_payment':
        return { extraPayment: 200 };
      case 'loan_term':
        return { loanTerm: 15 };
      case 'refinance':
        return { refinanceRate: 5.5, refinanceYear: 5 };
      default:
        return {};
    }
  };

  const updateVariation = (id: string, field: string, value: any) => {
    setVariations(variations.map(variation => 
      variation.id === id 
        ? { 
            ...variation, 
            parameters: { ...variation.parameters, [field]: value }
          }
        : variation
    ));
  };

  const calculateScenarios = () => {
    // Mock calculation - in real app this would call the calculation service
    const updatedVariations = variations.map(variation => {
      const principal = baseScenario.loanAmount - baseScenario.downPayment;
      let rate = baseScenario.interestRate;
      let term = baseScenario.loanTerm;
      let extraPayment = 0;

      // Apply variation parameters
      if (variation.parameters.interestRate) {
        rate = variation.parameters.interestRate;
      }
      if (variation.parameters.loanTerm) {
        term = variation.parameters.loanTerm;
      }
      if (variation.parameters.extraPayment) {
        extraPayment = variation.parameters.extraPayment;
      }

      const monthlyRate = rate / 100 / 12;
      const numPayments = term * 12;
      
      const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      const totalPayment = (monthlyPayment + extraPayment) * numPayments;
      const totalInterest = totalPayment - principal;
      const totalAmount = totalPayment + baseScenario.downPayment;

      // Calculate payoff date with extra payments
      let balance = principal;
      let months = 0;
      while (balance > 0 && months < numPayments) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment + extraPayment;
        balance -= principalPayment;
        months++;
      }

      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + months);

      return {
        ...variation,
        results: {
          monthlyPayment: monthlyPayment + extraPayment,
          totalInterest,
          totalAmount,
          payoffDate: payoffDate.toISOString().split('T')[0],
          interestSaved: variations[0].results ? variations[0].results.totalInterest - totalInterest : 0,
          timeSaved: numPayments - months
        }
      };
    });

    setVariations(updatedVariations);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  return (
    <PremiumGate feature="Scenario Modeling">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scenario Modeling</h1>
            <p className="text-gray-600">
              Model different mortgage scenarios and payment strategies
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => alert('Export functionality')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => alert('Save functionality')}>
              <Save className="h-4 w-4 mr-2" />
              Save Scenario
            </Button>
          </div>
        </div>

        {/* Scenario Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Base Scenario */}
          <Card>
            <CardHeader>
              <CardTitle>Base Scenario</CardTitle>
              <CardDescription>
                Set up your baseline mortgage parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Scenario Name</Label>
                <Input
                  placeholder="e.g., Primary Home Purchase"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loan Amount</Label>
                  <Input
                    type="number"
                    value={baseScenario.loanAmount}
                    onChange={(e) => setBaseScenario({
                      ...baseScenario,
                      loanAmount: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Down Payment</Label>
                  <Input
                    type="number"
                    value={baseScenario.downPayment}
                    onChange={(e) => setBaseScenario({
                      ...baseScenario,
                      downPayment: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseScenario.interestRate}
                    onChange={(e) => setBaseScenario({
                      ...baseScenario,
                      interestRate: Number(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label>Loan Term (years)</Label>
                  <Input
                    type="number"
                    value={baseScenario.loanTerm}
                    onChange={(e) => setBaseScenario({
                      ...baseScenario,
                      loanTerm: Number(e.target.value)
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Variations */}
          <Card>
            <CardHeader>
              <CardTitle>Add Scenario Variations</CardTitle>
              <CardDescription>
                Create different scenarios to compare outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Variation Type</Label>
                <Select value={selectedVariationType} onValueChange={setSelectedVariationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interest_rate">Interest Rate Change</SelectItem>
                    <SelectItem value="extra_payment">Extra Monthly Payment</SelectItem>
                    <SelectItem value="loan_term">Different Loan Term</SelectItem>
                    <SelectItem value="refinance">Refinancing Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={addVariation} 
                disabled={!selectedVariationType}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variation
              </Button>

              <Button 
                onClick={calculateScenarios}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Calculate All Scenarios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Scenario Variations</CardTitle>
            <CardDescription>
              Configure and compare different mortgage scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {variations.map((variation, index) => (
                <Card key={variation.id} className={`border-l-4 ${
                  index === 0 ? 'border-l-blue-500' : 'border-l-purple-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{variation.name}</CardTitle>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? 'Base' : getVariationTypeName(variation.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Parameters */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Parameters</h4>
                        
                        {variation.type === 'interest_rate' && (
                          <div>
                            <Label>Interest Rate (%)</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[variation.parameters.interestRate || baseScenario.interestRate]}
                                onValueChange={([value]) => updateVariation(variation.id, 'interestRate', value)}
                                min={1}
                                max={15}
                                step={0.1}
                              />
                              <div className="text-sm text-gray-600">
                                {variation.parameters.interestRate || baseScenario.interestRate}%
                              </div>
                            </div>
                          </div>
                        )}

                        {variation.type === 'extra_payment' && (
                          <div>
                            <Label>Extra Monthly Payment</Label>
                            <div className="space-y-2">
                              <Slider
                                value={[variation.parameters.extraPayment || 0]}
                                onValueChange={([value]) => updateVariation(variation.id, 'extraPayment', value)}
                                min={0}
                                max={2000}
                                step={50}
                              />
                              <div className="text-sm text-gray-600">
                                {formatCurrency(variation.parameters.extraPayment || 0)}
                              </div>
                            </div>
                          </div>
                        )}

                        {variation.type === 'loan_term' && (
                          <div>
                            <Label>Loan Term (years)</Label>
                            <Select 
                              value={variation.parameters.loanTerm?.toString() || baseScenario.loanTerm.toString()}
                              onValueChange={(value) => updateVariation(variation.id, 'loanTerm', Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 years</SelectItem>
                                <SelectItem value="20">20 years</SelectItem>
                                <SelectItem value="25">25 years</SelectItem>
                                <SelectItem value="30">30 years</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {variation.type === 'refinance' && (
                          <div className="space-y-3">
                            <div>
                              <Label>Refinance Rate (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={variation.parameters.refinanceRate || 5.5}
                                onChange={(e) => updateVariation(variation.id, 'refinanceRate', Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label>Refinance Year</Label>
                              <Input
                                type="number"
                                value={variation.parameters.refinanceYear || 5}
                                onChange={(e) => updateVariation(variation.id, 'refinanceYear', Number(e.target.value))}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Results */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Results</h4>
                        {variation.results ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Monthly Payment</span>
                              </div>
                              <p className="text-lg font-bold">
                                {formatCurrency(variation.results.monthlyPayment)}
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Total Interest</span>
                              </div>
                              <p className="text-lg font-bold">
                                {formatCurrency(variation.results.totalInterest)}
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium">Payoff Date</span>
                              </div>
                              <p className="text-lg font-bold">
                                {formatDate(variation.results.payoffDate)}
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium">Total Cost</span>
                              </div>
                              <p className="text-lg font-bold">
                                {formatCurrency(variation.results.totalAmount)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            Click "Calculate All Scenarios" to see results
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PremiumGate>
  );
}