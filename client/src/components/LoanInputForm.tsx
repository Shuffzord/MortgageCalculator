import { useState } from "react";
import { LoanDetails } from "@/lib/types";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CurrencySelector, { getCurrencySymbol } from "@/components/ui/currency-selector";

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
      interestRate: z.coerce.number()
        .min(0.1, "Interest rate must be at least 0.1%")
        .max(20, "Interest rate must be less than 20%"),
    })
  ).min(1, "At least one interest rate period is required"),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

interface InterestRatePeriodFormValues {
  startMonth: number;
  interestRate: number;
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
    },
  });

  const onSubmit = (values: LoanFormValues) => {
    setLoanDetails({
      ...loanDetails,
      principal: values.principal,
      interestRatePeriods: values.interestRatePeriods,
      loanTerm: values.loanTerm,
      currency: selectedCurrency
    });
    onCalculate();
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('form.loanDetails')}</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="principal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.loanAmount')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{t('form.loanAmountTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

          <FormField
            control={form.control}
            name="loanTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.loanTerm')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{t('form.loanTermTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
            name="interestRatePeriods"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.interestRatePeriods')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span><HelpCircle className="h-4 w-4 text-gray-400 ml-1" /></span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{t('form.interestRatePeriodsTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {Array.isArray(field.value) && field.value.map((period: InterestRatePeriodFormValues, index: number) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder={t('form.startMonth')}
                          value={period.startMonth}
                          onChange={(e) => {
                            const newInterestRatePeriods = [...field.value];
                            newInterestRatePeriods[index].startMonth = Number(e.target.value);
                            field.onChange(newInterestRatePeriods);
                          }}
                          className="w-24"
                        />
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
                          className="w-24"
                        />
                        {field.value.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newInterestRatePeriods = [...field.value];
                              newInterestRatePeriods.splice(index, 1);
                              field.onChange(newInterestRatePeriods);
                            }}
                          >
                            {t('form.remove')}
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const currentValue = Array.isArray(field.value) ? field.value : [];
                        field.onChange([...currentValue, { startMonth: 0, interestRate: 5 }]);
                      }}
                      className="mt-2"
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

          <CurrencySelector
            value={selectedCurrency}
            onChange={onCurrencyChange}
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
    </div>
  );
}
