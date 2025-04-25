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

const loanFormSchema = z.object({
  principal: z.coerce.number()
    .min(1000, "Principal amount must be at least $1,000")
    .max(10000000, "Principal amount must be less than $10,000,000"),
  interestRate: z.coerce.number()
    .min(0.1, "Interest rate must be at least 0.1%")
    .max(20, "Interest rate must be less than 20%"),
  loanTerm: z.coerce.number()
    .min(1, "Loan term must be at least 1 year")
    .max(40, "Loan term must be less than 40 years")
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

interface LoanInputFormProps {
  loanDetails: LoanDetails;
  setLoanDetails: (loanDetails: LoanDetails) => void;
  onCalculate: () => void;
}

export default function LoanInputForm({ 
  loanDetails, 
  setLoanDetails, 
  onCalculate 
}: LoanInputFormProps) {
  const { t } = useTranslation();
  const form = useForm<LoanFormValues>({
    // TODO: Restore resolver when dependency is fixed
    // resolver: zodResolver(loanFormSchema),
    defaultValues: {
      principal: loanDetails.principal,
      interestRate: loanDetails.interestRate,
      loanTerm: loanDetails.loanTerm
    }
  });

  const onSubmit = (values: LoanFormValues) => {
    setLoanDetails({
      principal: values.principal,
      interestRate: values.interestRate,
      loanTerm: values.loanTerm
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('form.loanAmountTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{t('form.currency')}</span>
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
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('form.interestRate')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('form.interestRateTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      min="0.1"
                      max="20"
                      step="0.1"
                      className="pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </FormControl>
                {form.formState.errors.interestRate && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.interestRate.message}
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{t('form.loanTermTooltip')}</p>
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
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-primary-600 hover:bg-primary-700"
            >
              {t('form.calculate')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
