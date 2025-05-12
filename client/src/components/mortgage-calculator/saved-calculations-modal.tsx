import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoanDetails } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SavedCalculationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCalculations: LoanDetails[];
  onLoadCalculation: (calculation: LoanDetails) => void;
}

export default function SavedCalculationsModal({
  isOpen,
  onClose,
  savedCalculations,
  onLoadCalculation,
}: SavedCalculationsModalProps) {
  if (savedCalculations.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Calculations</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-center text-gray-500">
              No saved calculations found.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saved Calculations</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-60 overflow-y-auto mb-4">
          <ul className="divide-y divide-gray-200">
            {savedCalculations.map((calc, index) => (
              <li key={index} className="py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{calc.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(calc.principal, undefined, calc.currency || 'USD')} at {calc.interestRatePeriods?.[0]?.interestRate || 0}% for {calc.loanTerm} years
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadCalculation(calc)}
                  className="px-3 py-1 border border-gray-300 text-xs rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Load
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
