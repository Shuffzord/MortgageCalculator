import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTutorialStore } from '../lib/tutorial/tutorialState';
import { tutorialAnalytics } from '../lib/tutorial/analytics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface ExperienceLevelAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onExperienceLevelSet: (level: ExperienceLevel) => void;
}

export function ExperienceLevelAssessment({
  isOpen,
  onClose,
  onExperienceLevelSet,
}: ExperienceLevelAssessmentProps) {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('beginner');

  const handleSubmit = () => {
    useTutorialStore.getState().setExperienceLevel(selectedLevel);
    tutorialAnalytics.experienceLevelChanged(selectedLevel);
    onExperienceLevelSet(selectedLevel);
    onClose();
  };

  const handleSkip = () => {
    tutorialAnalytics.tutorialAbandoned(0, 'not_selected');
    useTutorialStore.getState().abandonTutorial();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tutorial.welcome.title')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedLevel}
            onValueChange={(value) => setSelectedLevel(value as ExperienceLevel)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner">{t('tutorial.experience.beginner')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediate" id="intermediate" />
              <Label htmlFor="intermediate">{t('tutorial.experience.intermediate')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="advanced" id="advanced" />
              <Label htmlFor="advanced">{t('tutorial.experience.advanced')}</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleSkip}>
            {t('common.skip')}
          </Button>
          <Button onClick={handleSubmit}>
            {t('common.start')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}