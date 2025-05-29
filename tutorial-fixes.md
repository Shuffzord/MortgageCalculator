# Tutorial UI Issues Analysis & Solution Plan

## Current Issues

### 1. Missing Element IDs
The tutorial is trying to target elements with specific IDs that don't exist in the calculator form:

- '#principal-input'
- '#interest-rate-input'
- '#loan-term-input'
- '#repayment-model-selector'

These IDs need to be added to the corresponding form elements in calculator-form.tsx.

### 2. Positioning Calculation Issues
In TutorialOverlay.tsx's getPositionForTarget() function, there are several calculation problems:

- For 'top' placement:
  ```typescript
  positions.bottom = Math.min(
    window.innerHeight - rect.top + 10, // Adding 10px pushes it down incorrectly
    window.innerHeight - TUTORIAL_HEIGHT - PADDING
  );
  ```

- For 'left' placement:
  ```typescript
  positions.right = Math.min(
    window.innerWidth - rect.left + 10, // Adding 10px pushes it right incorrectly
    window.innerWidth - TUTORIAL_WIDTH - PADDING
  );
  ```

- For 'bottom' placement, the centering calculation has an offset issue:
  ```typescript
  positions.left = Math.min(
    Math.max(rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2), PADDING),
    window.innerWidth - TUTORIAL_WIDTH - PADDING
  );
  ```

## Solution Plan

### 1. Add Missing IDs
Update calculator-form.tsx to add the required IDs:

```tsx
<Input
  id="principal-input"
  type="number"
  placeholder="0.00"
  min={1000}
  className="pl-7"
  {...field}
/>

// Add similar IDs for other inputs
```

### 2. Fix Positioning Calculations
Update getPositionForTarget() in TutorialOverlay.tsx:

```typescript
function getPositionForTarget(targetId: string, placement: Placement = 'bottom'): PositionStyle {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return {};

  const rect = targetElement.getBoundingClientRect();
  const positions: PositionStyle = {};
  const PADDING = 16;
  const TUTORIAL_WIDTH = 350;
  const TUTORIAL_HEIGHT = 200; // Reduced height for better positioning

  switch (placement) {
    case 'top':
      positions.bottom = window.innerHeight - rect.top + PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'bottom':
      positions.top = rect.bottom + PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'left':
      positions.right = window.innerWidth - rect.left + PADDING;
      positions.top = rect.top + (rect.height / 2) - (TUTORIAL_HEIGHT / 2);
      break;
    case 'right':
      positions.left = rect.right + PADDING;
      positions.top = rect.top + (rect.height / 2) - (TUTORIAL_HEIGHT / 2);
      break;
  }

  // Ensure positions stay within viewport bounds
  if (positions.left !== undefined) {
    positions.left = Math.max(PADDING, Math.min(positions.left, window.innerWidth - TUTORIAL_WIDTH - PADDING));
  }
  if (positions.right !== undefined) {
    positions.right = Math.max(PADDING, Math.min(positions.right, window.innerWidth - TUTORIAL_WIDTH - PADDING));
  }
  if (positions.top !== undefined) {
    positions.top = Math.max(PADDING, Math.min(positions.top, window.innerHeight - TUTORIAL_HEIGHT - PADDING));
  }
  if (positions.bottom !== undefined) {
    positions.bottom = Math.max(PADDING, Math.min(positions.bottom, window.innerHeight - TUTORIAL_HEIGHT - PADDING));
  }

  return positions;
}
```

### 3. Implementation Steps

1. Switch to Code mode
2. Update calculator-form.tsx to add missing IDs
3. Update TutorialOverlay.tsx with fixed positioning calculations
4. Test the tutorial flow to verify:
   - Elements are properly highlighted
   - Tutorial steps are correctly positioned
   - Z-index layering works as expected