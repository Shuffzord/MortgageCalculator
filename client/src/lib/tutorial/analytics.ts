interface TutorialEvent {
  eventName: string;
  stepNumber?: number;
  experienceLevel?: string;
  sectionId?: string;
  contentId?: string;
  timestamp: number;
}

class TutorialAnalytics {
  private events: TutorialEvent[] = []

  private logEvent(event: TutorialEvent) {
    this.events.push(event)
    // In a real implementation, this would send to an analytics service
    //TODO:
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

  interactiveExampleCompleted(sectionId: string) {
    this.logEvent({
      eventName: 'interactive_example_completed',
      sectionId,
      timestamp: Date.now()
    });
  }

  educationalContentViewed(contentId: string) {
    this.logEvent({
      eventName: 'educational_content_viewed',
      contentId,
      timestamp: Date.now()
    });
  }

  getEvents(): TutorialEvent[] {
    return this.events;
  }
}

export const tutorialAnalytics = new TutorialAnalytics()