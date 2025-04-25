import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import CurrencySelector from "@/components/ui/currency-selector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { LoanDetails } from "@/lib/mortgage-calculator";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// Form validation schema
const loanFormSchema = z.object({
  name: z.string().default("My Calculation"),
  principal: z.coerce.number().min(1000, "Loan amount must be at least $1,000"),
  interestRate: z.coerce.number()
    .min(0.1, "Interest rate must be at least 0.1%")
    .max(20, "Interest rate must be at most 20%"),
  loanTerm: z.coerce.number()
    .min(1, "Loan term must be at least 1 year")
    .max(50, "Loan term must be at most 50 years"),
  startDate: z.date().optional().default(() => new Date()),
  overpaymentAmount: z.coerce.number()
    .min(0, "Overpayment amount must be at least 0")
    .default(0),
  overpaymentMonth: z.coerce.number()
    .min(1, "Overpayment month must be at least 1")
    .max(600, "Overpayment month cannot exceed 600")
    .default(12),
  reduceTermNotPayment: z.boolean().default(true),
});

interface CalculatorFormProps {
  loanDetails: LoanDetails;
  onFormSubmit: (values: LoanDetails) => void;
}

export default function CalculatorForm({ loanDetails, onFormSubmit }: CalculatorFormProps) {
  const { t } = useTranslation();
  const form = useForm<LoanDetails>({
    // TODO: Add zodResolver back once the dependency is fixed
    // resolver: zodResolver(loanFormSchema),
    defaultValues: loanDetails,
  });

  const handleSubmit = (values: LoanDetails) => {
    onFormSubmit(values);
  };

  return (
    <Card className="bg-white shadow">
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t('form.loanDetails')}</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Loan Amount */}
            <FormField
              control={form.control}
              name="principal"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Loan Amount</FormLabel>
                    <div className="tooltip">
                      <span className="material-icons text-gray-400 text-sm">help_outline</span>
                      <span className="tooltip-text">The total amount you are borrowing from the lender, typically the home price minus your down payment.</span>
                    </div>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        min={1000}
                        className="pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interest Rate */}
            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Interest Rate (% p.a.)</FormLabel>
                    <div className="tooltip">
                      <span className="material-icons text-gray-400 text-sm">help_outline</span>
                      <span className="tooltip-text">The annual interest rate on your mortgage. This determines how much extra you pay beyond the principal amount.</span>
                    </div>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min={0.1}
                        max={20}
                        placeholder="0.00"
                        className="pr-8"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Term */}
            <FormField
              control={form.control}
              name="loanTerm"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Loan Term (years)</FormLabel>
                    <div className="tooltip">
                      <span className="material-icons text-gray-400 text-sm">help_outline</span>
                      <span className="tooltip-text">The length of time you have to repay the loan. Longer terms mean lower monthly payments but more interest paid overall.</span>
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      placeholder="30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Currency Selector */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CurrencySelector 
                      value={field.value || "USD"} 
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <div className="flex justify-between">
                    <FormLabel>Start Date</FormLabel>
                    <div className="tooltip">
                      <span className="material-icons text-gray-400 text-sm">help_outline</span>
                      <span className="tooltip-text">The date when your mortgage begins. Monthly payments will be calculated from this date.</span>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          style={{ borderColor: "#E5E7EB" }}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Divider for Overpayment section */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <Separator />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-sm text-gray-500">Overpayment (Optional)</span>
              </div>
            </div>

            {/* Overpayment Amount */}
            <FormField
              control={form.control}
              name="overpaymentAmount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Overpayment Amount</FormLabel>
                    <div className="tooltip">
                      <span className="material-icons text-gray-400 text-sm">help_outline</span>
                      <span className="tooltip-text">A one-time extra payment towards your principal. This can help reduce your total interest and either shorten your loan term or lower your monthly payments.</span>
                    </div>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0.00"
                        className="pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Overpayment Month */}
            <FormField
              control={form.control}
              name="overpaymentMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply at Month #</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={360}
                      placeholder="12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Overpayment Effect Selection */}
            <FormField
              control={form.control}
              name="reduceTermNotPayment"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Effect of Overpayment</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="reduceTerm" />
                        <label htmlFor="reduceTerm" className="text-sm text-gray-700">
                          Reduce Term
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="reducePayment" />
                        <label htmlFor="reducePayment" className="text-sm text-gray-700">
                          Reduce Payment
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Calculate
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
