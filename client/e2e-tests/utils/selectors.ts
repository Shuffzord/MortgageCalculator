/**
 * Selectors for UI Testing
 *
 * This file imports shared selectors from the shared test utilities
 * and re-exports them along with additional e2e-specific selectors.
 */

// Import shared selectors
import { SELECTORS } from '../../src/test-utils/selectors';

// Re-export shared selectors
export const LOAN_AMOUNT_INPUT = SELECTORS.LOAN_AMOUNT_INPUT;
export const INTEREST_RATE_INPUT = SELECTORS.INTEREST_RATE_INPUT;
export const LOAN_TERM_INPUT = SELECTORS.LOAN_TERM_INPUT;
export const REPAYMENT_MODEL_SELECT = SELECTORS.REPAYMENT_MODEL_SELECT;
export const CALCULATE_BUTTON = SELECTORS.CALCULATE_BUTTON;
export const LOAN_SUMMARY = SELECTORS.LOAN_SUMMARY;
export const MONTHLY_PAYMENT = SELECTORS.MONTHLY_PAYMENT;
export const TOTAL_INTEREST = SELECTORS.TOTAL_INTEREST;
export const TOTAL_COST = SELECTORS.TOTAL_COST;
export const VALIDATION_ERROR = SELECTORS.VALIDATION_ERROR;

// Main application selectors
export const APP_CONTAINER = '#root';
export const PAGE_TITLE = 'title';

// Navigation selectors
export const NAVIGATION = 'nav';
export const LANGUAGE_SWITCHER = '[data-testid="language-switcher"]';

// Loan Input Form selectors
export const LOAN_INPUT_FORM = '[data-testid="loan-input-form"]';
export const LOAN_START_DATE_INPUT = '[data-testid="loan-start-date-input"]';
export const ADD_INTEREST_RATE_PERIOD_BUTTON = '[data-testid="add-interest-rate-period-button"]';
export const ADD_OVERPAYMENT_BUTTON = '[data-testid="add-overpayment-button"]';

// Interest rate period selectors
export const INTEREST_RATE_DATE_RANGE = '[data-testid^="interest-rate-date-range"]';
export const INTEREST_RATE_END_DATE = '[data-testid="interest-rate-end-date"]';
export const INTEREST_RATE_INPUT_ADDITIONAL = (index: number) =>
  `[data-testid="interest-rate-input-${index}"]`;

// Currency selectors
export const CURRENCY_SYMBOL = '[data-testid="currency-symbol"]';
export const CURRENCY_SELECTOR = '[data-testid="currency-selector"]';

// Additional Loan Summary selectors
export const ACTUAL_TERM = '[data-testid="actual-term"]';

// Chart section selectors
export const CHART_SECTION = '[data-testid="chart-section"]';
export const PRINCIPAL_VS_INTEREST_CHART = '[data-testid="principal-vs-interest-chart"]';
export const AMORTIZATION_CHART = '[data-testid="amortization-chart"]';

// Amortization schedule selectors
export const AMORTIZATION_SCHEDULE = '[data-testid="amortization-schedule"]';
export const AMORTIZATION_TABLE = '[data-testid="amortization-table"]';
export const AMORTIZATION_TABLE_ROW = '[data-testid="amortization-table-row"]';

// Savings spotlight selectors
export const SAVINGS_SPOTLIGHT = '[data-testid="savings-spotlight"]';
export const MONEY_SAVED = '[data-testid="money-saved"]';
export const TIME_SAVED = '[data-testid="time-saved"]';
export const PERCENTAGE_SAVED = '[data-testid="percentage-saved"]';

// Overpayment optimization panel selectors
export const OVERPAYMENT_OPTIMIZATION_PANEL = '[data-testid="overpayment-optimization-panel"]';
export const OPTIMIZE_BUTTON = '[data-testid="optimize-button"]';

// Error message selectors
export const ERROR_MESSAGE = '.error-message';

// Modal selectors
export const MODAL = '[role="dialog"]';
export const MODAL_CLOSE_BUTTON = '[data-testid="modal-close-button"]';
