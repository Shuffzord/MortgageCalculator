import '../utils/setup-puppeteer';
import { LoanForm } from '../page-objects/LoanForm';
import { injectAxe, runAccessibilityAudit } from '../utils/accessibility';

describe('Accessibility Tests', () => {
  const loanForm = new LoanForm();
  
  beforeAll(async () => {
    await loanForm.navigate();
    await injectAxe();
  });
  
  test('loan form should be accessible', async () => {
    const results = await runAccessibilityAudit();
    
    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations:', results.violations);
    }
    
    // Expect no violations
    expect(results.violations.length).toBe(0);
  });
});