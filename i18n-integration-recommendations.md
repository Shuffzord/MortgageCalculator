# Proper i18n Integration in formatters.ts

## Current Issues

After reviewing the code, I've identified several architectural issues with how i18n is being used in the formatters.ts file:

1. **Direct Dependency**: The formatters.ts file directly imports and depends on the i18n instance, creating a tight coupling that makes testing difficult.

2. **Inconsistent Testing**: The tests mock i18n differently across files - formatters.test.ts mocks it with just a language property, while calculationService.test.ts expects specific string outputs.

3. **Error-Prone Workarounds**: The current safeTranslate function tries to handle missing i18n.t methods, but this is an error-prone approach that adds complexity.

## Recommended Solution

I recommend refactoring the formatTimePeriod function to follow the dependency injection pattern:

```typescript
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

Then, create a wrapper in the application code:

```typescript
// In a new file like translatedFormatters.ts
import i18n from '@/i18n';
import { formatTimePeriod as baseFormatTimePeriod } from './formatters';

export function formatTimePeriod(months: number): string {
  return baseFormatTimePeriod(months, (key, defaultValue) => i18n.t(key, defaultValue));
}
```

## Benefits of This Approach

1. **Separation of Concerns**: The core formatting logic is separated from the translation mechanism.

2. **Testability**: Tests can use the default implementation or provide a custom translator function.

3. **Flexibility**: The application can easily switch translation providers without changing the core formatting logic.

4. **Consistency**: This approach can be applied to all formatters that need translation.

## Implementation Steps

1. Refactor formatTimePeriod to accept an optional translator function.
2. Update tests to either use the default implementation or provide a mock translator.
3. Create wrapper functions in the application code that provide the i18n.t function.
4. Update imports to use the appropriate formatter based on context.

## Alternative Approach

If creating a separate wrapper file is not desired, another approach is to modify the formatTimePeriod function to handle both testing and production environments:

```typescript
export function formatTimePeriod(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  // Determine if we're in a test environment
  const isTestEnvironment = process.env.NODE_ENV === 'test' || !i18n.t;
  
  let formattedString = "";
  
  if (years > 0) {
    const yearLabel = years > 1 
      ? (isTestEnvironment ? 'years' : i18n.t('form.years', 'years'))
      : (isTestEnvironment ? 'year' : i18n.t('form.year', 'year'));
    formattedString += `${years} ${yearLabel} `;
  }
  
  if (remainingMonths > 0) {
    const monthLabel = remainingMonths > 1 
      ? (isTestEnvironment ? 'months' : i18n.t('form.months', 'months'))
      : (isTestEnvironment ? 'month' : i18n.t('form.month', 'month'));
    formattedString += `${remainingMonths} ${monthLabel}`;
  }
  
  return formattedString.trim();
}
```

However, this approach is less clean from an architectural perspective and still maintains a direct dependency on i18n.

## Conclusion

The dependency injection approach is the most architecturally sound solution. It separates concerns, improves testability, and maintains flexibility for future changes. It's a pattern that can be applied to other formatters that require translation as well.