#!/usr/bin/env node

/**
 * Translation Validation Tool
 *
 * Systematically checks i18n translation files for:
 * - Key parity across all locales
 * - Missing/extra keys per language
 * - Nested object structure consistency
 * - Placeholder format validation
 * - Duplicate value detection
 * - Coverage analysis
 *
 * Usage:
 *   node scripts/translation-validator.js [options]
 *
 * Options:
 *   --format <type>    Output format: console|json|markdown (default: console)
 *   --output <file>    Output file path (for json/markdown formats)
 *   --strict           Exit with error code if issues found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, '../client/public/locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'pl'];
const TRANSLATION_FILE = 'translation.json';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Load translation file for a given language
 */
function loadTranslation(lang) {
  const filePath = path.join(LOCALES_DIR, lang, TRANSLATION_FILE);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${lang}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Get all keys from nested object with path notation
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, currentPath));
    } else {
      keys.push(currentPath);
    }
  }

  return keys;
}

/**
 * Get value from nested object using path notation
 */
function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Extract placeholders from translation string
 */
function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.map((m) => m.slice(2, -2).trim()) : [];
}

/**
 * Compare keys across all languages
 */
function compareKeys(translations) {
  const keysByLang = {};
  const allKeys = new Set();

  // Get all keys for each language
  for (const [lang, data] of Object.entries(translations)) {
    const keys = getAllKeys(data);
    keysByLang[lang] = new Set(keys);
    keys.forEach((key) => allKeys.add(key));
  }

  // Find missing and extra keys
  const issues = {};

  for (const lang of SUPPORTED_LANGUAGES) {
    issues[lang] = {
      missing: [],
      extra: [],
    };

    const langKeys = keysByLang[lang];

    // Missing keys (in other languages but not in this one)
    allKeys.forEach((key) => {
      if (!langKeys.has(key)) {
        issues[lang].missing.push(key);
      }
    });

    // Extra keys (in this language but not in others)
    langKeys.forEach((key) => {
      if (!Array.from(allKeys).every((k) => k === key || keysByLang['en'].has(key))) {
        const inOthers = SUPPORTED_LANGUAGES.filter((l) => l !== lang && keysByLang[l].has(key));
        if (inOthers.length === 0) {
          issues[lang].extra.push(key);
        }
      }
    });
  }

  return { issues, allKeys: Array.from(allKeys).sort() };
}

/**
 * Validate placeholder consistency
 */
function validatePlaceholders(translations) {
  const issues = [];
  const enKeys = getAllKeys(translations['en']);

  for (const key of enKeys) {
    const enValue = getValueByPath(translations['en'], key);
    const enPlaceholders = extractPlaceholders(enValue).sort();

    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'en') continue;

      const langValue = getValueByPath(translations[lang], key);
      if (!langValue) continue;

      const langPlaceholders = extractPlaceholders(langValue).sort();

      if (JSON.stringify(enPlaceholders) !== JSON.stringify(langPlaceholders)) {
        issues.push({
          key,
          lang,
          expected: enPlaceholders,
          actual: langPlaceholders,
          enValue,
          langValue,
        });
      }
    }
  }

  return issues;
}

/**
 * Find duplicate values (potential copy-paste errors)
 */
function findDuplicates(translations) {
  const duplicates = {};

  for (const [lang, data] of Object.entries(translations)) {
    const valueMap = new Map();
    const keys = getAllKeys(data);

    for (const key of keys) {
      const value = getValueByPath(data, key);
      if (typeof value !== 'string' || value.length < 3) continue;

      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value).push(key);
    }

    duplicates[lang] = Array.from(valueMap.entries())
      .filter(([_, keys]) => keys.length > 1)
      .map(([value, keys]) => ({ value, keys }));
  }

  return duplicates;
}

/**
 * Calculate coverage statistics
 */
function calculateCoverage(translations) {
  const stats = {};

  for (const [lang, data] of Object.entries(translations)) {
    const keys = getAllKeys(data);
    const totalKeys = keys.length;
    const translatedKeys = keys.filter((key) => {
      const value = getValueByPath(data, key);
      // Check if value exists and is not empty (handle strings, arrays, objects)
      if (typeof value === 'string') {
        return value.trim().length > 0;
      } else if (Array.isArray(value)) {
        return value.length > 0;
      } else if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return value !== null && value !== undefined;
    }).length;

    stats[lang] = {
      total: totalKeys,
      translated: translatedKeys,
      coverage: totalKeys > 0 ? ((translatedKeys / totalKeys) * 100).toFixed(2) : 0,
    };
  }

  return stats;
}

/**
 * Generate console report
 */
function generateConsoleReport(results) {
  const { keyIssues, placeholderIssues, duplicates, coverage } = results;

  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}TRANSLATION VALIDATION REPORT${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  // Coverage Summary
  console.log(`${colors.blue}📊 COVERAGE SUMMARY${colors.reset}`);
  for (const [lang, stats] of Object.entries(coverage)) {
    const color =
      stats.coverage >= 95 ? colors.green : stats.coverage >= 80 ? colors.yellow : colors.red;
    console.log(
      `  ${lang.toUpperCase()}: ${color}${stats.coverage}%${colors.reset} (${stats.translated}/${stats.total} keys)`
    );
  }

  // Key Parity Issues
  console.log(`\n${colors.blue}🔑 KEY PARITY ANALYSIS${colors.reset}`);
  let hasKeyIssues = false;

  for (const [lang, issues] of Object.entries(keyIssues.issues)) {
    if (issues.missing.length > 0 || issues.extra.length > 0) {
      hasKeyIssues = true;
      console.log(`\n  ${colors.yellow}${lang.toUpperCase()}:${colors.reset}`);

      if (issues.missing.length > 0) {
        console.log(`    ${colors.red}Missing (${issues.missing.length}):${colors.reset}`);
        issues.missing.slice(0, 10).forEach((key) => {
          console.log(`      - ${key}`);
        });
        if (issues.missing.length > 10) {
          console.log(
            `      ${colors.gray}... and ${issues.missing.length - 10} more${colors.reset}`
          );
        }
      }

      if (issues.extra.length > 0) {
        console.log(`    ${colors.yellow}Extra (${issues.extra.length}):${colors.reset}`);
        issues.extra.slice(0, 5).forEach((key) => {
          console.log(`      - ${key}`);
        });
        if (issues.extra.length > 5) {
          console.log(`      ${colors.gray}... and ${issues.extra.length - 5} more${colors.reset}`);
        }
      }
    }
  }

  if (!hasKeyIssues) {
    console.log(`  ${colors.green}✓ All keys are consistent across languages${colors.reset}`);
  }

  // Placeholder Issues
  console.log(`\n${colors.blue}📝 PLACEHOLDER VALIDATION${colors.reset}`);
  if (placeholderIssues.length > 0) {
    console.log(
      `  ${colors.red}Found ${placeholderIssues.length} placeholder mismatches:${colors.reset}\n`
    );
    placeholderIssues.slice(0, 5).forEach((issue) => {
      console.log(`    ${colors.yellow}${issue.key}${colors.reset} (${issue.lang})`);
      console.log(`      Expected: ${colors.gray}${JSON.stringify(issue.expected)}${colors.reset}`);
      console.log(`      Actual:   ${colors.red}${JSON.stringify(issue.actual)}${colors.reset}`);
    });
    if (placeholderIssues.length > 5) {
      console.log(`    ${colors.gray}... and ${placeholderIssues.length - 5} more${colors.reset}`);
    }
  } else {
    console.log(`  ${colors.green}✓ All placeholders are consistent${colors.reset}`);
  }

  // Duplicates
  console.log(`\n${colors.blue}🔄 DUPLICATE VALUES${colors.reset}`);
  let hasDuplicates = false;

  for (const [lang, dups] of Object.entries(duplicates)) {
    if (dups.length > 0) {
      hasDuplicates = true;
      console.log(
        `\n  ${colors.yellow}${lang.toUpperCase()} (${dups.length} duplicate values):${colors.reset}`
      );
      dups.slice(0, 3).forEach((dup) => {
        console.log(`    "${colors.gray}${dup.value.slice(0, 50)}...${colors.reset}"`);
        console.log(`      Used in: ${dup.keys.slice(0, 3).join(', ')}`);
        if (dup.keys.length > 3) {
          console.log(`      ${colors.gray}... and ${dup.keys.length - 3} more${colors.reset}`);
        }
      });
      if (dups.length > 3) {
        console.log(`    ${colors.gray}... and ${dups.length - 3} more duplicates${colors.reset}`);
      }
    }
  }

  if (!hasDuplicates) {
    console.log(`  ${colors.green}✓ No suspicious duplicates found${colors.reset}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  const totalIssues =
    Object.values(keyIssues.issues).reduce((sum, i) => sum + i.missing.length + i.extra.length, 0) +
    placeholderIssues.length;

  if (totalIssues === 0) {
    console.log(`${colors.green}✓ VALIDATION PASSED - No critical issues found${colors.reset}`);
  } else {
    console.log(`${colors.red}⚠ VALIDATION FAILED - ${totalIssues} issues found${colors.reset}`);
  }
  console.log('='.repeat(80) + '\n');

  return totalIssues;
}

/**
 * Generate JSON report
 */
function generateJSONReport(results, outputFile) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues:
        Object.values(results.keyIssues.issues).reduce(
          (sum, i) => sum + i.missing.length + i.extra.length,
          0
        ) + results.placeholderIssues.length,
      languages: SUPPORTED_LANGUAGES,
    },
    coverage: results.coverage,
    keyIssues: results.keyIssues,
    placeholderIssues: results.placeholderIssues,
    duplicates: results.duplicates,
  };

  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`${colors.green}JSON report written to: ${outputFile}${colors.reset}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(results, outputFile) {
  const { keyIssues, placeholderIssues, duplicates, coverage } = results;

  let md = '# Translation Validation Report\n\n';
  md += `**Generated:** ${new Date().toISOString()}\n\n`;

  // Coverage
  md += '## Coverage Summary\n\n';
  md += '| Language | Coverage | Translated | Total |\n';
  md += '|----------|----------|------------|-------|\n';
  for (const [lang, stats] of Object.entries(coverage)) {
    const status = stats.coverage >= 95 ? '✅' : stats.coverage >= 80 ? '⚠️' : '❌';
    md += `| ${status} ${lang.toUpperCase()} | ${stats.coverage}% | ${stats.translated} | ${stats.total} |\n`;
  }

  // Key Issues
  md += '\n## Key Parity Issues\n\n';
  for (const [lang, issues] of Object.entries(keyIssues.issues)) {
    if (issues.missing.length > 0 || issues.extra.length > 0) {
      md += `### ${lang.toUpperCase()}\n\n`;

      if (issues.missing.length > 0) {
        md += `**Missing Keys (${issues.missing.length}):**\n\n`;
        issues.missing.forEach((key) => {
          md += `- \`${key}\`\n`;
        });
        md += '\n';
      }

      if (issues.extra.length > 0) {
        md += `**Extra Keys (${issues.extra.length}):**\n\n`;
        issues.extra.forEach((key) => {
          md += `- \`${key}\`\n`;
        });
        md += '\n';
      }
    }
  }

  // Placeholder Issues
  md += '## Placeholder Mismatches\n\n';
  if (placeholderIssues.length > 0) {
    md += `Found ${placeholderIssues.length} placeholder mismatches:\n\n`;
    placeholderIssues.forEach((issue) => {
      md += `### \`${issue.key}\` (${issue.lang})\n\n`;
      md += `- **Expected:** ${JSON.stringify(issue.expected)}\n`;
      md += `- **Actual:** ${JSON.stringify(issue.actual)}\n\n`;
    });
  } else {
    md += 'No placeholder mismatches found. ✅\n\n';
  }

  // Duplicates
  md += '## Duplicate Values\n\n';
  for (const [lang, dups] of Object.entries(duplicates)) {
    if (dups.length > 0) {
      md += `### ${lang.toUpperCase()} (${dups.length} duplicates)\n\n`;
      dups.forEach((dup) => {
        md += `**"${dup.value.slice(0, 100)}..."**\n\n`;
        md += 'Used in:\n';
        dup.keys.forEach((key) => {
          md += `- \`${key}\`\n`;
        });
        md += '\n';
      });
    }
  }

  fs.writeFileSync(outputFile, md);
  console.log(`${colors.green}Markdown report written to: ${outputFile}${colors.reset}`);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'console';
  const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;
  const strict = args.includes('--strict');

  console.log(`${colors.cyan}Loading translations...${colors.reset}`);

  // Load all translations
  const translations = {};
  for (const lang of SUPPORTED_LANGUAGES) {
    translations[lang] = loadTranslation(lang);
    if (!translations[lang]) {
      console.error(`${colors.red}Failed to load ${lang} translations${colors.reset}`);
      process.exit(1);
    }
  }

  console.log(
    `${colors.green}✓ Loaded translations for: ${SUPPORTED_LANGUAGES.join(', ')}${colors.reset}`
  );
  console.log(`${colors.cyan}Running validation...${colors.reset}\n`);

  // Run validations
  const results = {
    keyIssues: compareKeys(translations),
    placeholderIssues: validatePlaceholders(translations),
    duplicates: findDuplicates(translations),
    coverage: calculateCoverage(translations),
  };

  // Generate reports
  let totalIssues = 0;

  if (format === 'console' || !outputFile) {
    totalIssues = generateConsoleReport(results);
  }

  if (format === 'json' && outputFile) {
    generateJSONReport(results, outputFile);
  }

  if (format === 'markdown' && outputFile) {
    generateMarkdownReport(results, outputFile);
  }

  // Exit with error code if strict mode and issues found
  if (strict && totalIssues > 0) {
    process.exit(1);
  }
}

// Run if called directly (always run when executed as script)
main();

export {
  loadTranslation,
  getAllKeys,
  compareKeys,
  validatePlaceholders,
  findDuplicates,
  calculateCoverage,
};
