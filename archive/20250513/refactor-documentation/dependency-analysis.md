# Mortgage Calculator Dependency Analysis

## Current Component Dependencies

This document provides a detailed analysis of the dependencies between components in the mortgage calculator application. Understanding these dependencies is crucial for planning refactoring efforts and identifying areas of tight coupling.

## Core Calculation Components

### calculationEngine.ts
**Incoming Dependencies:**
- OverpaymentOptimizationPanel.tsx (via optimizationEngine.ts)
- optimizationEngine.ts
- advancedMortgageScenarios.test.ts
- comprehensive-tests/*.test.ts

**Outgoing Dependencies:**
- types.ts
- validation.ts
- utils.ts
- mortgage-calculator.ts

**Circular Dependency:**
- mortgage-calculator.ts ↔ calculationEngine.ts

### utils.ts
**Incoming Dependencies:**
- calculationEngine.ts
- mortgage-calculator.ts
- optimizationEngine.ts
- UI components

**Outgoing Dependencies:**
- types.ts
- External libraries (date-fns, i18n)

### mortgage-calculator.ts
**Incoming Dependencies:**
- calculationEngine.ts

**Outgoing Dependencies:**
- types.ts
- utils.ts
- calculationEngine.ts (circular dependency)

### optimizationEngine.ts
**Incoming Dependencies:**
- OverpaymentOptimizationPanel.tsx

**Outgoing Dependencies:**
- calculationEngine.ts
- types.ts
- utils.ts

### validation.ts
**Incoming Dependencies:**
- calculationEngine.ts

**Outgoing Dependencies:**
- types.ts

### types.ts
**Incoming Dependencies:**
- All components

**Outgoing Dependencies:**
- None (pure type definitions)

## UI Components

### OverpaymentOptimizationPanel.tsx
**Incoming Dependencies:**
- HomePage.tsx

**Outgoing Dependencies:**
- optimizationEngine.ts
- utils.ts
- types.ts
- UI components (card, button, etc.)

## Dependency Graph

```
                                 +-------------+
                                 |   types.ts  |
                                 +-------------+
                                        ▲
                                        │
                                        │
                 +---------------------+│+---------------------+
                 │                      │                      │
                 │                      │                      │
                 ▼                      │                      ▼
        +----------------+     +----------------+     +----------------+
        | validation.ts  |     |    utils.ts    |     |  UI Components |
        +----------------+     +----------------+     +----------------+
                 │                      ▲                      │
                 │                      │                      │
                 │                      │                      │
                 ▼                      │                      ▼
        +----------------+     +----------------+     +----------------+
        |calculationEngine|◄───►|mortgage-calculator|   |optimizationEngine|
        +----------------+     +----------------+     +----------------+
                 ▲                                             │
                 │                                             │
                 │                                             │
                 │                                             ▼
                 │                                    +----------------+
                 └────────────────────────────────────|OverpaymentPanel|
                                                      +----------------+
```

## Critical Paths and Tight Coupling

1. **Circular Dependency**: The circular dependency between `calculationEngine.ts` and `mortgage-calculator.ts` is a critical issue that needs to be resolved. This creates tight coupling and makes the code harder to maintain and test.

2. **Calculation Engine Dependencies**: The calculation engine is depended upon by many components, making it a critical path in the application. Changes to its API can have widespread effects.

3. **Types Dependency**: Almost all components depend on `types.ts`, which is good for type safety but means changes to types can affect the entire application.

4. **UI to Engine Coupling**: The UI components directly depend on the calculation engines, creating tight coupling between the presentation and business logic layers.

## Recommendations for Dependency Improvement

1. **Break Circular Dependencies**:
   - Extract shared logic between `calculationEngine.ts` and `mortgage-calculator.ts` into a common module
   - Define clear interfaces between these components

2. **Introduce Service Layer**:
   - Create a service layer between UI components and calculation engines
   - This will decouple the presentation layer from the business logic

3. **Modularize Calculation Engine**:
   - Break down the calculation engine into smaller, focused modules
   - Create clear interfaces between these modules

4. **Dependency Injection**:
   - Use dependency injection to make dependencies explicit and testable
   - This will make it easier to mock dependencies for testing

## Impact Analysis for Refactoring

When refactoring components, the following impacts should be considered:

### calculationEngine.ts Refactoring Impact
- **High Impact**: Changes to function signatures will affect all test files and the optimization engine
- **Medium Impact**: Internal refactoring with preserved APIs will have minimal external impact
- **Risk Areas**: Overpayment calculations and interest rate changes are complex and critical

### optimizationEngine.ts Refactoring Impact
- **Medium Impact**: Changes will primarily affect the OverpaymentOptimizationPanel
- **Low Impact**: Other components are not directly dependent on this module

### utils.ts Refactoring Impact
- **High Impact**: Used throughout the application
- **Risk Areas**: Core calculation functions like calculateMonthlyPayment are widely used

## Conclusion

The current dependency structure reveals several areas of tight coupling and circular dependencies that should be addressed. By breaking these dependencies and introducing clearer boundaries between components, we can improve the maintainability and testability of the application.

The refactoring efforts should focus first on breaking the circular dependency between the calculation engine and mortgage calculator, followed by modularizing the calculation engine into smaller, more focused components with clear interfaces.