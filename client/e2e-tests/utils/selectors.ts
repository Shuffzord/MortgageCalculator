/**
 * Selectors for UI Testing
 * 
 * This file contains all the CSS selectors used in the tests.
 * Centralizing selectors makes it easier to maintain tests when the UI changes.
 */

// Main application selectors
export const APP_CONTAINER = '#root';
export const PAGE_TITLE = 'title';
// Import shared selectors
import { SELECTORS } from '../../src/test-utils/selectors';

// Navigation selectors
export const NAVIGATION = 'nav';
export const LANGUAGE_SWITCHER = '[data-testid="language-switcher"]';

// Loan Input Form selectors
export const LOAN_INPUT_FORM = '[data-testid="loan-input-form"]';
export const LOAN_AMOUNT_INPUT = '[data-testid="loan-amount-input"]';
export const INTEREST_RATE_INPUT = '[data-testid="interest-rate-input"]';
export const LOAN_TERM_INPUT = '[data-testid="loan-term-input"]';
export const REPAYMENT_MODEL_SELECT = '[data-testid="repayment-model-select"]';
export const LOAN_START_DATE_INPUT = '[data-testid="loan-start-date-input"]';
export const CALCULATE_BUTTON = '[data-testid="calculate-button"]';
export const ADD_INTEREST_RATE_PERIOD_BUTTON = '[data-testid="add-interest-rate-period-button"]';
export const ADD_OVERPAYMENT_BUTTON = '[data-testid="add-overpayment-button"]';

// Interest rate period selectors
export const INTEREST_RATE_DATE_RANGE = '[data-testid^="interest-rate-date-range"]';
export const INTEREST_RATE_END_DATE = '[data-testid="interest-rate-end-date"]';
export const INTEREST_RATE_INPUT_ADDITIONAL = (index: number) => `[data-testid="interest-rate-input-${index}"]`;

// Currency selectors
export const CURRENCY_SYMBOL = '[data-testid="currency-symbol"]';
export const CURRENCY_SELECTOR = '[data-testid="currency-selector"]';

// Loan Summary selectors
export const LOAN_SUMMARY = '[data-testid="loan-summary"]';
export const MONTHLY_PAYMENT = '[data-testid="monthly-payment"]';
export const TOTAL_INTEREST = '[data-testid="total-interest"]';
export const TOTAL_COST = '[data-testid="total-cost"]';
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
export const VALIDATION_ERROR = '.validation-error';

// Modal selectors
export const MODAL = '[role="dialog"]';
export const MODAL_CLOSE_BUTTON = '[data-testid="modal-close-button"]';

// Calendar selectors
export const CALENDAR_CONTAINER = '[data-testid="calendar-container"]';
export const CALENDAR_DAY_BUTTON = 'button[name="day"]';
export const CALENDAR_DAY_BUTTON_ENABLED = 'button[name="day"]:not([disabled])';
export const CALENDAR_PREVIOUS_YEAR_BUTTON = '[data-testid="previous-year-button"]';
export const CALENDAR_NEXT_YEAR_BUTTON = '[data-testid="next-year-button"]';
