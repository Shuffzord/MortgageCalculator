# Tutorial Testing Strategy

## Key Components

### Analytics
The tutorial analytics module:
- Tracks user interaction events during the tutorial flow
- Stores events in memory for testing
- Would send to an analytics service in production

### Store
The tutorial store manages:
- Current step number
- Completed steps
- Tutorial active state
- Experience level

## Testing Approach

### Store State Management
- Use a shared mock store factory for consistency
- Reset store state before each test
- Configure store state to match test scenarios
- Ensure store state matches expected analytics events

```typescript
// Create mock store with default state
const createMockStore = (overrides = {}) => ({
  currentStep: 0,
  completedSteps: [],
  isActive: true,
  hasCompletedTutorial: false,
  experienceLevel: 'beginner',
  startTutorial: jest.fn(),
  completeTutorial: jest.fn(),
  abandonTutorial: jest.fn(),
  completeStep: jest.fn(),
  setExperienceLevel: jest.fn(),
  resetTutorial: jest.fn(),
  ...overrides
});

// Reset store before each test
beforeEach(() => {
  jest.spyOn(useTutorialStore, 'getState')
    .mockReturnValue(createMockStore());
});

// Configure store for specific test
const mockStore = createMockStore({
  currentStep: 2,
  completedSteps: [0, 1],
});
jest.spyOn(useTutorialStore, 'getState')
  .mockReturnValue(mockStore);
```

### Analytics Verification
- Clear analytics events before each test
- Trigger user actions through component interactions
- Verify events match expected state changes

```typescript
beforeEach(() => {
  tutorialAnalytics.getEvents().length = 0;
});

it('tracks step completion', () => {
  // Set up store state
  const mockStore = createMockStore({
    currentStep: 0,
    completedSteps: [],
  });
  jest.spyOn(useTutorialStore, 'getState')
    .mockReturnValue(mockStore);

  render(<TutorialOverlay {...props} />);

  // Trigger user action
  screen.getByText('Complete Step').click();

  // Verify analytics event
  const events = tutorialAnalytics.getEvents();
  expect(events).toContainEqual(expect.objectContaining({
    eventName: 'step_completed',
    stepNumber: 0
  }));
});
```

## Best Practices

1. **State Setup**
   - Always set up store state before rendering components
   - Make state setup explicit in each test
   - Use factory functions for consistent state creation

2. **Event Verification**
   - Clear events before each test
   - Verify complete event objects
   - Check event ordering when relevant

3. **User Interaction**
   - Simulate real user actions
   - Use screen queries to find elements
   - Trigger events through component interfaces

4. **Isolation**
   - Reset all state between tests
   - Mock external dependencies
   - Test one behavior per test case

## Common Patterns

### Testing Step Completion
```typescript
it('tracks step completion', () => {
  const mockStore = createMockStore({
    currentStep: 0,
    completedSteps: [],
  });
  
  render(<TutorialOverlay {...props} />);
  screen.getByText('Complete Step').click();
  
  expect(events).toContainEqual({
    eventName: 'step_completed',
    stepNumber: 0
  });
});
```

### Testing Tutorial Completion
```typescript
it('handles tutorial completion', () => {
  const mockStore = createMockStore({
    currentStep: 2,
    completedSteps: [0, 1],
  });
  
  render(<TutorialOverlay {...props} />);
  screen.getByText('Complete Step').click();
  
  expect(events).toContainEqual({
    eventName: 'tutorial_completed',
    experienceLevel: 'beginner'
  });
});
```

### Testing Tutorial Abandonment
```typescript
it('handles tutorial skip', () => {
  const mockStore = createMockStore({
    currentStep: 0,
    completedSteps: [],
  });
  
  render(<TutorialOverlay {...props} />);
  screen.getByText('Skip Tutorial').click();
  
  expect(events).toContainEqual({
    eventName: 'tutorial_abandoned',
    stepNumber: 0,
    experienceLevel: 'beginner'
  });
});