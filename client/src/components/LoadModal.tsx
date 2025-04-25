import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SavedCalculation } from "@/lib/types";
import { X } from "lucide-react";

interface LoadModalProps {
  savedCalculations: SavedCalculation[];
  onLoadCalculation: (calculation: SavedCalculation) => void;
  onClose: () => void;
}

export default function LoadModal({
  savedCalculations,
  onLoadCalculation,
  onClose
}: LoadModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Saved Calculations</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-200">
          {savedCalculations.length === 0 ? (
            <p className="py-3 text-gray-500">No saved calculations found.</p>
          ) : (
            savedCalculations.map((calc) => (
              <div 
                key={calc.id}
                className="py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => onLoadCalculation(calc)}
              >
                <p className="font-medium text-gray-900">{calc.name}</p>
                <p className="text-sm text-gray-500">
                  ${calc.loanDetails.principal.toLocaleString()} at {calc.loanDetails.interestRate}% for {calc.loanDetails.loanTerm} years
                </p>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
