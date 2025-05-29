# Tutorial Positioning Fixes

## Current Issues
1. Tutorial popup appears too high and overlaps with form fields above
2. "Top" placement doesn't properly consider field height
3. Positioning uses absolute viewport coordinates without considering container boundaries

## Proposed Solutions

### 1. Improve Position Calculation
```typescript
// Calculate container-relative coordinates
const containerRect = targetElement.closest('.form-container').getBoundingClientRect();
const fieldRect = targetElement.getBoundingClientRect();
const relativeTop = fieldRect.top - containerRect.top;
const relativeBottom = fieldRect.bottom - containerRect.top;
```

### 2. Smart Placement Logic
- For "top" placement:
  ```typescript
  positions.top = relativeTop - TUTORIAL_HEIGHT - PADDING;
  positions.left = fieldRect.left + (fieldRect.width / 2) - (TUTORIAL_WIDTH / 2);
  ```
- Add container bounds checking:
  ```typescript
  const containerHeight = containerRect.height;
  const maxTop = containerHeight - TUTORIAL_HEIGHT - PADDING;
  positions.top = Math.max(PADDING, Math.min(positions.top, maxTop));
  ```

### 3. Viewport-Aware Positioning
- Check if target field is in viewport
- If not, scroll container to bring field into view
- Add padding to ensure both field and popup are visible
- Consider container scroll position when calculating coordinates

### 4. Fallback Strategy
1. Try preferred placement first (e.g., "top")
2. If popup would overflow container:
   - Try opposite placement (e.g., "bottom")
   - If still no fit, try side placements ("left"/"right")
   - Last resort: center in viewport with max-width/height

### Implementation Steps
1. Update getPositionForTarget function with container-relative positioning
2. Add container bounds checking
3. Implement smart fallback strategy
4. Add scroll handling for off-screen targets
5. Add debug logging for positioning decisions

## Code Mode Tasks
1. Modify TutorialOverlay.tsx to use container-relative positioning
2. Update position calculation logic
3. Add container bounds checking
4. Implement fallback strategy
5. Add scroll handling