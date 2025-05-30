import { v4 as uuidv4 } from 'uuid';
import { firestore } from '../config/firebase';
import { CustomError } from '../utils/errors';
import { logger } from '../utils/logger';
import puppeteer from 'puppeteer';
import { 
  ExportRequest, 
  CreateExportData, 
  ExportType,
  ExportDataType,
  PDFExportData,
  ExcelExportData,
  CSVExportData,
  EXPORT_VALIDATION_RULES,
} from '../types/export';
import { Calculation } from '../types/calculation';
import { LoanComparison } from '../types/comparison';
import { ScenarioAnalysis } from '../types/scenario';

export class ExportService {
  private collection = firestore.collection('exports');
  private calculationsCollection = firestore.collection('calculations');
  private comparisonsCollection = firestore.collection('comparisons');
  private scenariosCollection = firestore.collection('scenarios');

  private validateExportData(data: CreateExportData): void {
    if (!EXPORT_VALIDATION_RULES.type.includes(data.type)) {
      throw new CustomError('Invalid export type', 400);
    }
    
    if (!EXPORT_VALIDATION_RULES.dataType.includes(data.dataType)) {
      throw new CustomError('Invalid data type', 400);
    }
    
    if (!data.dataId || data.dataId.trim().length === 0) {
      throw new CustomError('Data ID is required', 400);
    }
  }

  private async getExportData(dataType: ExportDataType, dataId: string, userId: string): Promise<any> {
    let collection;
    switch (dataType) {
      case 'calculation':
        collection = this.calculationsCollection;
        break;
      case 'comparison':
        collection = this.comparisonsCollection;
        break;
      case 'scenario':
        collection = this.scenariosCollection;
        break;
      default:
        throw new CustomError('Invalid data type', 400);
    }
    
    const doc = await collection.doc(dataId).get();
    if (!doc.exists) {
      throw new CustomError(`${dataType} not found`, 404);
    }
    
    const data = doc.data();
    if (data?.userId !== userId) {
      throw new CustomError('Access denied', 403);
    }
    
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  private generatePDFHTML(data: PDFExportData): string {
    const { title, subtitle, data: exportData, charts, tables, analysis } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          color: #64748b;
          margin: 10px 0 0 0;
          font-size: 18px;
          font-weight: normal;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h3 {
          color: #2563eb;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }
        .summary-card h4 {
          margin: 0 0 10px 0;
          color: #475569;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #475569;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        .chart-placeholder {
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #64748b;
          margin: 20px 0;
        }
        .analysis {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 20px 0;
        }
        .recommendations {
          background: #dcfce7;
          border-left: 4px solid #22c55e;
          padding: 20px;
          margin: 20px 0;
        }
        .risks {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 20px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<h2>${subtitle}</h2>` : ''}
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${this.generatePDFSections(exportData, charts, tables, analysis)}
      
      <div class="footer">
        <p>This report was generated by Mortgage Calculator Pro</p>
        <p>© ${new Date().getFullYear()} - All rights reserved</p>
      </div>
    </body>
    </html>
    `;
  }

  private generatePDFSections(data: any, charts?: any[], tables?: any[], analysis?: any): string {
    let sections = '';
    
    // Summary section
    if (data.results || data.monthlyPayment) {
      const results = data.results || data;
      sections += `
        <div class="section">
          <h3>Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>Monthly Payment</h4>
              <div class="value">$${results.monthlyPayment?.toLocaleString() || 'N/A'}</div>
            </div>
            <div class="summary-card">
              <h4>Total Interest</h4>
              <div class="value">$${results.totalInterest?.toLocaleString() || 'N/A'}</div>
            </div>
            <div class="summary-card">
              <h4>Total Amount</h4>
              <div class="value">$${results.totalAmount?.toLocaleString() || 'N/A'}</div>
            </div>
            <div class="summary-card">
              <h4>Payoff Date</h4>
              <div class="value">${results.payoffDate || 'N/A'}</div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Charts section
    if (charts && charts.length > 0) {
      sections += `
        <div class="section">
          <h3>Charts & Visualizations</h3>
          ${charts.map(chart => `
            <div class="chart-placeholder">
              <h4>${chart.title}</h4>
              <p>Chart: ${chart.type.toUpperCase()}</p>
              <p>Data visualization would appear here in the final PDF</p>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Tables section
    if (tables && tables.length > 0) {
      sections += `
        <div class="section">
          <h3>Detailed Data</h3>
          ${tables.map(table => `
            <h4>${table.title}</h4>
            <table>
              <thead>
                <tr>
                  ${table.headers.map((header: string) => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${table.rows.slice(0, 50).map((row: any[]) => `
                  <tr>
                    ${row.map((cell: any) => `<td>${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${table.rows.length > 50 ? '<p><em>Showing first 50 rows. Full data available in Excel export.</em></p>' : ''}
          `).join('')}
        </div>
      `;
    }
    
    // Analysis section
    if (analysis) {
      sections += `
        <div class="section">
          <h3>Analysis & Insights</h3>
          ${analysis.summary ? `
            <div class="analysis">
              <h4>Summary</h4>
              <p>${analysis.summary}</p>
            </div>
          ` : ''}
          
          ${analysis.recommendations && analysis.recommendations.length > 0 ? `
            <div class="recommendations">
              <h4>Recommendations</h4>
              <ul>
                ${analysis.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${analysis.risks && analysis.risks.length > 0 ? `
            <div class="risks">
              <h4>Risk Factors</h4>
              <ul>
                ${analysis.risks.map((risk: string) => `<li>${risk}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    return sections;
  }

  private async generatePDF(data: PDFExportData): Promise<Buffer> {
    const html = this.generatePDFHTML(data);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateExcel(data: ExcelExportData): Buffer {
    // For now, generate a CSV-like format for Excel compatibility
    // In a production environment, you would use a proper Excel library
    let content = '';
    
    data.sheets.forEach((sheet, index) => {
      if (index > 0) content += '\n\n';
      content += `Sheet: ${sheet.name}\n`;
      
      if (sheet.headers) {
        content += sheet.headers.join(',') + '\n';
      }
      
      sheet.data.forEach(row => {
        content += row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',') + '\n';
      });
    });
    
    return Buffer.from(content, 'utf-8');
  }

  private generateCSV(data: CSVExportData): string {
    let csv = '';
    
    // Add metadata if present
    if (data.metadata) {
      csv += `# ${data.metadata.title}\n`;
      csv += `# ${data.metadata.description}\n`;
      csv += `# Generated: ${data.metadata.generatedAt}\n`;
      csv += '\n';
    }
    
    // Add headers
    csv += data.headers.join(',') + '\n';
    
    // Add data rows
    data.rows.forEach(row => {
      csv += row.map(cell => {
        // Escape commas and quotes in CSV
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    });
    
    return csv;
  }

  private prepareCalculationExport(calculation: Calculation, type: ExportType): PDFExportData | ExcelExportData | CSVExportData {
    const { results, title, loanAmount, interestRate, loanTerm } = calculation;
    
    if (type === 'pdf') {
      return {
        title: `Mortgage Calculation Report: ${title}`,
        subtitle: `Loan Amount: $${loanAmount.toLocaleString()} | Rate: ${interestRate}% | Term: ${loanTerm} years`,
        data: calculation,
        charts: [
          {
            type: 'line',
            title: 'Principal vs Interest Over Time',
            data: results.amortizationSchedule.slice(0, 60) // First 5 years
          },
          {
            type: 'pie',
            title: 'Total Cost Breakdown',
            data: {
              principal: loanAmount,
              interest: results.totalInterest
            }
          }
        ],
        tables: [
          {
            title: 'Amortization Schedule',
            headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
            rows: results.amortizationSchedule.map(entry => [
              entry.month,
              `$${entry.payment.toFixed(2)}`,
              `$${entry.principal.toFixed(2)}`,
              `$${entry.interest.toFixed(2)}`,
              `$${entry.balance.toFixed(2)}`
            ])
          }
        ],
        analysis: {
          summary: `This ${loanTerm}-year mortgage for $${loanAmount.toLocaleString()} at ${interestRate}% will cost $${results.totalAmount.toLocaleString()} total, with $${results.totalInterest.toLocaleString()} in interest.`,
          recommendations: [
            'Consider making extra principal payments to reduce total interest',
            'Review your interest rate annually for refinancing opportunities'
          ],
          risks: []
        }
      };
    } else if (type === 'excel') {
      return {
        sheets: [
          {
            name: 'Summary',
            headers: ['Metric', 'Value'],
            data: [
              ['Loan Amount', `$${loanAmount.toLocaleString()}`],
              ['Interest Rate', `${interestRate}%`],
              ['Loan Term', `${loanTerm} years`],
              ['Monthly Payment', `$${results.monthlyPayment.toLocaleString()}`],
              ['Total Interest', `$${results.totalInterest.toLocaleString()}`],
              ['Total Amount', `$${results.totalAmount.toLocaleString()}`],
              ['Payoff Date', results.payoffDate]
            ]
          },
          {
            name: 'Amortization Schedule',
            headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance', 'Extra Payment', 'Total Payment'],
            data: results.amortizationSchedule.map(entry => [
              entry.month,
              entry.payment,
              entry.principal,
              entry.interest,
              entry.balance,
              entry.extraPayment || 0,
              entry.totalPayment
            ])
          }
        ]
      };
    } else {
      return {
        headers: ['Month', 'Payment', 'Principal', 'Interest', 'Balance', 'Extra Payment', 'Total Payment'],
        rows: results.amortizationSchedule.map(entry => [
          entry.month,
          entry.payment,
          entry.principal,
          entry.interest,
          entry.balance,
          entry.extraPayment || 0,
          entry.totalPayment
        ]),
        metadata: {
          title: `Mortgage Calculation: ${title}`,
          description: `Loan: $${loanAmount.toLocaleString()} at ${interestRate}% for ${loanTerm} years`,
          generatedAt: new Date().toISOString()
        }
      };
    }
  }

  private prepareComparisonExport(comparison: LoanComparison, type: ExportType): PDFExportData | ExcelExportData | CSVExportData {
    const { title, loans, results } = comparison;
    
    if (type === 'pdf') {
      return {
        title: `Loan Comparison Report: ${title}`,
        subtitle: `Comparing ${loans.length} loan options`,
        data: comparison,
        charts: [
          {
            type: 'bar',
            title: 'Monthly Payment Comparison',
            data: results.charts.monthlyPayments
          },
          {
            type: 'bar',
            title: 'Total Cost Comparison',
            data: results.charts.totalCosts
          }
        ],
        tables: [
          {
            title: 'Loan Comparison Summary',
            headers: ['Loan', 'Amount', 'Rate', 'Term', 'Monthly Payment', 'Total Cost', 'Rank'],
            rows: results.loans.map(loan => [
              loan.loan.title,
              `$${loan.loan.loanAmount.toLocaleString()}`,
              `${loan.loan.interestRate}%`,
              `${loan.loan.loanTerm} years`,
              `$${loan.metrics.monthlyPayment.toLocaleString()}`,
              `$${loan.metrics.totalCost.toLocaleString()}`,
              loan.metrics.rank
            ])
          }
        ],
        analysis: {
          summary: `Best option: ${results.summary.bestLoan.title} with total savings of $${results.summary.totalSavings.toLocaleString()}`,
          recommendations: [
            `Choose ${results.summary.bestLoan.title} for the lowest total cost`,
            'Consider the monthly payment impact on your budget'
          ],
          risks: []
        }
      };
    } else if (type === 'excel') {
      return {
        sheets: [
          {
            name: 'Comparison Summary',
            headers: ['Loan', 'Amount', 'Rate', 'Term', 'Monthly Payment', 'Total Cost', 'Total Interest', 'Rank'],
            data: results.loans.map(loan => [
              loan.loan.title,
              loan.loan.loanAmount,
              loan.loan.interestRate,
              loan.loan.loanTerm,
              loan.metrics.monthlyPayment,
              loan.metrics.totalCost,
              loan.metrics.totalInterest,
              loan.metrics.rank
            ])
          },
          {
            name: 'Loan Details',
            headers: ['Loan ID', 'Title', 'Amount', 'Down Payment', 'Interest Rate', 'Term'],
            data: loans.map(loan => [
              loan.id,
              loan.title,
              loan.loanAmount,
              loan.downPayment || 0,
              loan.interestRate,
              loan.loanTerm
            ])
          }
        ]
      };
    } else {
      return {
        headers: ['Loan', 'Amount', 'Rate', 'Term', 'Monthly Payment', 'Total Cost', 'Total Interest', 'Rank'],
        rows: results.loans.map(loan => [
          loan.loan.title,
          loan.loan.loanAmount,
          loan.loan.interestRate,
          loan.loan.loanTerm,
          loan.metrics.monthlyPayment,
          loan.metrics.totalCost,
          loan.metrics.totalInterest,
          loan.metrics.rank
        ]),
        metadata: {
          title: `Loan Comparison: ${title}`,
          description: `Comparison of ${loans.length} loan options`,
          generatedAt: new Date().toISOString()
        }
      };
    }
  }

  private prepareScenarioExport(scenario: ScenarioAnalysis, type: ExportType): PDFExportData | ExcelExportData | CSVExportData {
    const { title, scenarios, results } = scenario;
    
    if (type === 'pdf') {
      return {
        title: `Scenario Analysis Report: ${title}`,
        subtitle: `Analysis of ${scenarios.length} scenarios`,
        data: scenario,
        tables: [
          {
            title: 'Scenario Results',
            headers: ['Scenario', 'Type', 'Monthly Payment Diff', 'Total Cost Diff', 'Risk Level'],
            rows: results.scenarios.map(s => [
              s.scenario.name,
              s.scenario.type,
              `$${s.impact.monthlyPaymentDiff.toFixed(2)}`,
              `$${s.impact.totalCostDiff.toLocaleString()}`,
              s.impact.riskLevel
            ])
          }
        ],
        analysis: {
          summary: `Best case scenario: ${results.analysis.bestCase.description} saves $${results.analysis.bestCase.savings.toLocaleString()}`,
          recommendations: results.analysis.recommendations,
          risks: results.analysis.riskAssessment.factors
        }
      };
    } else if (type === 'excel') {
      return {
        sheets: [
          {
            name: 'Baseline',
            headers: ['Metric', 'Value'],
            data: [
              ['Monthly Payment', results.baseline.monthlyPayment],
              ['Total Interest', results.baseline.totalInterest],
              ['Total Amount', results.baseline.totalAmount],
              ['Payoff Date', results.baseline.payoffDate]
            ]
          },
          {
            name: 'Scenarios',
            headers: ['Scenario', 'Type', 'Monthly Payment', 'Total Cost', 'Payment Diff', 'Cost Diff', 'Risk Level'],
            data: results.scenarios.map(s => [
              s.scenario.name,
              s.scenario.type,
              s.results.monthlyPayment,
              s.results.totalAmount,
              s.impact.monthlyPaymentDiff,
              s.impact.totalCostDiff,
              s.impact.riskLevel
            ])
          }
        ]
      };
    } else {
      return {
        headers: ['Scenario', 'Type', 'Monthly Payment', 'Total Cost', 'Payment Diff', 'Cost Diff', 'Risk Level'],
        rows: results.scenarios.map(s => [
          s.scenario.name,
          s.scenario.type,
          s.results.monthlyPayment,
          s.results.totalAmount,
          s.impact.monthlyPaymentDiff,
          s.impact.totalCostDiff,
          s.impact.riskLevel
        ]),
        metadata: {
          title: `Scenario Analysis: ${title}`,
          description: `Analysis of ${scenarios.length} scenarios`,
          generatedAt: new Date().toISOString()
        }
      };
    }
  }

  async createExport(data: CreateExportData, userId: string): Promise<ExportRequest> {
    try {
      this.validateExportData(data);
      
      // Check daily export limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayExports = await this.collection
        .where('userId', '==', userId)
        .where('createdAt', '>=', today.toISOString())
        .get();
      
      if (todayExports.size >= EXPORT_VALIDATION_RULES.maxExportsPerDay) {
        throw new CustomError('Daily export limit reached', 429);
      }
      
      // Get the data to export
      const exportData = await this.getExportData(data.dataType, data.dataId, userId);
      
      const exportRequest: ExportRequest = {
        id: uuidv4(),
        userId,
        type: data.type,
        dataType: data.dataType,
        dataId: data.dataId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + EXPORT_VALIDATION_RULES.expirationDays * 24 * 60 * 60 * 1000)
      };
      
      // Save initial export request
      await this.collection.doc(exportRequest.id).set({
        ...exportRequest,
        createdAt: exportRequest.createdAt.toISOString(),
        updatedAt: exportRequest.updatedAt.toISOString(),
        expiresAt: exportRequest.expiresAt.toISOString()
      });
      
      // Process export asynchronously
      this.processExport(exportRequest, exportData).catch(error => {
        logger.error('Error processing export:', error);
      });
      
      return exportRequest;
    } catch (error) {
      logger.error('Error creating export:', error);
      throw error;
    }
  }

  private async processExport(exportRequest: ExportRequest, data: any): Promise<void> {
    try {
      // Update status to processing
      await this.collection.doc(exportRequest.id).update({
        status: 'processing',
        updatedAt: new Date().toISOString()
      });
      
      let exportData: PDFExportData | ExcelExportData | CSVExportData;
      let fileBuffer: Buffer | string;
      let fileName: string;
      
      // Prepare export data based on type
      switch (exportRequest.dataType) {
        case 'calculation':
          exportData = this.prepareCalculationExport(data, exportRequest.type);
          break;
        case 'comparison':
          exportData = this.prepareComparisonExport(data, exportRequest.type);
          break;
        case 'scenario':
          exportData = this.prepareScenarioExport(data, exportRequest.type);
          break;
        default:
          throw new Error('Invalid data type');
      }
      
      // Generate file based on export type
      switch (exportRequest.type) {
        case 'pdf':
          fileBuffer = await this.generatePDF(exportData as PDFExportData);
          fileName = `${data.title || 'export'}_${Date.now()}.pdf`;
          break;
        case 'excel':
          fileBuffer = this.generateExcel(exportData as ExcelExportData);
          fileName = `${data.title || 'export'}_${Date.now()}.xlsx`;
          break;
        case 'csv':
          fileBuffer = Buffer.from(this.generateCSV(exportData as CSVExportData));
          fileName = `${data.title || 'export'}_${Date.now()}.csv`;
          break;
        default:
          throw new Error('Invalid export type');
      }
      
      // In a real implementation, you would upload the file to cloud storage
      // For now, we'll simulate this with a placeholder URL
      const downloadUrl = `https://storage.example.com/exports/${exportRequest.id}/${fileName}`;
      
      // Update export request with completion
      await this.collection.doc(exportRequest.id).update({
        status: 'completed',
        downloadUrl,
        fileName,
        fileSize: fileBuffer.length,
        updatedAt: new Date().toISOString()
      });
      
      logger.info(`Export completed: ${exportRequest.id}`);
    } catch (error) {
      logger.error('Error processing export:', error);
      
      // Update export request with error
      await this.collection.doc(exportRequest.id).update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date().toISOString()
      });
    }
  }

  async getExport(id: string, userId: string): Promise<ExportRequest> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        throw new CustomError('Export not found', 404);
      }
      
      const data = doc.data();
      if (data?.userId !== userId) {
        throw new CustomError('Access denied', 403);
      }
      
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        expiresAt: new Date(data.expiresAt)
      } as ExportRequest;
    } catch (error) {
      logger.error('Error getting export:', error);
      throw error;
    }
  }

  async getUserExports(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ exports: ExportRequest[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countSnapshot = await this.collection
        .where('userId', '==', userId)
        .get();
      const total = countSnapshot.size;
      
      // Get paginated results (without orderBy to avoid index issues in emulator)
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .limit(limit)
        .offset(offset)
        .get();
      
      const exports = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: new Date(doc.data().createdAt),
        updatedAt: new Date(doc.data().updatedAt),
        expiresAt: new Date(doc.data().expiresAt)
      })) as ExportRequest[];
      
      return {
        exports,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      logger.error('Error getting user exports:', error);
      throw error;
    }
  }

  async deleteExport(id: string, userId: string): Promise<void> {
    try {
      await this.getExport(id, userId);
      
      // In a real implementation, you would also delete the file from cloud storage
      
      await this.collection.doc(id).delete();
      
      logger.info(`Export deleted: ${id} for user: ${userId}`);
    } catch (error) {
      logger.error('Error deleting export:', error);
      throw error;
    }
  }
}

export const exportService = new ExportService();