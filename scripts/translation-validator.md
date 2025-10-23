# Translation Validator Documentation

## Overview

The Translation Validator is a systematic tool for checking i18n translation completeness and consistency across all supported languages in the MortgageCalculator application.

## Features

✅ **Key Parity Check** - Ensures all translation keys exist in all languages
✅ **Missing/Extra Key Detection** - Identifies keys present in some languages but not others
✅ **Nested Structure Validation** - Validates consistent object hierarchy across locales
✅ **Placeholder Consistency** - Verifies `{{variable}}` placeholders match across translations
✅ **Duplicate Detection** - Finds suspiciously similar values (potential copy-paste errors)
✅ **Coverage Analysis** - Calculates translation completeness percentage per language

## Installation

No additional dependencies required. Uses Node.js built-in modules.

## Usage

### Basic Usage (Console Output)

```bash
node scripts/translation-validator.js
```

### JSON Report

```bash
node scripts/translation-validator.js --format json --output reports/translation-validation.json
```

### Markdown Report

```bash
node scripts/translation-validator.js --format markdown --output reports/translation-validation.md
```

### Strict Mode (CI/CD)

Exit with error code if issues are found:

```bash
node scripts/translation-validator.js --strict
```

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "check:translations": "node scripts/translation-validator.js",
    "check:translations:report": "node scripts/translation-validator.js --format markdown --output claudedocs/translation-report.md",
    "check:translations:ci": "node scripts/translation-validator.js --strict"
  }
}
```

Then run:

```bash
npm run check:translations
npm run check:translations:report
npm run check:translations:ci  # For CI/CD pipelines
```

## Output Examples

### Console Output

```
================================================================================
TRANSLATION VALIDATION REPORT
================================================================================

📊 COVERAGE SUMMARY
  EN: 100.0% (572/572 keys)
  ES: 99.3% (568/572 keys)
  PL: 100.7% (574/572 keys)

🔑 KEY PARITY ANALYSIS

  ES:
    Missing (4):
      - calculator.advancedOptions.newFeature
      - tutorial.step5.additionalInfo
      ...

  PL:
    Extra (2):
      - obsolete.oldFeature
      ...

📝 PLACEHOLDER VALIDATION
  Found 3 placeholder mismatches:

    calculator.monthlyPayment (es)
      Expected: ["amount", "currency"]
      Actual:   ["amount"]

🔄 DUPLICATE VALUES
  No suspicious duplicates found

================================================================================
⚠ VALIDATION FAILED - 9 issues found
================================================================================
```

### JSON Report Structure

```json
{
  "timestamp": "2025-10-04T10:30:00.000Z",
  "summary": {
    "totalIssues": 9,
    "languages": ["en", "es", "pl"]
  },
  "coverage": {
    "en": { "total": 572, "translated": 572, "coverage": "100.00" },
    "es": { "total": 568, "translated": 568, "coverage": "99.30" },
    "pl": { "total": 574, "translated": 574, "coverage": "100.70" }
  },
  "keyIssues": {
    "issues": {
      "en": { "missing": [], "extra": [] },
      "es": { "missing": ["key1", "key2"], "extra": [] },
      "pl": { "missing": [], "extra": ["key3"] }
    },
    "allKeys": ["...", "..."]
  },
  "placeholderIssues": [...],
  "duplicates": {...}
}
```

## Validation Rules

### 1. Key Parity

**Missing Keys**: Keys that exist in English but not in other languages
**Extra Keys**: Keys that exist in one language but not in English (base language)

**Example:**

```json
// en/translation.json
{ "welcome": "Welcome" }

// es/translation.json
{ }  // ❌ Missing "welcome"
```

### 2. Placeholder Consistency

Placeholders must match exactly between languages:

**Valid:**

```json
// en
{ "greeting": "Hello {{name}}" }
// es
{ "greeting": "Hola {{name}}" }  // ✅ Same placeholder
```

**Invalid:**

```json
// en
{ "greeting": "Hello {{name}}" }
// es
{ "greeting": "Hola {{nombre}}" }  // ❌ Different placeholder name
```

### 3. Nested Structure

Object nesting must be consistent:

**Valid:**

```json
// en
{ "calculator": { "input": "Enter amount" } }
// es
{ "calculator": { "input": "Ingrese monto" } }
```

**Invalid:**

```json
// en
{ "calculator": { "input": "Enter amount" } }
// es
{ "calculator.input": "Ingrese monto" }  // ❌ Different structure
```

### 4. Duplicate Detection

Finds values used for multiple keys (potential copy-paste errors):

```json
{
  "button.save": "Save",
  "button.submit": "Save", // ⚠️ Suspicious duplicate
  "button.confirm": "Save" // ⚠️ Suspicious duplicate
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Translation Validation

on: [pull_request]

jobs:
  validate-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run translation validator
        run: npm run check:translations:ci

      - name: Generate report
        if: failure()
        run: |
          npm run check:translations:report
          cat claudedocs/translation-report.md >> $GITHUB_STEP_SUMMARY
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check translations before commit
npm run check:translations:ci
```

## Configuration

Edit `scripts/translation-validator.js` constants to customize:

```javascript
const LOCALES_DIR = path.join(__dirname, '../client/public/locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'pl']; // Add more languages
const TRANSLATION_FILE = 'translation.json';
```

## Troubleshooting

### "Error loading [lang]" message

**Cause**: Translation file not found or invalid JSON
**Solution**: Verify file exists at `client/public/locales/{lang}/translation.json` and is valid JSON

### No issues found but translations clearly missing

**Cause**: English (base language) might be missing keys too
**Solution**: Tool compares against English - ensure English is complete first

### Placeholder mismatch false positives

**Cause**: Legitimate language-specific variations
**Solution**: Review each case - some languages may need different placeholders for grammar

## Maintenance

### Adding New Languages

1. Add language code to `SUPPORTED_LANGUAGES` array
2. Create translation file: `client/public/locales/{lang}/translation.json`
3. Run validator to identify missing keys
4. Translate missing keys

### Regular Checks

**Recommended Schedule:**

- Before every release
- On pull requests changing translations
- Weekly automated check
- After adding new features

## API Usage

Import as module for custom tooling:

```javascript
const validator = require('./scripts/translation-validator');

const translations = {
  en: validator.loadTranslation('en'),
  es: validator.loadTranslation('es'),
};

const results = {
  keyIssues: validator.compareKeys(translations),
  placeholders: validator.validatePlaceholders(translations),
  coverage: validator.calculateCoverage(translations),
};

console.log(results);
```

## Supported Formats

- **Console**: Colored terminal output with summaries
- **JSON**: Machine-readable format for automation
- **Markdown**: Human-readable reports for documentation

## Best Practices

1. **Run before commits** - Catch issues early
2. **Use strict mode in CI** - Prevent broken translations from merging
3. **Generate reports** - Track improvement over time
4. **Fix missing keys first** - Then address duplicates
5. **Review placeholder mismatches** - May indicate translation errors

## Limitations

- Does not validate translation quality (only structure)
- Does not check grammar or spelling
- Does not verify context appropriateness
- Duplicate detection is simple string matching
- Does not handle pluralization rules

## Future Enhancements

Potential additions:

- Translation quality scoring
- Fuzzy duplicate detection
- Pluralization rule validation
- Context-aware validation
- Translation memory integration
- Automated translation suggestions
