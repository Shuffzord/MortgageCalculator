# Tutorial Mobile and Logging Fixes

## 1. Mobile Tutorial Handling

### Current Issues
- Tutorial starts on mobile despite mobile warning
- Clippy shows on mobile
- Poor experience on small screens

### Solution
```typescript
// In HomePage.tsx
import { useMobile } from '@/hooks/use-mobile';

// Add mobile check
const isMobile = useMobile();

// Update tutorial section
{experienceLevel === 'beginner' && !hasCompletedTutorial && !isMobile && (
  <TutorialOverlay
    isActive={isActive}
    experienceLevel="beginner"
    onComplete={() => {
      console.log('[HomePage] Tutorial completed');
      completeTutorial();
    }}
    onSkip={() => {
      console.log('[HomePage] Tutorial skipped');
      abandonTutorial();
      completeTutorial();
    }}
  />
)}

// Update Clippy section
{!isMobile && (
  <Clippy
    onClick={() => {
      resetTutorial();
      setShowExperienceModal(true);
    }}
    isAnimated={!hasCompletedTutorial}
  />
)}
```

### Implementation Steps
1. Use mobile hook to detect screen size
2. Add mobile check for tutorial overlay
3. Add mobile check for Clippy
4. Update experience modal to handle mobile case

## 2. Amortization Schedule Logging

### Current Issues
- Unclear calculation process
- Hard to debug issues
- Missing key data points

### Solution
```typescript
// In calculationService.ts
function calculateAmortizationSchedule(loanDetails: LoanDetails): YearlyData[] {
  console.log('[AmortizationSchedule] Starting calculation:', {
    principal: loanDetails.principal,
    interestRate: loanDetails.interestRatePeriods[0].interestRate,
    loanTerm: loanDetails.loanTerm,
    overpayments: loanDetails.overpaymentPlans
  });

  const yearlyData: YearlyData[] = [];
  let remainingBalance = loanDetails.principal;
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (let year = 1; year <= loanDetails.loanTerm; year++) {
    const yearStart = remainingBalance;
    let yearlyPayment = 0;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    // Log yearly calculation start
    console.log(`[AmortizationSchedule] Year ${year} calculation:`, {
      yearStart,
      remainingBalance,
      totalInterestSoFar: totalInterest,
      totalPrincipalSoFar: totalPrincipal
    });

    // Calculate monthly payments
    for (let month = 1; month <= 12; month++) {
      const monthlyInterest = (remainingBalance * loanDetails.interestRatePeriods[0].interestRate) / 1200;
      const monthlyPrincipal = monthlyPayment - monthlyInterest;

      yearlyInterest += monthlyInterest;
      yearlyPrincipal += monthlyPrincipal;
      yearlyPayment += monthlyPayment;
      remainingBalance -= monthlyPrincipal;

      // Log monthly details for debugging
      console.log(`[AmortizationSchedule] Month ${month}:`, {
        monthlyPayment,
        monthlyPrincipal,
        monthlyInterest,
        remainingBalance
      });
    }

    // Log yearly summary
    console.log(`[AmortizationSchedule] Year ${year} summary:`, {
      yearlyPayment,
      yearlyPrincipal,
      yearlyInterest,
      remainingBalance,
      reduction: yearStart - remainingBalance
    });

    yearlyData.push({
      year,
      payment: yearlyPayment,
      principal: yearlyPrincipal,
      interest: yearlyInterest,
      balance: remainingBalance
    });

    totalInterest += yearlyInterest;
    totalPrincipal += yearlyPrincipal;
  }

  // Log final results
  console.log('[AmortizationSchedule] Calculation complete:', {
    totalYears: yearlyData.length,
    finalBalance: remainingBalance,
    totalInterest,
    totalPrincipal,
    totalPaid: totalPrincipal + totalInterest
  });

  return yearlyData;
}
```

### Implementation Steps
1. Add detailed logging to calculation service
2. Track key values throughout calculation
3. Add summary logging for debugging
4. Include overpayment impact tracking

## Next Steps
1. Implement mobile handling in HomePage.tsx
2. Add logging to calculation service
3. Test on various screen sizes
4. Verify calculation logs