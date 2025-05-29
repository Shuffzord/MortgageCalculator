# Tutorial Integration Plan

## 1. Update Home Component

The tutorial should be integrated into the Home component with the following components:

```tsx
// Add imports
import { ExperienceLevelAssessment } from '@/components/ExperienceLevelAssessment';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { useTutorialStore } from '@/lib/tutorial/tutorialState';

// Add to Home component state
const tutorialStore = useTutorialStore();
const [showExperienceModal, setShowExperienceModal] = useState(!tutorialStore.experienceLevel);

// Add to JSX at the end of the Home component return statement
{!tutorialStore.hasCompletedTutorial && (
  <>
    <ExperienceLevelAssessment
      isOpen={showExperienceModal}
      onClose={() => setShowExperienceModal(false)}
      onExperienceLevelSet={(level) => {
        setShowExperienceModal(false);
        tutorialStore.setExperienceLevel(level);
        tutorialStore.startTutorial();
      }}
    />
    <TutorialOverlay
      isActive={tutorialStore.isActive}
      experienceLevel={tutorialStore.experienceLevel}
      onComplete={() => tutorialStore.completeTutorial()}
      onSkip={() => tutorialStore.abandonTutorial()}
    />
  </>
)}
```

## 2. Tutorial Flow

1. When user first visits the page:
   - ExperienceLevelAssessment modal opens automatically
   - User selects their experience level
   - Modal closes and tutorial starts

2. During tutorial:
   - TutorialOverlay guides user through steps
   - Steps adapt based on experience level
   - Progress is saved in localStorage

3. Tutorial completion:
   - User can complete all steps or skip
   - State is persisted for future visits
   - Tutorial won't show again after completion

## 3. Implementation Steps

1. Update Home.tsx with tutorial components
2. Test the tutorial flow:
   - First visit experience
   - Tutorial step progression
   - State persistence
   - Completion handling

## 4. Testing

Manual test cases:
1. First visit shows experience level modal
2. Selecting level starts appropriate tutorial
3. Tutorial steps work correctly
4. Progress saves between refreshes
5. Completed tutorial doesn't show again
6. Skip functionality works

## Next Steps

1. Switch to Code mode to implement these changes
2. Test the integration
3. Verify the tutorial flow works as expected