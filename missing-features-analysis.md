# Missing Features Analysis for Mortgage Calculator

After analyzing the plan.md file, test files, current implementation, and requirements, I've identified the following missing features that need to be implemented:

## 1. Repayment Model Flexibility

**Current State:**
- Only the equal installments (annuity) repayment model is implemented
- No support for decreasing installments or custom repayment models
- No ability to switch between repayment models during the loan term

**Required Implementation:**
- Add support for decreasing installments model where principal portion remains constant and total payment decreases over time
- Create a framework for custom repayment models
- Implement model switching logic
- Update the `LoanDetails` interface to include repayment model type
- Add UI components for selecting repayment models

## 2. Additional Costs Handling

**Current State:**
- No implementation for loan origination fees
- No support for loan insurance
- No early repayment fee calculation
- No administrative fee handling

**Required Implementation:**
- Add data structures for various fee types (fixed and percentage-based)
- Implement fee calculation logic
- Integrate fees into total cost calculations
- Update UI to allow fee input
- Update the `CalculationResults` interface to include fee information

## 3. APR Calculation

**Current State:**
- No implementation for Annual Percentage Rate (APR) calculation
- No compliance with legal requirements for loan simulations

**Required Implementation:**
- Implement APR calculation algorithm using iterative approach
- Include all fees in APR calculation
- Display APR in loan summary
- Update the `CalculationResults` interface to include APR

## 4. Comparative Analysis

**Current State:**
- Limited ability to compare scenarios
- No visualization of differences between scenarios
- No break-even point calculation

**Required Implementation:**
- Enhance scenario comparison engine
- Implement differential calculator to show differences between scenarios
- Add break-even point computation
- Create comparative visualizations
- Add data structures for scenario comparison

## 5. Overpayment Optimization

**Current State:**
- Basic overpayment handling is implemented
- No optimization algorithms for overpayment strategies
- No analysis of different overpayment approaches

**Required Implementation:**
- Develop savings maximization algorithm
- Implement cost-benefit analyzer
- Create optimization value calculator
- Add UI for optimization parameters
- Implement percentage fee based on optimization value

## 6. Data Export

**Current State:**
- No export functionality for schedules or reports
- No ability to save calculations in portable formats

**Required Implementation:**
- Add export to CSV/Excel functionality
- Implement PDF report generation
- Create JSON export/import capability
- Add UI components for export options

## 7. Educational Components

**Current State:**
- Basic tooltips are implemented
- No comprehensive explanations of loan concepts
- No glossary of financial terms

**Required Implementation:**
- Enhance tooltips with more detailed information
- Add interactive examples showing parameter impacts
- Create a financial terms glossary
- Implement educational content data structures

## Implementation Priority Order

Based on dependencies and importance, the recommended implementation order is:

1. **Repayment Model Flexibility** - This is core functionality that affects many other calculations
2. **Additional Costs Handling** - Required for accurate APR calculation
3. **APR Calculation** - Depends on additional costs implementation
4. **Overpayment Optimization** - Enhances existing overpayment functionality
5. **Comparative Analysis** - Builds on the above implementations
6. **Data Export** - Provides utility once core calculations are solid
7. **Educational Components** - Can be implemented incrementally alongside other features

## Technical Considerations

- Each feature requires updates to data structures in `types.ts`
- The calculation engine needs to be extended with new functions
- UI components need to be created or updated for each feature
- Comprehensive testing is needed for each new feature
- The implementation should follow the modular approach outlined in the plan.md file