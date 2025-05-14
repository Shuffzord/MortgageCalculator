# Impact Analysis Chart Implementation Plan

## Key Changes Required

### 1. Add New Translation Keys
- Add `overpaymentSavingsHighlight` key with placeholder for amount: "THESE OVERPAYMENTS SAVE YOU {{amount}}"
- Add supporting translation keys for the chart and descriptions
{
  "summary": {
    // existing keys...
    "overpaymentImpact": "Overpayment Impact",
    "overpaymentSavingsHighlight": "THESE OVERPAYMENTS SAVE YOU {{amount}}",
    "impactDescription": "Your overpayments significantly reduce your loan costs and duration."
  }
}

### 2. Modify LoanSummary Component
- Import Chart.js and add necessary React hooks (useRef, useEffect, useState)
- Add state variables for impact data and chart instance
- Add chart reference for the canvas element
- Add cleanup function to destroy chart when component unmounts

### 3. Calculate Impact Data
- Add logic to calculate impact data when overpayments are present
- Use the existing `calculationService.analyzeOverpaymentImpact()` function
- Calculate appropriate max amount based on current overpayments

### 4. Create Impact Chart
- Add a Chart.js chart similar to the one in OverpaymentOptimizationPanel
- Use dual y-axis to show both interest savings and term reduction
- Style to match existing design language

### 5. Add UI Section
- Add a new section below existing overpayment results
- Include prominent text showing total savings amount
- Add canvas element for the chart
- Style with green theme to match existing overpayment results section

## Implementation Approach

1. The chart will only appear when overpayments are present
2. The prominent text will use larger font and bold styling
3. The chart will be responsive and work on different screen sizes
4. The implementation will reuse existing calculation logic from the optimization panel

## Technical Components

- **Data Source**: `calculationService.analyzeOverpaymentImpact()`
- **Visualization**: Chart.js line chart with dual y-axis
- **UI Location**: Below existing overpayment results section
- **Styling**: Green theme to match existing overpayment results