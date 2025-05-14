# Implementation Plan for i18n Integration in formatters.ts

Based on the architectural recommendations in the i18n-integration-recommendations.md document, here's a detailed implementation plan to fix the current issues with i18n integration in the formatters.ts file.

## Step 1: Refactor formatTimePeriod Function

Update the formatTimePeriod function in formatters.ts to use dependency injection:

```typescript
/**
 * Formats a time period in months as years and months
 *
 * @param {number} months - Number of months to format
 * @param {Function} [translator] - Optional translation function
 * @returns {string} Formatted time period string (e.g., "2 years 3 months", "1 year", "5 months")
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

## Step 2: Create a Wrapper Function

Create a new file called translatedFormatters.ts in the same directory:

```typescript
// client/src/lib/translatedFormatters.ts
import i18n from '@/i18n';
import { formatTimePeriod as baseFormatTimePeriod } from './formatters';

/**
 * Wrapper for formatTimePeriod that uses i18n for translation
 * 
 * @param {number} months - Number of months to format
 * @returns {string} Translated formatted time period string
 */
export function formatTimePeriod(months: number): string {
  return baseFormatTimePeriod(months, (key, defaultValue) => 
    i18n.t(key, { defaultValue }) as string
  );
}

// Export other translated formatters as needed
```

## Step 3: Update the calculationService.ts File

Modify the calculationService.ts file to use the translated formatter:

```typescript
// In client/src/lib/services/calculationService.ts
import { formatTimePeriod } from '../translatedFormatters';

// ...

formatTimePeriod(months: number): string {
  return formatTimePeriod(months);
}
```

## Step 4: Update the LoanSummary Component

Update the LoanSummary component to use the translated formatter:

```typescript
// In client/src/components/LoanSummary.tsx
import { formatTimePeriod } from '@/lib/translatedFormatters';

// Use formatTimePeriod where needed
```

## Step 5: Update Tests

Update the formatters.test.ts file to test the base function without translation:

```typescript
// In formatters.test.ts
describe('formatTimePeriod', () => {
  it('formats time period with years and months', () => {
    expect(formatTimePeriod(15)).toBe('1 year 3 months');
  });
  
  // Other tests remain the same
});
```

Update the calculationService.test.ts file to mock the translatedFormatters module:

```typescript
// In calculationService.test.ts
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

## Step 6: Test the Implementation

1. Run the formatters.test.ts tests to ensure they pass
2. Run the calculationService.test.ts tests to ensure they pass
3. Run the application and verify that translations work correctly in the UI

## Step 7: Apply the Pattern to Other Formatters

If there are other formatters that need translation, apply the same pattern to them:

1. Refactor the base formatter to accept a translator function
2. Create a wrapper in translatedFormatters.ts
3. Update imports in components and services
4. Update tests

## Benefits of This Implementation

1. **Clean Separation of Concerns**: The base formatters focus on formatting logic, while the translated wrappers handle i18n integration.
2. **Improved Testability**: Tests can use the base formatters without worrying about i18n.
3. **Flexibility**: The application can easily switch translation providers or strategies.
4. **Maintainability**: The code is more maintainable and easier to understand.

This implementation plan provides a clear path to fixing the current issues while improving the overall architecture of the application.