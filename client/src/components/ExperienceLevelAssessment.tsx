import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { tutorialAnalytics } from "../lib/tutorial/analytics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

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
  const [selectedLevel, setSelectedLevel] =
    useState<ExperienceLevel>("beginner");

  console.log("[ExperienceLevelAssessment] Render:", { isOpen, selectedLevel });

  const handleSubmit = () => {
    console.log("[ExperienceLevelAssessment] Submitting level:", selectedLevel);
    tutorialAnalytics.experienceLevelChanged(selectedLevel);
    onExperienceLevelSet(selectedLevel);
    onClose();
  };

  const handleSkip = () => {
    console.log("[ExperienceLevelAssessment] Skipping assessment");
    tutorialAnalytics.tutorialAbandoned(0, "not_selected");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="py-4">
          <RadioGroup
            value={selectedLevel}
            onValueChange={(value) => {
              console.log("Selected value:", value);
              setSelectedLevel(value as ExperienceLevel);
            }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner">
                {t("tutorial.experience.beginner")}
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <RadioGroupItem value="intermediate" id="intermediate" disabled />
              <Label htmlFor="intermediate" className="text-muted-foreground">
                {t("tutorial.experience.intermediate")}
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <RadioGroupItem value="advanced" id="advanced" disabled />
              <Label htmlFor="advanced" className="text-muted-foreground">
                {t("tutorial.experience.advanced")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} className="mr-2">
            {t("common.skip")}
          </Button>
          <Button onClick={handleSubmit}>{t("common.start")}</Button>
         
        </DialogFooter>
          <div className="bg-yellow-500 text-yellow-900 text-center py-2 block">
        {t('app.beta')}
      </div>
      </DialogContent>
    </Dialog>
  );
}
