import { useState } from "react";
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
// import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CurrencySelector, { getCurrencySymbol } from "@/components/ui/currency-selector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const loanFormSchema = z.object({
  principal: z.coerce.number()
    .min(1000, "Principal amount must be at least $1,000")
    .max(10000000, "Principal amount must be less than $10,000,000"),
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
      amount: z.coerce.number().min(0, "Overpayment amount must be at least 0"),
      startDate: z.date(),
      endDate: z.date().optional(),
      isRecurring: z.boolean().default(false),
      frequency: z.enum(['monthly', 'quarterly', 'annual', 'one-time']).default('one-time'),
      effect: z.enum(['reduceTerm', 'reducePayment']).default('reduceTerm'),
    })
  ).optional().default([]),
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
  onCalculate: () => void;
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
    
    setLoanDetails({
      ...loanDetails,
      principal: values.principal,
      interestRatePeriods: values.interestRatePeriods,
      loanTerm: values.loanTerm,
      repaymentModel: values.repaymentModel,
      overpaymentPlans: convertedOverpaymentPlans,
      additionalCosts: values.additionalCosts,
      startDate: date,
      currency: selectedCurrency
    });
    onCalculate();
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
                                      {period.startMonth === 0 ?
                                        t('form.loanStart') :
                                        `${Math.floor(period.startMonth / 12)}y ${period.startMonth % 12}m`
                                      }
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <div className="p-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <FormLabel className="text-xs">{t('form.year')}</FormLabel>
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder={t('form.year')}
                                          value={Math.floor(period.startMonth / 12)}
                                          onChange={(e) => {
                                            const years = Number(e.target.value);
                                            const months = period.startMonth % 12;
                                            const newStartMonth = (years * 12) + months;
                                            
                                            const newInterestRatePeriods = [...field.value];
                                            newInterestRatePeriods[index].startMonth = newStartMonth;
                                            
                                            // Ensure start month is not after end month
                                            if (period.endMonth !== undefined && newStartMonth >= period.endMonth) {
                                              newInterestRatePeriods[index].endMonth = newStartMonth + 1;
                                            }
                                            
                                            field.onChange(newInterestRatePeriods);
                                          }}
                                          className="w-full"
                                        />
                                      </div>
                                      <div>
                                        <FormLabel className="text-xs">{t('form.month')}</FormLabel>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="11"
                                          placeholder={t('form.month')}
                                          value={period.startMonth % 12}
                                          onChange={(e) => {
                                            const years = Math.floor(period.startMonth / 12);
                                            const months = Number(e.target.value) % 12;
                                            const newStartMonth = (years * 12) + months;
                                            
                                            const newInterestRatePeriods = [...field.value];
                                            newInterestRatePeriods[index].startMonth = newStartMonth;
                                            
                                            // Ensure start month is not after end month
                                            if (period.endMonth !== undefined && newStartMonth >= period.endMonth) {
                                              newInterestRatePeriods[index].endMonth = newStartMonth + 1;
                                            }
                                            
                                            field.onChange(newInterestRatePeriods);
                                          }}
                                          className="w-full"
                                        />
                                      </div>
                                    </div>
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
                                      {!period.endMonth ?
                                        t('form.loanEnd') :
                                        `${Math.floor(period.endMonth / 12)}y ${period.endMonth % 12}m`
                                      }
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <div className="p-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <FormLabel className="text-xs">{t('form.year')}</FormLabel>
                                        <Input
                                          type="number"
                                          min={Math.floor(period.startMonth / 12)}
                                          max={Math.floor(loanTermInMonths / 12)}
                                          placeholder={t('form.year')}
                                          value={Math.floor((period.endMonth || loanTermInMonths) / 12)}
                                          onChange={(e) => {
                                            const years = Number(e.target.value);
                                            const months = (period.endMonth || loanTermInMonths) % 12;
                                            const newEndMonth = (years * 12) + months;
                                            
                                            const newInterestRatePeriods = [...field.value];
                                            
                                            // Ensure end month is after start month
                                            if (newEndMonth <= period.startMonth) {
                                              newInterestRatePeriods[index].endMonth = period.startMonth + 1;
                                            } else {
                                              newInterestRatePeriods[index].endMonth = newEndMonth;
                                            }
                                            
                                            // If this is not the last period, ensure the next period's start month is updated
                                            if (index < field.value.length - 1) {
                                              newInterestRatePeriods[index + 1].startMonth = newInterestRatePeriods[index].endMonth;
                                            }
                                            
                                            field.onChange(newInterestRatePeriods);
                                          }}
                                          className="w-full"
                                        />
                                      </div>
                                      <div>
                                        <FormLabel className="text-xs">{t('form.month')}</FormLabel>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="11"
                                          placeholder={t('form.month')}
                                          value={(period.endMonth || loanTermInMonths) % 12}
                                          onChange={(e) => {
                                            const years = Math.floor((period.endMonth || loanTermInMonths) / 12);
                                            const months = Number(e.target.value) % 12;
                                            const newEndMonth = (years * 12) + months;
                                            
                                            const newInterestRatePeriods = [...field.value];
                                            
                                            // Ensure end month is after start month
                                            if (newEndMonth <= period.startMonth) {
                                              newInterestRatePeriods[index].endMonth = period.startMonth + 1;
                                            } else {
                                              newInterestRatePeriods[index].endMonth = newEndMonth;
                                            }
                                            
                                            // If this is not the last period, ensure the next period's start month is updated
                                            if (index < field.value.length - 1) {
                                              newInterestRatePeriods[index + 1].startMonth = newInterestRatePeriods[index].endMonth;
                                            }
                                            
                                            field.onChange(newInterestRatePeriods);
                                          }}
                                          className="w-full"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
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
                        let newStartMonth = 0;
                        let newEndMonth = form.getValues("loanTerm") * 12;
                        
                        if (currentValue.length > 0) {
                          // Get the last period
                          const lastPeriod = currentValue[currentValue.length - 1];
                          
                          // If the last period has an end month, use it as the start month for the new period
                          if (lastPeriod.endMonth !== undefined) {
                            newStartMonth = lastPeriod.endMonth;
                            // Update the previous period's end month to match the new period's start month
                            lastPeriod.endMonth = newStartMonth;
                          } else {
                            // Otherwise, use the last period's start month + 12 months
                            newStartMonth = lastPeriod.startMonth + 12;
                            // Set the last period's end month
                            lastPeriod.endMonth = newStartMonth;
                          }
                        }
                        
                        field.onChange([
                          ...currentValue,
                          {
                            startMonth: newStartMonth,
                            endMonth: newEndMonth,
                            interestRate: 5
                          }
                        ]);
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
                    {Array.isArray(field.value) && field.value.map((overpayment: OverpaymentFormValues, index: number) => {
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
                                    const newOverpaymentPlans = [...field.value];
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
                                        const newOverpaymentPlans = [...field.value];
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
                                  const newOverpaymentPlans = [...field.value];
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
                                  const newOverpaymentPlans = [...field.value];
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
                                        const newOverpaymentPlans = [...field.value];
                                        
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
                          
                          {field.value.length > 0 && (
                            <div className="flex justify-end mt-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newOverpaymentPlans = [...field.value];
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
                        const currentValue = Array.isArray(field.value) ? field.value : [];
                        
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
