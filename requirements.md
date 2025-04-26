# Requirements for Mortgage Calculator System

## 1. Functional Requirements

### 1.1. Basic Calculator Functions
- Calculate remaining loan amount (principal + interest)
- Calculate installment amounts for different repayment models (equal installments, decreasing installments, others)
- Set initial interest rate
- Define interest rate changes over time
- Simulate the impact of inflation on the real value of installments

### 1.2. Early Repayment Schedule
- Add one-time overpayments at any point in the schedule
- Add regular overpayments (e.g., monthly, quarterly, annually)
- Choose overpayment handling method (shortening the loan period or reducing the installment amount)
- Define overpayment amounts or percentage of remaining principal

### 1.3. Data Visualization
- Graphical representation of remaining principal over time
- Graphical representation of interest over time
- Bar chart showing the ratio of principal to interest in each installment
- Comparative chart of schedule with and without overpayments

### 1.4. Additional Costs Consideration
- Loan origination fee
- Loan insurance (including low down payment insurance for mortgage loans)
- Early repayment fees
- Other administrative fees

### 1.5. Legal Compliance
- Calculate Annual Percentage Rate (APR)
- Compliance with local loan regulations
- Generate simulations compliant with legal requirements

### 1.6. Additional Features (paid)
- Data export in JSON, CSV, PDF formats
- Comparison of different repayment scenarios
- Overpayment optimization module with percentage fee based on optimization value

### 1.7. Educational Mode
- Each interface element has explanatory information (tooltip)
- Option to display additional explanations about loan concepts
- Glossary of financial terms

## 2. Technical Requirements

### 2.1. Architecture
- Client-side application (frontend only)
- No server-side data storage
- Data stored locally in the browser (localStorage, IndexedDB)

### 2.2. Technologies
- JavaScript Framework (React, Vue.js, or Angular)
- Data visualization library (Chart.js, D3.js)
- Financial calculation library (e.g., Finance.js)
- TypeScript for better type control and error reduction

### 2.3. Security
- Encryption of sensitive data stored locally
- Informing users about client-side only data processing
- Option to completely remove data from local storage

### 2.4. Performance
- Calculation optimization for large loans or long periods
- Efficient chart rendering
- Data structures prepared for easy export

## 3. UX/UI Requirements

### 3.1. User Interface
- Intuitive interface allowing easy data entry
- Division into logical sections (loan data, overpayment schedule, results)
- Clear presentation of results
- Forms with input data validation

### 3.2. Accessibility
- Basic compliance with WCAG 2.1
- Readable labels and descriptions
- Appropriate color contrast

### 3.3. Educational Mode
- Tooltips for each form field
- Explanation of concepts in the context they appear
- Interactive examples showing the impact of different parameters on the result

## 4. Additional Features and Extensions

### 4.1. Overpayment Optimization (paid feature)
- Algorithm suggesting optimal overpayment schedule
- Analysis of different overpayment strategies (regular, one-time, mixed)
- Forecasting savings for different overpayment strategies
- Percentage fee based on optimization value (saved amount)

### 4.2. Scenario Comparison (paid feature)
- Ability to save multiple loan scenarios
- Comparison of different loan variants (different initial parameters)
- Comparison of different repayment strategies for the same loan
- Visualization of differences between scenarios

### 4.3. Data Export (paid feature)
- Export complete repayment schedule to CSV/Excel
- Generate PDF reports
- Option to save all data in JSON format for later loading

## 5. Non-functional Requirements

### 5.1. Performance
- Response time for typical user actions below 1 second
- Efficient calculations for loans up to 50 years

### 5.2. Maintainability
- Modular code structure
- Code documentation
- Unit tests for critical calculation functions

### 5.3. Scalability
- Design with future extensions in mind
- Preparation for adding new loan types
- Structure allowing easy addition of new paid features

## 6. Implementation Phases

### 6.1. Phase 1 (MVP)
- Basic loan calculator
- Calculation of installments and schedule
- Basic data visualization
- Ability to define simple overpayments

### 6.2. Phase 2
- Addition of all repayment models
- Extended data visualization
- Ability to define interest rate changes
- Basic educational mode

### 6.3. Phase 3
- Implementation of paid features
- Advanced overpayment module
- Overpayment optimization
- Scenario comparison
- Data export