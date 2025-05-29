import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TutorialState {
  isActive: boolean
  currentStep: number
  completedSteps: number[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null
  hasCompletedTutorial: boolean
  
  // Actions
  startTutorial: () => void
  completeStep: (step: number) => void
  setExperienceLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void
  completeTutorial: () => void
  abandonTutorial: () => void
  resetTutorial: () => void
}

const initialState = {
  isActive: false as boolean,
  currentStep: 0,
  completedSteps: [] as number[],
  experienceLevel: null as 'beginner' | 'intermediate' | 'advanced' | null,
  hasCompletedTutorial: false as boolean,
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      ...initialState,

      startTutorial: () => {
        console.log('[TutorialState] Starting tutorial', { timestamp: new Date().toISOString() });
        set({ isActive: true, currentStep: 0 });
      },
      
      completeStep: (step: number) => {
        console.log('[TutorialState] Completing step', {
          step,
          timestamp: new Date().toISOString()
        });
        set((state: TutorialState) => {
          const newState = {
            completedSteps: Array.from(new Set([...state.completedSteps, step])),
            currentStep: step + 1
          };
          console.log('[TutorialState] Updated state after step completion', newState);
          return newState;
        });
      },

      setExperienceLevel: (level: 'beginner' | 'intermediate' | 'advanced') => {
        console.log('[TutorialState] Setting experience level', {
          level,
          timestamp: new Date().toISOString()
        });
        set({ experienceLevel: level });
      },

      completeTutorial: () => 
        set({ 
          hasCompletedTutorial: true,
          isActive: false 
        }),

      abandonTutorial: () => 
        set({ 
          isActive: false,
          currentStep: 0
        }),

      resetTutorial: () => 
        set({
          isActive: false,
          currentStep: 0,
          completedSteps: [],
          experienceLevel: null,
          hasCompletedTutorial: false
        })
    }),
    {
      name: 'tutorial-storage'
    }
  )
)