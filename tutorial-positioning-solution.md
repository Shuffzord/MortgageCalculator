# Tutorial Positioning Solution

## Problem Analysis
- Tutorial window and target field need to be visible together
- Limited viewport height makes perfect centering impractical
- Different field positions require different approaches

## Solution Approaches

### 1. Fixed Tutorial Position
```typescript
// Keep tutorial fixed at top of viewport
const TUTORIAL_FIXED_TOP = 80; // px from top
const FIELD_SCROLL_MARGIN = 200; // px from tutorial bottom

function positionTutorial() {
  // Tutorial stays fixed near top
  return {
    position: 'fixed',
    top: TUTORIAL_FIXED_TOP,
    maxHeight: '250px'
  };
}

function scrollField(targetElement) {
  // Scroll field into view below tutorial
  const fieldTop = targetElement.getBoundingClientRect().top;
  const scrollTarget = window.scrollY + fieldTop - TUTORIAL_FIXED_TOP - FIELD_SCROLL_MARGIN;
  window.scrollTo({
    top: scrollTarget,
    behavior: 'smooth'
  });
}
```

Benefits:
- Tutorial always visible
- Predictable positioning
- Good for form navigation
- Natural reading flow (tutorial -> field)

### 2. Viewport-Ratio Based
```typescript
// Use viewport height to determine positioning
const VIEWPORT_RATIO_THRESHOLD = 0.7; // 70% of viewport height

function determinePosition(viewportHeight, fieldRect) {
  const hasEnoughSpace = viewportHeight > fieldRect.height * VIEWPORT_RATIO_THRESHOLD;
  
  if (hasEnoughSpace) {
    // Fixed position at top when enough space
    return {
      position: 'fixed',
      top: 80
    };
  } else {
    // Position above field when space is limited
    return {
      position: 'absolute',
      top: fieldRect.top - 280 // tutorial height + margin
    };
  }
}
```

Benefits:
- Adapts to available space
- Works with different viewport sizes
- Handles edge cases gracefully

### 3. Smart Scroll Management
```typescript
function calculateScrollPosition(targetElement, tutorialHeight) {
  const rect = targetElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Keep field in lower third of viewport
  const targetPosition = viewportHeight * 0.66;
  const scrollTarget = window.scrollY + rect.top - targetPosition;
  
  return Math.max(0, scrollTarget);
}
```

Benefits:
- Maintains consistent spacing
- Prevents jarring scroll jumps
- Works with dynamic content

## Implementation Plan

1. Start with Fixed Tutorial Position:
- Simplest to implement
- Most predictable behavior
- Good default experience

2. Add Viewport Ratio Check:
- Enhance with adaptive positioning
- Handle different screen sizes
- Maintain readability

3. Improve Scroll Management:
- Smooth transitions
- Prevent position fighting
- Handle edge cases

## Edge Cases to Handle

1. Limited Viewport Height:
- Tutorial may need to overlap field
- Prioritize tutorial visibility
- Ensure field is still accessible

2. Long Form Fields:
- Maintain tutorial visibility during scrolling
- Smooth transitions between fields
- Clear relationship between tutorial and field

3. Dynamic Content:
- Handle content changes
- Maintain positions during updates
- Prevent scroll jumps

## Success Metrics

1. Visibility:
- Tutorial always visible
- Target field visible or easily accessible
- Clear visual connection between both

2. Usability:
- Natural reading flow
- Minimal scroll interference
- Smooth transitions

3. Reliability:
- Consistent positioning
- Handles all viewport sizes
- Works with all field positions