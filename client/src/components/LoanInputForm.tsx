import { useState, useEffect } from "react";
import { LoanDetails, InterestRatePeriod, RepaymentModel, AdditionalCosts, FeeType } from "@/lib/types";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
// Temporarily commented out to avoid build errors
// import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CurrencySelector from "@/components/ui/currency-selector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, differenceInMonths } from "date-fns";
import { cn, getCurrencySymbol } from "@/lib/utils";

const loanFormSchema = z.object({
  principal: z.coerce.number()
    .min(1000, "Principal amount must be at least 1,000")
    .max(10000000, "Principal amount must be less than 10,000,000"),
  loanTerm: z.coerce.number()
    .min(1, "Loan term must be at least 1 year")
    .max(40, "Loan term must be less than 40 years"),
  interestRatePeriods: z.array(
    z.object({
      startMonth: z.coerce.number(),
      endMonth: z.coerce.number().optional(),
      interestRate: z.coerce.number()
        .min(0.1, "Interest rate must be at least 0.1%")
        .max(20, "Interest rate must be less than 20%"),
    })
  ).min(1, "At least one interest rate period is required"),
  repaymentModel: z.enum(['equalInstallments', 'decreasingInstallments', 'custom']).default('equalInstallments'),
  overpaymentPlans: z.array(
    z.object({
      amount: z.coerce.number()
        .min(0, "Amount must be non-negative"),
      startDate: z.date(),
      endDate: z.date().optional(),
      isRecurring: z.boolean(),
      frequency: z.enum(['monthly', 'quarterly', 'annual', 'one-time']),
      effect: z.enum(['reduceTerm', 'reducePayment'])
    })
  ).optional(),
  additionalCosts: z.object({
    originationFee: z.coerce.number().min(0, "Fee must be at least 0"),
    originationFeeType: z.enum(['fixed', 'percentage']).default('fixed'),
    loanInsurance: z.coerce.number().min(0, "Fee must be at least 0"),
    loanInsuranceType: z.enum(['fixed', 'percentage']).default('fixed'),
    administrativeFees: z.coerce.number().min(0, "Fee must be at least 0"),
    administrativeFeesType: z.enum(['fixed', 'percentage']).default('fixed'),
  }).optional().default({
    originationFee: 0,
    originationFeeType: 'fixed',
    loanInsurance: 0,
    loanInsuranceType: 'fixed',
    administrativeFees: 0,
    administrativeFeesType: 'fixed'
  }),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

interface InterestRatePeriodFormValues {
  startMonth: number;
  endMonth?: number;
  interestRate: number;
}

interface OverpaymentFormValues {
  amount: number;
  startDate: Date;
  endDate?: Date;
  isRecurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  effect: 'reduceTerm' | 'reducePayment';
}

interface LoanInputFormProps {
  loanDetails: LoanDetails;
  setLoanDetails: (loanDetails: LoanDetails) => void;
  onCalculate: (loanDetailsToCalculate?: LoanDetails) => void;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function LoanInputForm({
  loanDetails,
  setLoanDetails,
  onCalculate,
  selectedCurrency,
  onCurrencyChange
}: LoanInputFormProps) {
  const { t } = useTranslation();
  const form = useForm<LoanFormValues>({
    // TODO: Restore resolver when dependency is fixed
    // resolver: zodResolver(loanFormSchema),
    defaultValues: {
      principal: loanDetails.principal,
      loanTerm: loanDetails.loanTerm,
      interestRatePeriods: loanDetails.interestRatePeriods,
      repaymentModel: loanDetails.repaymentModel || 'equalInstallments',
      overpaymentPlans: loanDetails.overpaymentPlans || [],
      additionalCosts: loanDetails.additionalCosts || {
        originationFee: 0,
        originationFeeType: 'fixed',
        loanInsurance: 0,
        loanInsuranceType: 'fixed',
        administrativeFees: 0,
        administrativeFeesType: 'fixed'
      },
    },
  });

  // Watch for loan term changes
  const loanTerm = form.watch("loanTerm");
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'loanTerm') {
        // Ensure periods cover the entire loan term without forcing the last period to end at loan end
        const currentPeriods = form.getValues("interestRatePeriods");
        if (currentPeriods && currentPeriods.length > 0) {
          const newTermMonths = Number(value.loanTerm) * 12;
          
          // Check if periods cover the entire loan term
          const lastPeriod = currentPeriods[currentPeriods.length - 1];
          const lastEndMonth = lastPeriod.endMonth || lastPeriod.startMonth;
          
          // Only update if the last period doesn't reach the end of the loan
          if (lastEndMonth < newTermMonths) {
            lastPeriod.endMonth = newTermMonths;
            form.setValue("interestRatePeriods", currentPeriods);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Log any form errors to help with debugging
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('Form validation errors:', form.formState.errors);
    }
  }, [form.formState.errors]);

  const [date, setDate] = useState<Date>(loanDetails.startDate || new Date());

  const onSubmit = (values: LoanFormValues) => {
    // Convert overpayment plans to include both date and month formats for compatibility
    const convertedOverpaymentPlans = (values.overpaymentPlans || []).map(plan => {
      // Calculate startMonth as months from loan start date
      const startDate = plan.startDate;
      const monthDiff =
        (startDate.getFullYear() - date.getFullYear()) * 12 +
        (startDate.getMonth() - date.getMonth());
      
      // Calculate endMonth if endDate exists
      let endMonth: number | undefined = undefined;
      if (plan.endDate) {
        endMonth =
          (plan.endDate.getFullYear() - date.getFullYear()) * 12 +
          (plan.endDate.getMonth() - date.getMonth());
      }
      
      return {
        ...plan,
        startMonth: monthDiff > 0 ? monthDiff : 0,
        endMonth: endMonth
      };
    });
    
    // Create the updated loan details
    const updatedLoanDetails = {
      ...loanDetails,
      principal: values.principal,
      interestRatePeriods: values.interestRatePeriods,
      loanTerm: values.loanTerm,
      repaymentModel: values.repaymentModel,
      overpaymentPlans: convertedOverpaymentPlans,
      additionalCosts: values.additionalCosts,
      startDate: date,
      currency: selectedCurrency
    };
    
    // Update state and calculate with the new values directly
    setLoanDetails(updatedLoanDetails);
    
    // Pass the updated loan details directly to the parent's calculate function
    // This way we don't have to wait for the state update
    onCalculate(updatedLoanDetails);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('form.loanDetails')}</h2>

      <TooltipProvider>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        {t('form.loanAmount')}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{t('education.tooltips.principal') || t('form.loanAmountTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(selectedCurrency)}</span>
                          </div>
                          <Input
                            {...field}
                            type="number"
                            min="1000"
                            step="1000"
                            className="pl-7"
                          />
                        </div>
                      </FormControl>
                      {form.formState.errors.principal && (
                        <p className="text-red-500 text-xs mt-1">
                          {form.formState.errors.principal.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="sm:col-span-1">
                <CurrencySelector
                  value={selectedCurrency}
                  onChange={onCurrencyChange}
                />
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="loanTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.loanTerm')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('education.tooltips.loanTerm') || t('form.loanTermTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="40"
                      step="1"
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{t('form.years')}</span>
                    </div>
                  </div>
                </FormControl>
                {form.formState.errors.loanTerm && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.loanTerm.message}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repaymentModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.repaymentModel')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('education.tooltips.repaymentModel') || t('form.repaymentModelTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="equalInstallments">{t('form.equalInstallments')}</option>
                    <option value="decreasingInstallments">{t('form.decreasingInstallments')}</option>
                    <option value="custom">{t('form.customRepayment')}</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center">
              {t('form.loanStartDate')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{t('education.tooltips.loanStartDate') || t('form.loanStartDateTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : t('form.pickDate')}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => setDate(newDate || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormItem>

          <FormField
            control={form.control}
            name="interestRatePeriods"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.interestRatePeriods')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('form.interestRatePeriodsTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {Array.isArray(field.value) && field.value.map((period: InterestRatePeriodFormValues, index: number) => {
                      const loanTermInMonths = form.getValues("loanTerm") * 12;
                      
                      // Format period description
                      let periodDescription = index === 0
                        ? `${t('form.interestRate')} (${t('form.initialRate')})`
                        : `${t('form.interestRate')} ${index + 1}`;
                      
                      // Calculate default end month if not set
                      if (period.endMonth === undefined) {
                        // If this is the last period, end month is the loan term
                        if (index === field.value.length - 1) {
                          period.endMonth = loanTermInMonths;
                        }
                        // Otherwise, end month is the start month of the next period
                        else if (index + 1 < field.value.length) {
                          period.endMonth = field.value[index + 1].startMonth;
                        }
                      }

                      // Ensure periods are sequential and valid
                      if (index > 0) {
                        const prevPeriod = field.value[index - 1];
                        if (period.startMonth <= prevPeriod.startMonth) {
                          period.startMonth = prevPeriod.endMonth || prevPeriod.startMonth + 1;
                        }
                      }
                      
                      return (
                        <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-md">
                          <FormLabel className="text-sm">{periodDescription}</FormLabel>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                            {/* Start Date */}
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('form.startDate')}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        "text-muted-foreground"
                                      )}
                                    >
                                      {index === 0 ? 
                                        format(date, "PPP") : 
                                        format(addMonths(date, period.startMonth), "PPP")}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <div className="flex flex-col">
                                    <div className="flex justify-between p-2 border-b">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newDate = new Date(index === 0 ? date : addMonths(date, period.startMonth));
                                          newDate.setFullYear(newDate.getFullYear() - 1);
                                          
                                          if (index === 0) {
                                            setDate(newDate);
                                          } else {
                                            const newInterestRatePeriods = [...field.value];
                                            const monthDiff = differenceInMonths(newDate, date);
                                            newInterestRatePeriods[index].startMonth = monthDiff;
                                            
                                            // Update previous period's end date
                                            if (index > 0) {
                                              newInterestRatePeriods[index - 1].endMonth = monthDiff;
                                            }
                                            
                                            field.onChange(newInterestRatePeriods);
                                          }
                                        }}
                                      >
                                        -1 {t('form.year')}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newDate = new Date(index === 0 ? date : addMonths(date, period.startMonth));
                                          newDate.setFullYear(newDate.getFullYear() + 1);
                                          
                                          if (index === 0) {
                                            setDate(newDate);
                                          } else {
                                            const newInterestRatePeriods = [...field.value];
                                            const monthDiff = differenceInMonths(newDate, date);
                                            newInterestRatePeriods[index].startMonth = monthDiff;
                                            
                                            // Update previous period's end date
                                            if (index > 0) {
                                              newInterestRatePeriods[index - 1].endMonth = monthDiff;
                                            }
                                            
                                            field.onChange(newInterestRatePeriods);
                                          }
                                        }}
                                      >
                                        +1 {t('form.year')}
                                      </Button>
                                    </div>
                                    <Calendar
                                      mode="single"
                                      month={index === 0 ? date : addMonths(date, period.startMonth)}
                                      selected={index === 0 ? date : addMonths(date, period.startMonth)}
                                      defaultMonth={index === 0 ? date : addMonths(date, period.startMonth)}
                                      today={new Date()}
                                      onSelect={(newDate) => {
                                        if (newDate) {
                                          const newInterestRatePeriods = [...field.value];
                                          const monthDiff = differenceInMonths(newDate, date);
                                          
                                          // For first period, update loan start date
                                          if (index === 0) {
                                            setDate(newDate);
                                            return;
                                          }
                                          
                                          // For subsequent periods, update the start month
                                          newInterestRatePeriods[index].startMonth = monthDiff;
                                          
                                          // Always update the previous period's end date to match this period's start date
                                          if (index > 0) {
                                            newInterestRatePeriods[index - 1].endMonth = monthDiff;
                                          }
                                          
                                          // If this period has an end month and it would now overlap, adjust it
                                          if (period.endMonth && period.endMonth <= monthDiff) {
                                            // Set a reasonable new end date (start + 12 months or next period's start)
                                            if (index < newInterestRatePeriods.length - 1) {
                                              newInterestRatePeriods[index].endMonth = newInterestRatePeriods[index + 1].startMonth;
                                            } else {
                                              // For last period, use either loan term or start + 12 months
                                              const loanTermInMonths = form.getValues("loanTerm") * 12;
                                              newInterestRatePeriods[index].endMonth = Math.min(monthDiff + 12, loanTermInMonths);
                                            }
                                          }
                                          
                                          field.onChange(newInterestRatePeriods);
                                        }
                                      }}
                                      disabled={(calendarDate) => {
                                        if (index === 0) return false;
                                        
                                        // Only prevent selecting dates before loan start
                                        return calendarDate < date;
                                      }}
                                      initialFocus={false}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            {/* End Date */}
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('form.endDate')}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        "text-muted-foreground"
                                      )}
                                    >
                                      {!period.endMonth ? t('form.loanEnd') :
                                        format(addMonths(date, period.endMonth), "PPP")}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <div className="flex flex-col">
                                    <div className="flex justify-between p-2 border-b">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const loanTermInMonths = form.getValues("loanTerm") * 12;
                                          const currentDate = period.endMonth ? addMonths(date, period.endMonth) : addMonths(date, loanTermInMonths);
                                          const newDate = new Date(currentDate);
                                          newDate.setFullYear(newDate.getFullYear() - 1);
                                          
                                          const monthDiff = differenceInMonths(newDate, date);
                                          if (monthDiff <= period.startMonth) {
                                            return;
                                          }
                                          
                                          const newInterestRatePeriods = [...field.value];
                                          newInterestRatePeriods[index].endMonth = monthDiff;
                                          
                                          // Update next period's start date
                                          if (index < newInterestRatePeriods.length - 1) {
                                            newInterestRatePeriods[index + 1].startMonth = monthDiff;
                                          }
                                          
                                          field.onChange(newInterestRatePeriods);
                                        }}
                                      >
                                        -1 {t('form.year')}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const loanTermInMonths = form.getValues("loanTerm") * 12;
                                          const currentDate = period.endMonth ? addMonths(date, period.endMonth) : addMonths(date, loanTermInMonths);
                                          const newDate = new Date(currentDate);
                                          newDate.setFullYear(newDate.getFullYear() + 1);
                                          
                                          const monthDiff = differenceInMonths(newDate, date);
                                          
                                          // Don't go beyond loan term for last period
                                          if (index === field.value.length - 1 && monthDiff > loanTermInMonths) {
                                            return;
                                          }
                                          
                                          const newInterestRatePeriods = [...field.value];
                                          newInterestRatePeriods[index].endMonth = monthDiff;
                                          
                                          // Update next period's start date
                                          if (index < newInterestRatePeriods.length - 1) {
                                            newInterestRatePeriods[index + 1].startMonth = monthDiff;
                                          }
                                          
                                          field.onChange(newInterestRatePeriods);
                                        }}
                                      >
                                        +1 {t('form.year')}
                                      </Button>
                                    </div>
                                    <Calendar
                                      mode="single"
                                      month={period.endMonth ? addMonths(date, period.endMonth) : addMonths(date, form.getValues("loanTerm") * 12)}
                                      selected={period.endMonth ? addMonths(date, period.endMonth) : addMonths(date, form.getValues("loanTerm") * 12)}
                                      defaultMonth={period.endMonth ? addMonths(date, period.endMonth) : addMonths(date, form.getValues("loanTerm") * 12)}
                                      today={new Date()}
                                      onSelect={(newDate) => {
                                        if (newDate) {
                                          const newInterestRatePeriods = [...field.value];
                                          const monthDiff = differenceInMonths(newDate, date);
                                          
                                          // Only validate that end date is after current period's start
                                          if (monthDiff <= period.startMonth) {
                                            return;
                                          }
                                          
                                          // Update the end month
                                          newInterestRatePeriods[index].endMonth = monthDiff;
                                          
                                          // Always update the next period's start date to match this period's end date
                                          if (index < newInterestRatePeriods.length - 1) {
                                            newInterestRatePeriods[index + 1].startMonth = monthDiff;
                                          }
                                          
                                          field.onChange(newInterestRatePeriods);
                                        }
                                      }}
                                      disabled={(calendarDate) => {
                                        // Only prevent dates before period start
                                        const minDate = addMonths(date, period.startMonth);
                                        
                                        // For all periods, only ensure it's after start date
                                        // This gives maximum flexibility while maintaining sequential order
                                        return calendarDate < minDate;
                                      }}
                                      initialFocus={false}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            {/* Period Length Display */}
                            <div className="col-span-2 mt-2 text-xs text-gray-500">
                              {period.endMonth !== undefined && (
                                <div className="flex items-center justify-end">
                                  <span>
                                    {t('form.periodLength')}: {' '}
                                    {(() => {
                                      const months = period.endMonth - period.startMonth;
                                      const years = Math.floor(months / 12);
                                      const remainingMonths = months % 12;
                                      
                                      let result = '';
                                      if (years > 0) {
                                        result += `${years} ${years === 1 ? t('form.year') : t('form.years')} `;
                                      }
                                      if (remainingMonths > 0 || years === 0) {
                                        result += `${remainingMonths} ${remainingMonths === 1 ? t('form.month') : t('form.months')}`;
                                      }
                                      return result;
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Interest Rate */}
                          <div className="space-y-2">
                            <FormLabel className="text-xs text-gray-500">{t('form.interestRate')}</FormLabel>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                min="0.1"
                                max="20"
                                step="0.1"
                                placeholder={t('form.interestRate')}
                                value={period.interestRate}
                                onChange={(e) => {
                                  const newInterestRatePeriods = [...field.value];
                                  newInterestRatePeriods[index].interestRate = Number(e.target.value);
                                  field.onChange(newInterestRatePeriods);
                                }}
                                className="flex-1"
                              />
                              <span className="ml-2">%</span>
                            </div>
                          </div>
                          
                          {field.value.length > 1 && (
                            <div className="flex justify-end mt-4">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newInterestRatePeriods = [...field.value];
                                  
                                  // If removing a middle period, update the previous period's end month
                                  if (index > 0 && index < field.value.length - 1) {
                                    newInterestRatePeriods[index - 1].endMonth = newInterestRatePeriods[index + 1].startMonth;
                                  }
                                  
                                  newInterestRatePeriods.splice(index, 1);
                                  field.onChange(newInterestRatePeriods);
                                }}
                              >
                                {t('form.remove')}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const currentValue = Array.isArray(field.value) ? field.value : [];
                        const loanTermInMonths = form.getValues("loanTerm") * 12;
                        
                        if (currentValue.length > 0) {
                          // Get the last period
                          const lastPeriod = currentValue[currentValue.length - 1];
                          
                          // Calculate midpoint of remaining time for better distribution
                          let newStartMonth, newEndMonth;
                          
                          if (lastPeriod.endMonth === loanTermInMonths) {
                            // If last period ends at loan term, split it in half
                            const midPoint = Math.floor((lastPeriod.startMonth + loanTermInMonths) / 2);
                            lastPeriod.endMonth = midPoint;
                            newStartMonth = midPoint;
                            newEndMonth = loanTermInMonths;
                          } else {
                            // If last period doesn't end at loan term, place new period after it
                            newStartMonth = lastPeriod.endMonth || (lastPeriod.startMonth + 12);
                            
                            // Set a reasonable default end month (either loan term or start + 12 months)
                            if (newStartMonth + 12 <= loanTermInMonths) {
                              newEndMonth = newStartMonth + 12;
                            } else {
                              newEndMonth = loanTermInMonths;
                            }
                          }
                          
                          // Add new period
                          field.onChange([
                            ...currentValue,
                            {
                              startMonth: newStartMonth,
                              endMonth: newEndMonth,
                              interestRate: 5
                            }
                          ]);
                        } else {
                          // First period
                          field.onChange([
                            {
                              startMonth: 0,
                              endMonth: loanTermInMonths,
                              interestRate: 5
                            }
                          ]);
                        }
                      }}
                      className="w-full"
                    >
                      {t('form.add')}
                    </Button>
                  </div>
                </FormControl>
                {form.formState.errors.interestRatePeriods && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.interestRatePeriods.message}
                  </p>
                )}
              </FormItem>
            )}
          />



          <FormField
            control={form.control}
            name="overpaymentPlans"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('overpayment.title')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('overpayment.amountTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {(field.value || []).map((overpayment: OverpaymentFormValues, index: number) => {
                      const loanTermInMonths = form.getValues("loanTerm") * 12;
                      
                      return (
                        <div key={index} className="space-y-2 p-3 border border-gray-200 rounded-md">
                          <FormLabel className="text-sm">{t('overpayment.title')} {index + 1}</FormLabel>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('overpayment.amount')}</FormLabel>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(selectedCurrency)}</span>
                                </div>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder={t('overpayment.amount')}
                                  value={overpayment.amount}
                                  onChange={(e) => {
                                    const newOverpaymentPlans = [...(field.value || [])];
                                    newOverpaymentPlans[index].amount = Number(e.target.value);
                                    field.onChange(newOverpaymentPlans);
                                  }}
                                  className="pl-7"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('overpayment.startDate')}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !overpayment.startDate && "text-muted-foreground"
                                      )}
                                    >
                                      {overpayment.startDate ? format(overpayment.startDate, "PPP") : t('form.pickDate')}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={overpayment.startDate}
                                    onSelect={(newDate) => {
                                      if (newDate) {
                                        const newOverpaymentPlans = [...(field.value || [])];
                                        newOverpaymentPlans[index].startDate = newDate;
                                        
                                        // If there's an end date and it's before the new start date, update it
                                        if (overpayment.endDate && newDate > overpayment.endDate) {
                                          newOverpaymentPlans[index].endDate = new Date(newDate);
                                          // Add one month to end date
                                          newOverpaymentPlans[index].endDate.setMonth(newDate.getMonth() + 1);
                                        }
                                        
                                        field.onChange(newOverpaymentPlans);
                                      }
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('overpayment.frequency')}</FormLabel>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={overpayment.frequency}
                                onChange={(e) => {
                                  const newOverpaymentPlans = [...(field.value || [])];
                                  newOverpaymentPlans[index].frequency = e.target.value as 'monthly' | 'quarterly' | 'annual' | 'one-time';
                                  newOverpaymentPlans[index].isRecurring = e.target.value !== 'one-time';
                                  field.onChange(newOverpaymentPlans);
                                }}
                              >
                                <option value="one-time">{t('overpayment.oneTime')}</option>
                                <option value="monthly">{t('overpayment.monthly')}</option>
                                <option value="quarterly">{t('overpayment.quarterly')}</option>
                                <option value="annual">{t('overpayment.annual')}</option>
                              </select>
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('overpayment.effect')}</FormLabel>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={overpayment.effect}
                                onChange={(e) => {
                                  const newOverpaymentPlans = [...(field.value || [])];
                                  newOverpaymentPlans[index].effect = e.target.value as 'reduceTerm' | 'reducePayment';
                                  field.onChange(newOverpaymentPlans);
                                }}
                              >
                                <option value="reduceTerm">{t('overpayment.reduceTerm')}</option>
                                <option value="reducePayment">{t('overpayment.reducePayment')}</option>
                              </select>
                            </div>
                          </div>
                          
                          {overpayment.isRecurring && (
                            <div className="space-y-2">
                              <FormLabel className="text-xs text-gray-500">{t('overpayment.endDate')}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !overpayment.endDate && "text-muted-foreground"
                                      )}
                                    >
                                      {overpayment.endDate ? format(overpayment.endDate, "PPP") : t('form.pickDate')}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={overpayment.endDate}
                                    onSelect={(newDate) => {
                                      if (newDate) {
                                        const newOverpaymentPlans = [...(field.value || [])];
                                        
                                        // Ensure end date is after start date
                                        if (newDate < overpayment.startDate) {
                                          newOverpaymentPlans[index].endDate = new Date(overpayment.startDate);
                                          // Add one month to start date
                                          newOverpaymentPlans[index].endDate.setMonth(overpayment.startDate.getMonth() + 1);
                                        } else {
                                          newOverpaymentPlans[index].endDate = newDate;
                                        }
                                        
                                        field.onChange(newOverpaymentPlans);
                                      }
                                    }}
                                    initialFocus
                                    disabled={(date) => date < overpayment.startDate}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                          
                          {(field.value || []).length > 0 && (
                            <div className="flex justify-end mt-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newOverpaymentPlans = [...(field.value || [])];
                                  newOverpaymentPlans.splice(index, 1);
                                  field.onChange(newOverpaymentPlans);
                                }}
                              >
                                {t('form.remove')}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const currentValue = field.value || [];
                        
                        // Create a start date 3 months from loan start date
                        const startDate = new Date(date);
                        startDate.setMonth(startDate.getMonth() + 3);
                        
                        field.onChange([...currentValue, {
                          amount: 1000,
                          startDate: startDate,
                          isRecurring: false,
                          frequency: 'one-time',
                          effect: 'reduceTerm'
                        }]);
                      }}
                      className="w-full"
                    >
                      {t('overpayment.add')}
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
{/* Additional Costs Section */}
          <FormField
            control={form.control}
            name="additionalCosts"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.additionalCosts') || "Additional Costs"}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('form.additionalCostsTooltip') || "Fees and costs associated with your loan"}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="space-y-4 p-3 border border-gray-200 rounded-md">
                    {/* Origination Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel className="text-xs text-gray-500">{t('form.originationFee') || "Origination Fee"}</FormLabel>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value?.originationFee || 0}
                            onChange={(e) => {
                              const newValue = { 
                                ...field.value, 
                                originationFee: Number(e.target.value) 
                              };
                              field.onChange(newValue);
                            }}
                            className="flex-1"
                          />
                          <select
                            className="ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={field.value?.originationFeeType || 'fixed'}
                            onChange={(e) => {
                              const newValue = { 
                                ...field.value, 
                                originationFeeType: e.target.value as FeeType 
                              };
                              field.onChange(newValue);
                            }}
                          >
                            <option value="fixed">{getCurrencySymbol(selectedCurrency)}</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Loan Insurance */}
                      <div className="space-y-2">
                        <FormLabel className="text-xs text-gray-500">{t('form.loanInsurance') || "Loan Insurance"}</FormLabel>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value?.loanInsurance || 0}
                            onChange={(e) => {
                              const newValue = { 
                                ...field.value, 
                                loanInsurance: Number(e.target.value) 
                              };
                              field.onChange(newValue);
                            }}
                            className="flex-1"
                          />
                          <select
                            className="ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={field.value?.loanInsuranceType || 'fixed'}
                            onChange={(e) => {
                              const newValue = { 
                                ...field.value, 
                                loanInsuranceType: e.target.value as FeeType 
                              };
                              field.onChange(newValue);
                            }}
                          >
                            <option value="fixed">{getCurrencySymbol(selectedCurrency)}</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Administrative Fees */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel className="text-xs text-gray-500">{t('form.administrativeFees') || "Administrative Fees"}</FormLabel>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value?.administrativeFees || 0}
                            onChange={(e) => {
                              const newValue = { 
                                ...field.value, 
                                administrativeFees: Number(e.target.value) 
                              };
                              field.onChange(newValue);
                            }}
                            className="flex-1"
                          />
                          <select
                            className="ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={field.value?.administrativeFeesType || 'fixed'}
                            onChange={(e) => {
                              const newValue = { 
                                ...field.value, 
                                administrativeFeesType: e.target.value as FeeType 
                              };
                              field.onChange(newValue);
                            }}
                          >
                            <option value="fixed">{getCurrencySymbol(selectedCurrency)}</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
            >
              {t('form.calculate')}
            </Button>
          </div>
          </form>
        </Form>
      </TooltipProvider>
    </div>
  );
}
