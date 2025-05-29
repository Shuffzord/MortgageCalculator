# Tutorial UI Issues - Root Cause Analysis

## 1. Missing Element IDs
The tutorial is trying to target elements with specific IDs, but the form is using data-testid attributes instead:

Current in LoanInputForm.tsx:
```tsx
<Input
  data-testid="loan-amount-input"
  // Missing: id="principal-input"
/>

<Input
  data-testid="loan-term-input"
  // Missing: id="loan-term-input"
/>

<select
  data-testid="repayment-model-select"
  // Missing: id="repayment-model-selector"
/>
```

## 2. CSS Positioning Issues
The form uses shadcn/ui components which have their own positioning context:

```tsx
<FormControl>
  <div className="relative">
    <Input />
  </div>
</FormControl>
```

This creates multiple stacking contexts that can interfere with the tutorial highlight positioning.

## Solution Plan

1. Add Missing IDs:
```tsx
// In LoanInputForm.tsx
<Input
  id="principal-input"
  data-testid="loan-amount-input"
/>

<Input
  id="loan-term-input"
  data-testid="loan-term-input"
/>

<select
  id="repayment-model-selector"
  data-testid="repayment-model-select"
/>
```

2. Fix CSS Stacking Context:
```css
/* In index.css */
.tutorial-highlight {
  position: relative;
  z-index: 60;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
  border-radius: 0.375rem;
  transition: all 0.2s ease-in-out;
}

/* Add new rule to handle shadcn form controls */
.tutorial-highlight .relative {
  z-index: inherit;
}

/* Ensure form controls don't create new stacking contexts */
.form-control {
  isolation: isolate;
}
```

3. Implementation Steps:
   1. Add IDs to form inputs in LoanInputForm.tsx
   2. Update CSS to handle shadcn form control stacking contexts
   3. Test tutorial highlighting with each form element
   4. Verify positioning works with the form's layout

This solution addresses both the missing IDs and the CSS stacking context issues that are preventing proper highlighting and positioning.