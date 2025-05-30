import { v4 as uuidv4 } from 'uuid';
import { firestore } from '../config/firebase';
import { CustomError } from '../utils/errors';
import { logger } from '../utils/logger';
import { 
  ScenarioAnalysis, 
  CreateScenarioData, 
  UpdateScenarioData, 
  ScenarioResults,
  ScenarioData,
  STRESS_TEST_SCENARIOS,
  RATE_CHANGE_TEMPLATES,
  SCENARIO_VALIDATION_RULES
} from '../types/scenario';
import { CalculationResults, Calculation } from '../types/calculation';

export class ScenarioService {
  private collection = firestore.collection('scenarios');
  private calculationsCollection = firestore.collection('calculations');

  // Calculate mortgage with modified parameters
  private calculateMortgageScenario(
    principal: number,
    annualRate: number,
    termYears: number,
    scenario: ScenarioData,
    baseResults: CalculationResults
  ): CalculationResults {
    let modifiedRate = annualRate;
    let modifiedTerm = termYears;
    let modifiedPrincipal = principal;
    
    // Apply scenario modifications
    if (scenario.type === 'rate-change' && scenario.parameters.rateChange) {
      modifiedRate = annualRate + scenario.parameters.rateChange;
    } else if (scenario.type === 'stress-test' && scenario.parameters.stressLevel) {
      const stressData = STRESS_TEST_SCENARIOS[scenario.parameters.stressLevel];
      modifiedRate = annualRate + stressData.rateIncrease;
    } else if (scenario.type === 'what-if') {
      if (scenario.parameters.termChange) {
        modifiedTerm = termYears + scenario.parameters.termChange;
      }
    }
    
    // Ensure valid ranges
    modifiedRate = Math.max(0.01, Math.min(50, modifiedRate));
    modifiedTerm = Math.max(1, Math.min(50, modifiedTerm));
    
    const monthlyRate = modifiedRate / 100 / 12;
    const totalPayments = modifiedTerm * 12;
    
    // Calculate base monthly payment
    let monthlyPayment = modifiedPrincipal * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    // Apply payment modifications for what-if scenarios
    if (scenario.type === 'what-if' && scenario.parameters.paymentChange) {
      const paymentChangePercent = scenario.parameters.paymentChange / 100;
      monthlyPayment = monthlyPayment * (1 + paymentChangePercent);
    }
    
    let balance = modifiedPrincipal;
    let totalInterest = 0;
    const amortizationSchedule = [];
    
    let month = 1;
    while (balance > 0.01 && month <= totalPayments * 2) { // Safety limit
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      
      // Add extra payment for what-if scenarios
      let extraPayment = 0;
      if (scenario.type === 'what-if' && scenario.parameters.extraPayment) {
        extraPayment = scenario.parameters.extraPayment;
      }
      
      // Ensure we don't overpay
      if (principalPayment + extraPayment > balance) {
        principalPayment = balance;
        extraPayment = 0;
      } else {
        principalPayment += extraPayment;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      
      amortizationSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment - extraPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        extraPayment: extraPayment > 0 ? extraPayment : undefined,
        totalPayment: monthlyPayment + extraPayment
      });
      
      month++;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + month - 1);

    return {
      monthlyPayment,
      totalInterest,
      totalAmount: modifiedPrincipal + totalInterest,
      payoffDate: payoffDate.toISOString().split('T')[0],
      amortizationSchedule,
      summary: {
        principalPaid: modifiedPrincipal,
        interestPaid: totalInterest,
        totalPayments: month - 1
      }
    };
  }

  private calculateScenarioImpact(baseResults: CalculationResults, scenarioResults: CalculationResults) {
    const monthlyPaymentDiff = scenarioResults.monthlyPayment - baseResults.monthlyPayment;
    const totalInterestDiff = scenarioResults.totalInterest - baseResults.totalInterest;
    const totalCostDiff = scenarioResults.totalAmount - baseResults.totalAmount;
    
    // Calculate payoff date difference
    const baseDate = new Date(baseResults.payoffDate);
    const scenarioDate = new Date(scenarioResults.payoffDate);
    const diffMonths = (scenarioDate.getFullYear() - baseDate.getFullYear()) * 12 + 
                      (scenarioDate.getMonth() - baseDate.getMonth());
    
    let payoffDateDiff = '';
    if (diffMonths > 0) {
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      if (years > 0 && months > 0) {
        payoffDateDiff = `+${years} years, ${months} months`;
      } else if (years > 0) {
        payoffDateDiff = `+${years} years`;
      } else {
        payoffDateDiff = `+${months} months`;
      }
    } else if (diffMonths < 0) {
      const absDiffMonths = Math.abs(diffMonths);
      const years = Math.floor(absDiffMonths / 12);
      const months = absDiffMonths % 12;
      if (years > 0 && months > 0) {
        payoffDateDiff = `-${years} years, ${months} months`;
      } else if (years > 0) {
        payoffDateDiff = `-${years} years`;
      } else {
        payoffDateDiff = `-${months} months`;
      }
    } else {
      payoffDateDiff = 'No change';
    }
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const costIncreasePercent = (totalCostDiff / baseResults.totalAmount) * 100;
    
    if (costIncreasePercent > 20) {
      riskLevel = 'high';
    } else if (costIncreasePercent > 10) {
      riskLevel = 'medium';
    }
    
    return {
      monthlyPaymentDiff,
      totalInterestDiff,
      totalCostDiff,
      payoffDateDiff,
      riskLevel
    };
  }

  private generateAnalysis(baseResults: CalculationResults, scenarioResults: Array<{
    scenario: ScenarioData;
    results: CalculationResults;
    impact: any;
  }>) {
    // Find best and worst case scenarios
    const sortedByCost = [...scenarioResults].sort((a, b) => 
      a.impact.totalCostDiff - b.impact.totalCostDiff
    );
    
    const bestCase = sortedByCost[0];
    const worstCase = sortedByCost[sortedByCost.length - 1];
    
    // Generate recommendations
    const recommendations = [];
    
    if (bestCase.impact.totalCostDiff < 0) {
      recommendations.push(`Consider ${bestCase.scenario.name} to save $${Math.abs(bestCase.impact.totalCostDiff).toLocaleString()}`);
    }
    
    if (worstCase.impact.riskLevel === 'high') {
      recommendations.push(`Prepare for potential rate increases - worst case could cost an additional $${worstCase.impact.totalCostDiff.toLocaleString()}`);
    }
    
    const rateChangeScenarios = scenarioResults.filter(s => s.scenario.type === 'rate-change');
    if (rateChangeScenarios.length > 0) {
      const avgImpact = rateChangeScenarios.reduce((sum, s) => sum + s.impact.totalCostDiff, 0) / rateChangeScenarios.length;
      if (avgImpact > baseResults.totalAmount * 0.1) {
        recommendations.push('Consider a fixed-rate loan to protect against rate volatility');
      }
    }
    
    // Risk assessment
    const highRiskScenarios = scenarioResults.filter(s => s.impact.riskLevel === 'high').length;
    const totalScenarios = scenarioResults.length;
    
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (highRiskScenarios / totalScenarios > 0.5) {
      overallRisk = 'high';
    } else if (highRiskScenarios / totalScenarios > 0.25) {
      overallRisk = 'medium';
    }
    
    const riskFactors = [];
    if (overallRisk === 'high') {
      riskFactors.push('High sensitivity to interest rate changes');
    }
    if (worstCase.impact.monthlyPaymentDiff > baseResults.monthlyPayment * 0.2) {
      riskFactors.push('Significant payment increase in adverse scenarios');
    }
    
    return {
      bestCase: {
        scenarioId: bestCase.scenario.id,
        savings: Math.abs(bestCase.impact.totalCostDiff),
        description: bestCase.scenario.name
      },
      worstCase: {
        scenarioId: worstCase.scenario.id,
        additionalCost: worstCase.impact.totalCostDiff,
        description: worstCase.scenario.name
      },
      recommendations,
      riskAssessment: {
        overall: overallRisk,
        factors: riskFactors
      }
    };
  }

  private validateScenarioData(data: CreateScenarioData): void {
    const rules = SCENARIO_VALIDATION_RULES;
    
    if (!data.title || data.title.length < rules.title.minLength || data.title.length > rules.title.maxLength) {
      throw new CustomError(`Title must be between ${rules.title.minLength} and ${rules.title.maxLength} characters`, 400);
    }
    
    if (!data.scenarios || data.scenarios.length < rules.scenarios.min || data.scenarios.length > rules.scenarios.max) {
      throw new CustomError(`Must have between ${rules.scenarios.min} and ${rules.scenarios.max} scenarios`, 400);
    }
    
    data.scenarios.forEach((scenario, index) => {
      if (!scenario.name || scenario.name.trim().length === 0) {
        throw new CustomError(`Scenario ${index + 1} must have a name`, 400);
      }
      
      if (!['rate-change', 'stress-test', 'what-if'].includes(scenario.type)) {
        throw new CustomError(`Scenario ${index + 1} has invalid type`, 400);
      }
      
      if (scenario.type === 'rate-change' && scenario.parameters.rateChange !== undefined) {
        if (scenario.parameters.rateChange < rules.rateChange.min || scenario.parameters.rateChange > rules.rateChange.max) {
          throw new CustomError(`Rate change must be between ${rules.rateChange.min}% and ${rules.rateChange.max}%`, 400);
        }
      }
      
      if (scenario.type === 'stress-test' && scenario.parameters.stressLevel) {
        if (!['mild', 'moderate', 'severe'].includes(scenario.parameters.stressLevel)) {
          throw new CustomError(`Invalid stress level for scenario ${index + 1}`, 400);
        }
      }
      
      if (scenario.type === 'what-if') {
        if (scenario.parameters.paymentChange !== undefined) {
          if (scenario.parameters.paymentChange < rules.paymentChange.min || scenario.parameters.paymentChange > rules.paymentChange.max) {
            throw new CustomError(`Payment change must be between ${rules.paymentChange.min}% and ${rules.paymentChange.max}%`, 400);
          }
        }
        
        if (scenario.parameters.extraPayment !== undefined) {
          if (scenario.parameters.extraPayment < rules.extraPayment.min || scenario.parameters.extraPayment > rules.extraPayment.max) {
            throw new CustomError(`Extra payment must be between $${rules.extraPayment.min} and $${rules.extraPayment.max}`, 400);
          }
        }
        
        if (scenario.parameters.termChange !== undefined) {
          if (scenario.parameters.termChange < rules.termChange.min || scenario.parameters.termChange > rules.termChange.max) {
            throw new CustomError(`Term change must be between ${rules.termChange.min} and ${rules.termChange.max} years`, 400);
          }
        }
      }
    });
  }

  async calculateScenarios(data: CreateScenarioData, userId: string): Promise<ScenarioResults> {
    try {
      this.validateScenarioData(data);
      
      // Get base calculation
      const baseCalcDoc = await this.calculationsCollection.doc(data.baseCalculationId).get();
      if (!baseCalcDoc.exists) {
        throw new CustomError('Base calculation not found', 404);
      }
      
      const baseCalc = baseCalcDoc.data() as Calculation;
      if (baseCalc.userId !== userId) {
        throw new CustomError('Access denied to base calculation', 403);
      }
      
      const principal = baseCalc.loanAmount - (baseCalc.downPayment || 0);
      const baseResults = baseCalc.results;
      
      // Calculate each scenario
      const scenarioResults = data.scenarios.map(scenario => {
        const scenarioCalcResults = this.calculateMortgageScenario(
          principal,
          baseCalc.interestRate,
          baseCalc.loanTerm,
          scenario,
          baseResults
        );
        
        const impact = this.calculateScenarioImpact(baseResults, scenarioCalcResults);
        
        return {
          scenario,
          results: scenarioCalcResults,
          impact
        };
      });
      
      const analysis = this.generateAnalysis(baseResults, scenarioResults);
      
      return {
        baseline: baseResults,
        scenarios: scenarioResults,
        analysis
      };
    } catch (error) {
      logger.error('Error calculating scenarios:', error);
      throw error;
    }
  }

  async createScenarioAnalysis(data: CreateScenarioData, userId: string): Promise<ScenarioAnalysis> {
    try {
      // Add IDs to scenarios if not present
      const scenariosWithIds = data.scenarios.map(scenario => ({
        ...scenario,
        id: scenario.id || uuidv4()
      }));
      
      const dataWithIds = { ...data, scenarios: scenariosWithIds };
      const results = await this.calculateScenarios(dataWithIds, userId);
      
      const analysis: ScenarioAnalysis = {
        id: uuidv4(),
        userId,
        title: data.title,
        baseCalculationId: data.baseCalculationId,
        scenarios: scenariosWithIds,
        results,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.collection.doc(analysis.id).set({
        ...analysis,
        createdAt: analysis.createdAt.toISOString(),
        updatedAt: analysis.updatedAt.toISOString()
      });
      
      logger.info(`Scenario analysis created: ${analysis.id} for user: ${userId}`);
      return analysis;
    } catch (error) {
      logger.error('Error creating scenario analysis:', error);
      throw error;
    }
  }

  async getScenarioAnalysis(id: string, userId: string): Promise<ScenarioAnalysis> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        throw new CustomError('Scenario analysis not found', 404);
      }
      
      const data = doc.data();
      if (data?.userId !== userId) {
        throw new CustomError('Access denied', 403);
      }
      
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      } as ScenarioAnalysis;
    } catch (error) {
      logger.error('Error getting scenario analysis:', error);
      throw error;
    }
  }

  async updateScenarioAnalysis(id: string, data: UpdateScenarioData, userId: string): Promise<ScenarioAnalysis> {
    try {
      const existing = await this.getScenarioAnalysis(id, userId);
      
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };
      
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      
      if (data.scenarios !== undefined) {
        const scenariosWithIds = data.scenarios.map(scenario => ({
          ...scenario,
          id: scenario.id || uuidv4()
        }));
        
        const scenarioData = { 
          title: data.title || existing.title, 
          baseCalculationId: existing.baseCalculationId,
          scenarios: scenariosWithIds 
        };
        const results = await this.calculateScenarios(scenarioData, userId);
        
        updateData.scenarios = scenariosWithIds;
        updateData.results = results;
      }
      
      await this.collection.doc(id).update(updateData);
      
      return await this.getScenarioAnalysis(id, userId);
    } catch (error) {
      logger.error('Error updating scenario analysis:', error);
      throw error;
    }
  }

  async deleteScenarioAnalysis(id: string, userId: string): Promise<void> {
    try {
      await this.getScenarioAnalysis(id, userId);
      await this.collection.doc(id).delete();
      
      logger.info(`Scenario analysis deleted: ${id} for user: ${userId}`);
    } catch (error) {
      logger.error('Error deleting scenario analysis:', error);
      throw error;
    }
  }

  async getUserScenarios(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ scenarios: ScenarioAnalysis[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countSnapshot = await this.collection
        .where('userId', '==', userId)
        .get();
      const total = countSnapshot.size;
      
      // Get paginated results
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();
      
      const scenarios = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: new Date(doc.data().createdAt),
        updatedAt: new Date(doc.data().updatedAt)
      })) as ScenarioAnalysis[];
      
      return {
        scenarios,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      logger.error('Error getting user scenarios:', error);
      throw error;
    }
  }

  // Helper methods for generating predefined scenarios
  generateRateChangeScenarios(): ScenarioData[] {
    return RATE_CHANGE_TEMPLATES.map((template, index) => ({
      id: uuidv4(),
      name: template.description,
      type: 'rate-change' as const,
      parameters: {
        rateChange: template.change
      }
    }));
  }

  generateStressTestScenarios(): ScenarioData[] {
    return Object.entries(STRESS_TEST_SCENARIOS).map(([level, data]) => ({
      id: uuidv4(),
      name: data.description,
      type: 'stress-test' as const,
      parameters: {
        stressLevel: level as 'mild' | 'moderate' | 'severe'
      }
    }));
  }
}

export const scenarioService = new ScenarioService();