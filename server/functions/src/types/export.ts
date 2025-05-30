export type ExportType = 'pdf' | 'excel' | 'csv';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportDataType = 'calculation' | 'comparison' | 'scenario';

export interface ExportRequest {
  id: string;
  userId: string;
  type: ExportType;
  dataType: ExportDataType;
  dataId: string; // ID of calculation, comparison, or scenario
  status: ExportStatus;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CreateExportData {
  type: ExportType;
  dataType: ExportDataType;
  dataId: string;
  options?: ExportOptions;
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeAmortization?: boolean;
  includeAnalysis?: boolean;
  format?: {
    currency?: string;
    locale?: string;
    dateFormat?: string;
  };
  branding?: {
    companyName?: string;
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export interface ExportListResponse {
  exports: ExportRequest[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ExportProgress {
  id: string;
  status: ExportStatus;
  progress: number; // 0-100
  message?: string;
  estimatedTimeRemaining?: number; // seconds
}

// PDF Export specific types
export interface PDFExportData {
  title: string;
  subtitle?: string;
  data: any; // calculation, comparison, or scenario data
  charts?: Array<{
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: any;
  }>;
  tables?: Array<{
    title: string;
    headers: string[];
    rows: any[][];
  }>;
  analysis?: {
    summary: string;
    recommendations: string[];
    risks: string[];
  };
}

// Excel Export specific types
export interface ExcelExportData {
  sheets: Array<{
    name: string;
    data: any[][];
    headers?: string[];
    formatting?: {
      headerStyle?: any;
      dataStyle?: any;
      columnWidths?: number[];
    };
  }>;
  charts?: Array<{
    sheetName: string;
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: any;
    position: { row: number; col: number };
  }>;
}

// CSV Export specific types
export interface CSVExportData {
  headers: string[];
  rows: any[][];
  metadata?: {
    title: string;
    description: string;
    generatedAt: string;
  };
}

// Export templates
export const EXPORT_TEMPLATES = {
  calculation: {
    pdf: {
      sections: ['summary', 'amortization', 'charts', 'analysis'],
      defaultOptions: {
        includeCharts: true,
        includeAmortization: true,
        includeAnalysis: true
      }
    },
    excel: {
      sheets: ['Summary', 'Amortization Schedule', 'Charts'],
      defaultOptions: {
        includeCharts: true,
        includeAmortization: true
      }
    },
    csv: {
      files: ['summary.csv', 'amortization.csv'],
      defaultOptions: {
        includeAmortization: true
      }
    }
  },
  comparison: {
    pdf: {
      sections: ['overview', 'comparison-table', 'charts', 'analysis'],
      defaultOptions: {
        includeCharts: true,
        includeAnalysis: true
      }
    },
    excel: {
      sheets: ['Overview', 'Loan Comparison', 'Charts', 'Analysis'],
      defaultOptions: {
        includeCharts: true,
        includeAnalysis: true
      }
    },
    csv: {
      files: ['comparison.csv', 'loan-details.csv'],
      defaultOptions: {}
    }
  },
  scenario: {
    pdf: {
      sections: ['baseline', 'scenarios', 'analysis', 'recommendations'],
      defaultOptions: {
        includeCharts: true,
        includeAnalysis: true
      }
    },
    excel: {
      sheets: ['Baseline', 'Scenarios', 'Analysis', 'Charts'],
      defaultOptions: {
        includeCharts: true,
        includeAnalysis: true
      }
    },
    csv: {
      files: ['baseline.csv', 'scenarios.csv', 'analysis.csv'],
      defaultOptions: {}
    }
  }
};

// Validation rules for exports
export const EXPORT_VALIDATION_RULES = {
  type: ['pdf', 'excel', 'csv'],
  dataType: ['calculation', 'comparison', 'scenario'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  expirationDays: 7,
  maxExportsPerDay: 20
};