# Dependency Injection Implementation for formatters.ts

This document provides a step-by-step guide for implementing the dependency injection approach for the `formatTimePeriod` function and other formatters that require translation.

## Step 1: Refactor formatTimePeriod Function

### File: client/src/lib/formatters.ts

```typescript
/**
 * Formats a time period in months as years and months
 *
 * @param {number} months - Number of months to format
 * @param {Function} [translator] - Optional translation function
 * @returns {string} Formatted time period string (e.g., "2 years 3 months", "1 year", "5 months")
 *
 * @example
 * formatTimePeriod(15); // Returns: "1 year 3 months"
 * formatTimePeriod(24); // Returns: "2 years"
 * formatTimePeriod(5);  // Returns: "5 months"
 * formatTimePeriod(0);  // Returns: "" (empty string)
 */
export function formatTimePeriod(
  months: number,
  translator?: (key: string, defaultValue: string) => string
): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  // Default translator that just returns the default value
  const t = translator || ((key: string, defaultValue: string) => defaultValue);
  
  let formattedString = "";
  
  if (years > 0) {
    const yearLabel = years > 1 ? t('form.years', 'years') : t('form.year', 'year');
    formattedString += `${years} ${yearLabel} `;
  }
  
  if (remainingMonths > 0) {
    const monthLabel = remainingMonths > 1 ? t('form.months', 'months') : t('form.month', 'month');
    formattedString += `${remainingMonths} ${monthLabel}`;
  }
  
  return formattedString.trim();
}
```

## Step 2: Create Translated Formatters Module

### File: client/src/lib/translatedFormatters.ts

```typescript
/**
 * @fileoverview Translated formatting utilities for mortgage calculator application
 *
 * This module provides wrappers around the base formatters that use i18n for translation.
 * It serves as a bridge between the pure formatting logic and the i18n system.
 */

import i18n from '@/i18n';
import { 
  formatTimePeriod as baseFormatTimePeriod,
  // Import other formatters as needed
} from './formatters';

/**
 * Formats a time period in months as years and months with translation
 *
 * @param {number} months - Number of months to format
 * @returns {string} Translated formatted time period string
 */
export function formatTimePeriod(months: number): string {
  return baseFormatTimePeriod(months, (key, defaultValue) => 
    i18n.t(key, { defaultValue }) as string
  );
}

// Add other translated formatters as needed
```

## Step 3: Update calculationService.ts

### File: client/src/lib/services/calculationService.ts

```typescript
// Change the import from
import { formatTimePeriod } from '../formatters';

// To
import { formatTimePeriod } from '../translatedFormatters';
```

And update the method:

```typescript
/**
 * Formats a time period in months as a human-readable string.
 *
 * @param {number} months - Number of months to format
 * @returns {string} Formatted time period string (e.g., "2 years 6 months")
 */
formatTimePeriod(months: number): string {
  return formatTimePeriod(months);
}
```

## Step 4: Update Components

Update any components that directly use formatTimePeriod to import from translatedFormatters instead:

### Example: client/src/components/LoanSummary.tsx

```typescript
// Change the import from
import { formatTimePeriod } from '@/lib/formatters';

// To
import { formatTimePeriod } from '@/lib/translatedFormatters';
```

## Step 5: Update Tests

### File: client/src/lib/formatters.test.ts

No changes needed - the tests should continue to work with the base formatters.

### File: client/src/lib/services/calculationService.test.ts

```typescript
// Add a mock for translatedFormatters
jest.mock('../translatedFormatters', () => ({
  formatTimePeriod: jest.fn().mockImplementation((months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    let result = '';
    
    if (years > 0) {
      result += `${years} ${years > 1 ? 'years' : 'year'} `;
    }
    
    if (remainingMonths > 0) {
      result += `${remainingMonths} ${remainingMonths > 1 ? 'months' : 'month'}`;
    }
    
    return result.trim();
  })
}));
```

## Step 6: Create Tests for Translated Formatters

### File: client/src/lib/translatedFormatters.test.ts

```typescript
import { formatTimePeriod } from './translatedFormatters';
import i18n from '@/i18n';

// Mock i18n
jest.mock('@/i18n', () => ({
  t: jest.fn().mockImplementation((key, options) => {
    // Simple mock implementation that returns translated strings
    const translations = {
      'form.year': 'año',
      'form.years': 'años',
      'form.month': 'mes',
      'form.months': 'meses'
    };
    
    return translations[key] || options?.defaultValue || key;
  }),
  language: 'es'
}));

describe('Translated Formatters', () => {
  describe('formatTimePeriod', () => {
    it('formats time period with translation', () => {
      const result = formatTimePeriod(15);
      expect(result).toBe('1 año 3 meses');
    });
    
    it('formats time period with only years', () => {
      const result = formatTimePeriod(24);
      expect(result).toBe('2 años');
    });
    
    it('formats time period with only months', () => {
      const result = formatTimePeriod(5);
      expect(result).toBe('5 meses');
    });
  });
});
```

## Step 7: Apply the Pattern to Other Formatters

If there are other formatters that need translation, apply the same pattern:

1. Refactor the base formatter to accept a translator function
2. Create a wrapper in translatedFormatters.ts
3. Update imports in components and services
4. Update tests

## Testing the Implementation

1. Run the formatters.test.ts tests:
   ```
   npm test client/src/lib/formatters.test.ts
   ```

2. Run the calculationService.test.ts tests:
   ```
   npm test client/src/lib/services/calculationService.test.ts
   ```

3. Run the new translatedFormatters.test.ts tests:
   ```
   npm test client/src/lib/translatedFormatters.test.ts
   ```

4. Run the application and verify that translations work correctly in the UI.

## Benefits of This Implementation

1. **Clean Separation of Concerns**: The base formatters focus on formatting logic, while the translated wrappers handle i18n integration.
2. **Improved Testability**: Tests can use the base formatters without worrying about i18n.
3. **Flexibility**: The application can easily switch translation providers or strategies.
4. **Maintainability**: The code is more maintainable and easier to understand.

This implementation follows the dependency injection pattern, which is a well-established software design pattern that promotes loose coupling and testability.