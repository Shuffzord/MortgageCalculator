interface TutorialEvent {
  eventName: string
  stepNumber?: number
  experienceLevel?: string
  timestamp: number
}

class TutorialAnalytics {
  private events: TutorialEvent[] = []

  private logEvent(event: TutorialEvent) {
    this.events.push(event)
    // In a real implementation, this would send to an analytics service
    console.log('Tutorial Event:', event)
  }

  tutorialStarted(experienceLevel?: string) {
    this.logEvent({
      eventName: 'tutorial_started',
      experienceLevel,
      timestamp: Date.now()
    })
  }

  stepCompleted(stepNumber: number) {
    this.logEvent({
      eventName: 'step_completed',
      stepNumber,
      timestamp: Date.now()
    })
  }

  tutorialCompleted(experienceLevel?: string) {
    this.logEvent({
      eventName: 'tutorial_completed',
      experienceLevel,
      timestamp: Date.now()
    })
  }

  tutorialAbandoned(stepNumber: number, experienceLevel?: string) {
    this.logEvent({
      eventName: 'tutorial_abandoned',
      stepNumber,
      experienceLevel,
      timestamp: Date.now()
    })
  }

  experienceLevelChanged(level: string) {
    this.logEvent({
      eventName: 'experience_level_changed',
      experienceLevel: level,
      timestamp: Date.now()
    })
  }

  getEvents(): TutorialEvent[] {
    return this.events
  }
}

export const tutorialAnalytics = new TutorialAnalytics()