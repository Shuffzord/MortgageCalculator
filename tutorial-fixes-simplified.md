# Simplified Tutorial UI Fixes

## Current Issues
1. Tutorial popup positioning is incorrect
2. Highlighting not working properly
3. Scroll handling too complex

## Simplified Approach

### 1. Positioning Logic
```typescript
function getPositionForTarget(targetId: string, placement: 'top' | 'bottom' | 'left' | 'right'): PositionStyle {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return {};

  const rect = targetElement.getBoundingClientRect();
  const positions: PositionStyle = {};
  const PADDING = 16;
  const TUTORIAL_WIDTH = 400;
  const TUTORIAL_HEIGHT = 200;

  // Simple viewport-relative positioning
  switch (placement) {
    case 'top':
      positions.top = rect.top - TUTORIAL_HEIGHT - PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'bottom':
      positions.top = rect.bottom + PADDING;
      positions.left = rect.left + (rect.width / 2) - (TUTORIAL_WIDTH / 2);
      break;
    case 'left':
      positions.top = rect.top + (rect.height / 2) - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.left - TUTORIAL_WIDTH - PADDING;
      break;
    case 'right':
      positions.top = rect.top + (rect.height / 2) - (TUTORIAL_HEIGHT / 2);
      positions.left = rect.right + PADDING;
      break;
  }

  // Simple viewport bounds check
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (positions.left < PADDING) positions.left = PADDING;
  if (positions.left + TUTORIAL_WIDTH > viewportWidth - PADDING) {
    positions.left = viewportWidth - TUTORIAL_WIDTH - PADDING;
  }
  if (positions.top < PADDING) positions.top = PADDING;
  if (positions.top + TUTORIAL_HEIGHT > viewportHeight - PADDING) {
    positions.top = viewportHeight - TUTORIAL_HEIGHT - PADDING;
  }

  return positions;
}
```

### 2. Simplified CSS
```css
/* Tutorial highlighting */
.tutorial-highlight {
  position: relative !important;
  z-index: 60 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
  border-radius: 0.375rem !important;
  background-color: #ffffff !important;
}

/* Tutorial overlay */
.tutorial-overlay {
  pointer-events: none !important;
}

.tutorial-overlay > * {
  pointer-events: auto !important;
}

/* Tutorial popup */
.tutorial-popup {
  position: fixed !important;
  z-index: 100 !important;
  background: white !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}
```

### 3. Simple Scroll Logic
```typescript
// In useEffect when target changes
if (targetElement) {
  targetElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}
```

## Implementation Steps
1. Remove all container-relative positioning
2. Simplify CSS to basic highlight and fixed positioning
3. Use simple viewport-relative coordinates
4. Keep basic scroll-into-view behavior
5. Remove complex fallback strategies

## Benefits
- More predictable positioning
- Simpler scroll handling
- Better reliability
- Easier to maintain