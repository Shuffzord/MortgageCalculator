import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import type { DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

// Extend the props with our custom props
export interface CalendarProps {
  className?: string;
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
  showYearNavigation?: boolean;
  yearNavigationLabel?: {
    previous?: string;
    next?: string;
  };
  selected?: Date | Date[] | undefined;
  defaultMonth?: Date;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onSelect?: (date: Date | undefined) => void;
  onChange?: (date: Date, changeType: 'select' | 'navigate') => void;
  mode?: "single" | "multiple" | "range" | "default";
  disabled?: any;
  initialFocus?: boolean;
  numberOfMonths?: number;
  fromDate?: Date;
  toDate?: Date;
  fromYear?: number;
  toYear?: number;
  captionLayout?: "dropdown" | "buttons" | "dropdown-buttons";
  [key: string]: any;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showYearNavigation = false,
  yearNavigationLabel,
  selected,
  onSelect,
  onChange,
  mode = "single",
  ...props
}: CalendarProps) {
  const { t } = useTranslation();
  
  // Create internal state for the current month if not provided
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    props.defaultMonth || new Date()
  );
  
  // Use the provided month prop if it exists, otherwise use internal state
  const currentMonth = props.month || internalMonth;
  
  // Combined handler for all changes (selection and navigation)
  const handleChange = (newDate: Date | undefined, changeType: 'select' | 'navigate') => {
    if (!newDate) return;
    
    if (changeType === 'select' && onSelect) {
      onSelect(newDate);
    }
    
    if (changeType === 'navigate') {
      // Update internal month state
      if (!props.month) {
        setInternalMonth(newDate);
      }
      
      // Call the original onMonthChange if provided
      if (props.onMonthChange) {
        props.onMonthChange(newDate);
      }
    }
    
    // Call the combined onChange handler if provided
    if (onChange) {
      onChange(newDate, changeType);
    }
  };
  
  // Create a custom caption component with both month and year navigation
  const CustomCaption = React.useCallback(({
    displayMonth,
    id,
    ...captionProps
  }: any) => {
    // Get navigation functions
    const handlePreviousMonth = () => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(displayMonth.getMonth() - 1);
      handleChange(newDate, 'navigate');
    };
    
    const handleNextMonth = () => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(displayMonth.getMonth() + 1);
      handleChange(newDate, 'navigate');
    };
    
    const handlePreviousYear = () => {
      const newDate = new Date(displayMonth);
      newDate.setFullYear(displayMonth.getFullYear() - 1);
      handleChange(newDate, 'navigate');
    };
    
    const handleNextYear = () => {
      const newDate = new Date(displayMonth);
      newDate.setFullYear(displayMonth.getFullYear() + 1);
      handleChange(newDate, 'navigate');
    };
    
    // Default year navigation labels
    const previousYearLabel = yearNavigationLabel?.previous || `-1 ${t('form.year') || 'Year'}`;
    const nextYearLabel = yearNavigationLabel?.next || `+1 ${t('form.year') || 'Year'}`;
    
    return (
      <div className="flex flex-col justify-center pt-1 relative items-center">
        {/* Month navigation and display */}
        <div className="flex items-center justify-center w-full relative">
          <button
            onClick={handlePreviousMonth}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
            )}
            type="button"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="text-sm font-medium">
            {displayMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          
          <button
            onClick={handleNextMonth}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
            )}
            type="button"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {/* Year navigation - conditionally rendered */}
        {showYearNavigation && (
          <div className="flex justify-between w-full p-2 border-b mt-4">
            <button
              onClick={handlePreviousYear}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 bg-transparent text-xs"
              )}
              type="button"
              aria-label="Previous year"
            >
              <ChevronsLeft className="h-3 w-3 mr-1" />
              {previousYearLabel}
            </button>
            <button
              onClick={handleNextYear}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 bg-transparent text-xs"
              )}
              type="button"
              aria-label="Next year"
            >
              {nextYearLabel}
              <ChevronsRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        )}
      </div>
    );
  }, [yearNavigationLabel, showYearNavigation, t, handleChange]);
  
  return (
    <DayPicker
      mode={mode as any}
      selected={selected}
      onSelect={(date: Date | undefined) => handleChange(date, 'select')}
      month={currentMonth}
      onMonthChange={(month) => handleChange(month, 'navigate')}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        // Set these to empty components to hide the default navigation buttons
        // since we're handling navigation in our custom caption
        IconLeft: () => null,
        IconRight: () => null
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
