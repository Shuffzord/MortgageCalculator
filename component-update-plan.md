# Component Update Plan

This document provides a detailed plan for updating all UI components to use the new service layer and module structure. The plan is organized by component, with specific changes needed for each one.

## Priority Components

These components should be updated first as they have direct dependencies on the calculation engine:

### 1. HomePage.tsx

**Current Implementation:**
```typescript
import { calculateLoanDetails } from "@/lib/calculationEngine";
```

**Required Changes:**
```typescript
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of:
calculateLoanDetails(...)
// With:
calculationService.calculateLoanDetails(...)
```

## Formatting-Dependent Components

These components primarily use formatting functions from utils.ts and should be updated to use the formatters module or calculationService:

### 1. ScenarioComparison.tsx

**Current Implementation:**
```typescript
import { formatCurrency, formatTimePeriod } from '@/lib/utils';
```

**Required Changes:**
```typescript
import { formatCurrency, formatTimePeriod } from '@/lib/formatters';
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of:
formatCurrency(value, undefined, currency)
// With:
calculationService.formatCurrency(value, undefined, currency)

// Replace all instances of:
formatTimePeriod(months)
// With:
calculationService.formatTimePeriod(months)
```

### 2. mortgage-calculator/visualization.tsx

**Current Implementation:**
```typescript
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatCurrency } from "@/lib/formatters";
import { getCurrencySymbol } from "@/lib/utils";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";
import { getCurrencySymbol } from "@/lib/utils";

// Replace all instances of:
formatCurrency(value, undefined, currency)
// With:
calculationService.formatCurrency(value, undefined, currency)
```

### 3. mortgage-calculator/saved-calculations-modal.tsx

**Current Implementation:**
```typescript
import { formatCurrency } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatCurrency } from "@/lib/formatters";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of:
formatCurrency(value, undefined, currency)
// With:
calculationService.formatCurrency(value, undefined, currency)
```

### 4. mortgage-calculator/payment-summary.tsx

**Current Implementation:**
```typescript
import { formatCurrency, formatTimePeriod, getCurrencySymbol } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatCurrency, formatTimePeriod } from "@/lib/formatters";
import { getCurrencySymbol } from "@/lib/utils";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";
import { getCurrencySymbol } from "@/lib/utils";

// Replace all instances of formatting functions with calculationService equivalents
```

### 5. mortgage-calculator/amortization-schedule.tsx

**Current Implementation:**
```typescript
import { formatCurrency, formatDate } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatCurrency, formatDate } from "@/lib/formatters";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of formatting functions with calculationService equivalents
```

### 6. LoanSummary.tsx

**Current Implementation:**
```typescript
import { formatTimePeriod, formatCurrency, getCurrencySymbol, formatDate } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatTimePeriod, formatCurrency, formatDate } from "@/lib/formatters";
import { getCurrencySymbol } from "@/lib/utils";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";
import { getCurrencySymbol } from "@/lib/utils";

// Replace all instances of formatting functions with calculationService equivalents
```

### 7. LoanInputForm.tsx

**Current Implementation:**
```typescript
import { cn, getCurrencySymbol, formatDate } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatDate } from "@/lib/formatters";
import { cn, getCurrencySymbol } from "@/lib/utils";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";
import { cn, getCurrencySymbol } from "@/lib/utils";

// Replace all instances of:
formatDate(date)
// With:
calculationService.formatDate(date)
```

### 8. ExportPanel.tsx

**Current Implementation:**
```typescript
import { formatDate } from '@/lib/utils';
```

**Required Changes:**
```typescript
import { formatDate } from '@/lib/formatters';
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of:
formatDate(date)
// With:
calculationService.formatDate(date)
```

### 9. ChartSection.tsx

**Current Implementation:**
```typescript
import { formatCurrency } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatCurrency } from "@/lib/formatters";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of:
formatCurrency(value, undefined, currency)
// With:
calculationService.formatCurrency(value, undefined, currency)
```

### 10. AmortizationSchedule.tsx

**Current Implementation:**
```typescript
import { formatCurrency } from "@/lib/utils";
```

**Required Changes:**
```typescript
import { formatCurrency } from "@/lib/formatters";
// Or preferably:
import { calculationService } from "@/lib/services/calculationService";

// Replace all instances of:
formatCurrency(value, undefined, currency)
// With:
calculationService.formatCurrency(value, undefined, currency)
```

## Already Updated Components

These components are already using the new service layer and don't need to be updated:

### 1. OverpaymentOptimizationPanel.tsx

This component is already correctly using the calculationService:

```typescript
import { calculationService } from "@/lib/services/calculationService";
```

## Implementation Strategy

1. **Update one component at a time**, starting with the priority components
2. **Test each component** after updating to ensure functionality is preserved
3. **Update tests** for each component to use the new structure
4. **Verify the application** works correctly after all components are updated

## Testing Approach

For each component:

1. **Unit Tests**: Update and run unit tests to verify component behavior
2. **Integration Tests**: Test the component in the context of the application
3. **Visual Verification**: Manually verify that the component renders correctly

## Rollback Plan

If issues are encountered during the update:

1. **Revert the changes** to the affected component
2. **Analyze what went wrong**
3. **Adjust the approach** and try again

## Completion Criteria

The component update is complete when:

1. All components use the calculationService or formatters module instead of direct imports from utils.ts or calculationEngine.ts
2. All tests pass
3. The application functions correctly
4. No regressions are observed in the UI or calculation results