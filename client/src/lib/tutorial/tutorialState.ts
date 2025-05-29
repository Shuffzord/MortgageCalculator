import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TutorialSection {
  id: string;
  completed: boolean;
  interactiveExampleCompleted?: boolean;
  educationalContentViewed?: string[];
}

interface TutorialProgress {
  completedSections: TutorialSection[];
  currentSectionId: string | null;
}

interface TutorialState {
  // State
  isActive: boolean;
  currentStep: number;
  completedSteps: number[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  hasCompletedTutorial: boolean;
  
  // Enhanced state for multi-level system
  progress: {
    beginner: TutorialProgress;
    intermediate: TutorialProgress;
    advanced: TutorialProgress;
  };
  activeInteractiveExample: string | null;
  lastEducationalContent: string | null;

  // Actions
  startTutorial: () => void;
  completeStep: (step: number) => void;
  setExperienceLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  completeTutorial: () => void;
  abandonTutorial: () => void;
  resetTutorial: () => void;
  
  // New actions for enhanced functionality
  completeSection: (sectionId: string) => void;
  completeInteractiveExample: (sectionId: string) => void;
  viewEducationalContent: (contentId: string) => void;
  setActiveInteractiveExample: (exampleId: string | null) => void;
  
  // Debug utilities
  getDebugState: () => string;
  validateState: () => boolean;
}

// Validation helper
const validateTutorialState = (state: Partial<TutorialState>): boolean => {
  // Check required fields exist
  if (typeof state.isActive !== 'boolean' ||
      typeof state.currentStep !== 'number' ||
      !Array.isArray(state.completedSteps) ||
      typeof state.hasCompletedTutorial !== 'boolean') {
    console.error('[Tutorial] Invalid state structure:', state);
    return false;
  }

  // Validate experience level
  const validLevels = ['beginner', 'intermediate', 'advanced'] as const;
  if (state.experienceLevel !== null &&
      !validLevels.includes(state.experienceLevel as typeof validLevels[number])) {
    console.error('[Tutorial] Invalid experience level:', state.experienceLevel);
    return false;
  }

  // Validate step consistency
  const currentStep = state.currentStep as number;
  if (currentStep < 0 ||
      state.completedSteps.some(step => step < 0) ||
      (!state.hasCompletedTutorial && state.completedSteps.some(step => step >= currentStep))) {
    console.error('[Tutorial] Invalid step configuration:', {
      current: currentStep,
      completed: state.completedSteps
    });
    return false;
  }

  // Validate progress structure
  if (state.progress) {
    const levels = ['beginner', 'intermediate', 'advanced'] as const;
    for (const level of levels) {
      const progress = state.progress[level];
      if (!progress || !Array.isArray(progress.completedSections)) {
        console.error(`[Tutorial] Invalid progress for level ${level}:`, progress);
        return false;
      }
    }
  }

  return true;
}

// Initial progress state
const createInitialProgress = (): TutorialProgress => ({
  completedSections: [],
  currentSectionId: null
});

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      experienceLevel: null,
      hasCompletedTutorial: false,
      progress: {
        beginner: createInitialProgress(),
        intermediate: createInitialProgress(),
        advanced: createInitialProgress()
      },
      activeInteractiveExample: null,
      lastEducationalContent: null,

      // Actions
      startTutorial: () => {
        console.log('[Tutorial] Starting tutorial');
        set({
          isActive: true,
          currentStep: 0,
          completedSteps: [],
          hasCompletedTutorial: false
        });
      },

      completeStep: (step: number) => {
        console.log('[Tutorial] Completing step:', step);
        set((state) => ({
          completedSteps: [...state.completedSteps, step],
          currentStep: step + 1
        }));
      },

      setExperienceLevel: (level: 'beginner' | 'intermediate' | 'advanced') => {
        console.log('[Tutorial] Setting level:', level);
        
        // Reset state when switching to beginner mode
        if (level === 'beginner') {
          set({
            experienceLevel: level,
            isActive: true,
            currentStep: 0,
            completedSteps: [],
            hasCompletedTutorial: false
          });
        } else {
          set({ experienceLevel: level });
        }
      },

      completeTutorial: () => {
        console.log('[Tutorial] Completing tutorial');
        set({ hasCompletedTutorial: true, isActive: false });
      },

      abandonTutorial: () => {
        console.log('[Tutorial] Abandoning tutorial');
        set({
          isActive: false,
          currentStep: 0,
          hasCompletedTutorial: true
        });
      },

      resetTutorial: () => {
        console.log('[Tutorial] Resetting tutorial state');
        localStorage.removeItem('tutorial-storage');
        set({
          isActive: false,
          currentStep: 0,
          completedSteps: [],
          experienceLevel: null,
          hasCompletedTutorial: false,
          progress: {
            beginner: createInitialProgress(),
            intermediate: createInitialProgress(),
            advanced: createInitialProgress()
          },
          activeInteractiveExample: null,
          lastEducationalContent: null
        });
      },

      // New action implementations
      completeSection: (sectionId: string) => {
        console.log('[Tutorial] Completing section:', sectionId);
        set((state) => {
          const level = state.experienceLevel;
          if (!level) return state;

          const progress = state.progress[level];
          const updatedSections = [...progress.completedSections];
          const sectionIndex = updatedSections.findIndex(s => s.id === sectionId);

          if (sectionIndex >= 0) {
            updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], completed: true };
          } else {
            updatedSections.push({ id: sectionId, completed: true });
          }

          return {
            progress: {
              ...state.progress,
              [level]: {
                ...progress,
                completedSections: updatedSections
              }
            }
          };
        });
      },

      completeInteractiveExample: (sectionId: string) => {
        console.log('[Tutorial] Completing interactive example for section:', sectionId);
        set((state) => {
          const level = state.experienceLevel;
          if (!level) return state;

          const progress = state.progress[level];
          const updatedSections = [...progress.completedSections];
          const sectionIndex = updatedSections.findIndex(s => s.id === sectionId);

          if (sectionIndex >= 0) {
            updatedSections[sectionIndex] = {
              ...updatedSections[sectionIndex],
              interactiveExampleCompleted: true
            };
          }

          return {
            progress: {
              ...state.progress,
              [level]: {
                ...progress,
                completedSections: updatedSections
              }
            }
          };
        });
      },

      viewEducationalContent: (contentId: string) => {
        console.log('[Tutorial] Viewing educational content:', contentId);
        set((state) => {
          const level = state.experienceLevel;
          if (!level) return state;

          const progress = state.progress[level];
          const currentSection = progress.currentSectionId;
          if (!currentSection) return state;

          const updatedSections = [...progress.completedSections];
          const sectionIndex = updatedSections.findIndex(s => s.id === currentSection);

          if (sectionIndex >= 0) {
            const section = updatedSections[sectionIndex];
            const viewedContent = section.educationalContentViewed || [];
            if (!viewedContent.includes(contentId)) {
              updatedSections[sectionIndex] = {
                ...section,
                educationalContentViewed: [...viewedContent, contentId]
              };
            }
          }

          return {
            progress: {
              ...state.progress,
              [level]: {
                ...progress,
                completedSections: updatedSections
              }
            },
            lastEducationalContent: contentId
          };
        });
      },

      setActiveInteractiveExample: (exampleId: string | null) => {
        console.log('[Tutorial] Setting active interactive example:', exampleId);
        set({ activeInteractiveExample: exampleId });
      },

      // Debug utilities
      getDebugState: () => {
        const state = get();
        return JSON.stringify({
          isActive: state.isActive,
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          experienceLevel: state.experienceLevel,
          hasCompletedTutorial: state.hasCompletedTutorial
        }, null, 2);
      },

      validateState: () => {
        return validateTutorialState(get());
      }
    }),
    {
      name: 'tutorial-storage',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Validate state on rehydration
        if (state && !validateTutorialState(state)) {
          console.error('[Tutorial] Invalid state detected on rehydration, resetting...');
          localStorage.removeItem('tutorial-storage');
          return {
            isActive: false,
            currentStep: 0,
            completedSteps: [],
            experienceLevel: null,
            hasCompletedTutorial: false
          };
        }
        console.log('[Tutorial] State rehydrated successfully');
      }
    }
  )
)