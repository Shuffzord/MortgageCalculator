export const SELECTORS = {
  LOAN_AMOUNT_INPUT: '[data-testid="loan-amount-input"]',
  INTEREST_RATE_INPUT: '[data-testid="interest-rate-input"]',
  LOAN_TERM_INPUT: '[data-testid="loan-term-input"]',
  REPAYMENT_MODEL_SELECT: '[data-testid="repayment-model-select"]',
  CALCULATE_BUTTON: '[data-testid="calculate-button"]',
  LOAN_SUMMARY: '[data-testid="loan-summary"]',
  MONTHLY_PAYMENT: '[data-testid="monthly-payment"]',
  TOTAL_INTEREST: '[data-testid="total-interest"]',
  TOTAL_COST: '[data-testid="total-cost"]',
  VALIDATION_ERROR: '.validation-error',
  
  // Calendar selectors
  LOAN_START_DATE_BUTTON: '[data-testid="loan-start-date-button"]',
  CALENDAR_COMPONENT: '[data-testid="calendar-container"]',
  CALENDAR_PREVIOUS_YEAR_BUTTON: '[data-testid="previous-year-button"]',
  CALENDAR_NEXT_YEAR_BUTTON: '[data-testid="next-year-button"]',
  CALENDAR_DAY_BUTTON: 'button[name="day"]',
  CALENDAR_DAY_BUTTON_ENABLED: 'button[name="day"]:not([disabled])'
};