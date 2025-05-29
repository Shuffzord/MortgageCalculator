# Mortgage Calculator Tutorial Implementation Plan

[Previous content remains unchanged...]

## Immediate Bug Fixes and Improvements

### 1. Clippy Image and Animation
- Current issue: Clippy image lacks transparent background
- Required changes:
  ```css
  .clippy-button {
    animation: bounce 1s infinite;
    background: transparent;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  ```
- Implementation: Create styled component for Clippy with animation

### 2. Field Highlighting
- Current issue: Tutorial fields not highlighted when explained
- Required changes:
  ```css
  .tutorial-target {
    outline: 2px solid #007bff;
    box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
    z-index: 1;
  }
  ```
- Implementation: Add highlight class to target elements during tutorial

### 3. Tutorial Window Positioning
- Current issue: Tutorial window stuck to left side
- Required changes:
  - Adjust PADDING constant in getPositionForTarget
  - Update positioning logic to stay closer to fields
  - Consider dynamic positioning based on viewport size

### 4. Missing Translations
- Add new entries to translation.json:
  ```json
  {
    "tutorial": {
      "welcome": {
        "title": "Welcome to the Mortgage Calculator",
        "description": "Let's personalize your experience"
      },
      "progress": {
        "step": "Step {{current}}/{{total}}"
      }
    }
  }
  ```

### Implementation Steps

1. Update Clippy Component
   - Create new styled component
   - Add bounce animation
   - Ensure transparent background

2. Enhance Field Highlighting
   - Add highlight styles
   - Implement target element focus
   - Add transition effects

3. Fix Tutorial Positioning
   - Reduce PADDING constant
   - Update position calculation
   - Add responsive adjustments

4. Update Translations
   - Add missing entries
   - Update step number format
   - Test in multiple languages

### Testing Checklist

1. Clippy Animation
   - [ ] Transparent background
   - [ ] Smooth bounce animation
   - [ ] Proper sizing and positioning

2. Field Highlighting
   - [ ] Correct fields highlighted
   - [ ] Highlight visible and clear
   - [ ] Smooth transitions

3. Tutorial Window
   - [ ] Proper positioning near fields
   - [ ] No overlap with content
   - [ ] Responsive on different screens

4. Translations
   - [ ] All strings translated
   - [ ] Correct step numbering
   - [ ] Proper formatting
