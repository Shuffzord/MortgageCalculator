import React, { useState } from 'react';
import { AlertTriangle, X, Calendar, Crown, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Subscription } from '@/lib/api/types';

interface CancelSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  subscription: Subscription;
}

export function CancelSubscription({ isOpen, onClose, onConfirm, subscription }: CancelSubscriptionProps) {
  const [step, setStep] = useState<'reason' | 'confirm' | 'processing'>('reason');
  const [selectedReason, setSelectedReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cancellationReasons = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: 'Not using the features enough' },
    { value: 'missing_features', label: 'Missing features I need' },
    { value: 'technical_issues', label: 'Technical issues or bugs' },
    { value: 'switching_service', label: 'Switching to another service' },
    { value: 'temporary_pause', label: 'Taking a temporary break' },
    { value: 'other', label: 'Other reason' }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNext = () => {
    if (!selectedReason) {
      setError('Please select a reason for cancellation');
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setStep('processing');
      setError(null);
      await onConfirm();
      onClose();
      // Reset state
      setStep('reason');
      setSelectedReason('');
      setFeedback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      setStep('confirm');
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      onClose();
      // Reset state
      setStep('reason');
      setSelectedReason('');
      setFeedback('');
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancel Subscription
          </DialogTitle>
        </DialogHeader>

        {step === 'reason' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">We're sorry to see you go!</h3>
              <p className="text-gray-600">
                Help us improve by letting us know why you're canceling your subscription.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="text-base font-medium mb-4 block">
                What's the main reason for canceling?
              </Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                <div className="space-y-3">
                  {cancellationReasons.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label htmlFor={reason.value} className="cursor-pointer">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-base font-medium mb-2 block">
                Additional feedback (optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Tell us more about your experience or what we could do better..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Keep Subscription
              </Button>
              <Button onClick={handleNext} variant="destructive">
                Continue Cancellation
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Confirm Cancellation</h3>
              <p className="text-gray-600">
                Are you sure you want to cancel your premium subscription?
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* What happens next */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-800">What happens when you cancel:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Access until {formatDate(subscription.currentPeriodEnd)}</p>
                    <p className="text-sm text-red-700">
                      You'll keep premium features until your current billing period ends
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">No future charges</p>
                    <p className="text-sm text-red-700">
                      Your subscription won't renew and you won't be charged again
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Limited access after cancellation</p>
                    <p className="text-sm text-red-700">
                      You'll return to the free plan with limited calculations and features
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative offers */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h4 className="font-medium text-blue-800 mb-2">Before you go...</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Would you consider pausing your subscription instead? You can reactivate anytime.
                </p>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                  Pause Instead
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('reason')}>
                Go Back
              </Button>
              <Button onClick={handleConfirm} variant="destructive">
                Yes, Cancel Subscription
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Canceling your subscription...</h3>
            <p className="text-gray-600">
              Please wait while we process your cancellation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}