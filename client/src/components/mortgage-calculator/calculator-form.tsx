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
import { LoanDetails } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { cn, getCurrencySymbol } from "@/lib/utils";

// Form validation schema
const loanFormSchema = z.object({
  name: z.string().min(1, "Name is required").default("My Calculation"),
  principal: z.coerce.number().min(1000, "Loan amount must be at least $1,000"),
  loanTerm: z.coerce.number()
    .min(1, "Loan term must be at least 1 year")
    .max(50, "Loan term must be at most 50 years"),
  startDate: z.date().default(() => new Date()),
  interestRatePeriods: z.array(
    z.object({
      startMonth: z.coerce.number().min(0, "Start month must be at least 0"),
      interestRate: z.coerce.number().min(0, "Interest rate must be at least 0")
    })
  ).default([{ startMonth: 0, interestRate: 5 }]),
  overpaymentPlans: z.array(
    z.object({
      amount: z.coerce.number().min(0, "Amount must be at least 0"),
      startMonth: z.coerce.number().min(0, "Start month must be at least 0"),
      endMonth: z.coerce.number().min(0, "End month must be at least 0"),
      frequency: z.enum(['monthly', 'quarterly', 'annual', 'one-time']),
      effect: z.enum(['reduceTerm', 'reducePayment'])
    })
  ).default([])
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
    defaultValues: {
      name: loanDetails.name,
      principal: loanDetails.principal,
      loanTerm: loanDetails.loanTerm,
      startDate: loanDetails.startDate,
      interestRatePeriods: loanDetails.interestRatePeriods,
      overpaymentPlans: loanDetails.overpaymentPlans
    },
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
                        <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(form.getValues("currency") || "USD")}</span>
                      </div>
                      <Input
                        id="principal-input"
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

            {/* Interest Rate Periods */}
            <FormField
              control={form.control}
              name="interestRatePeriods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate Periods</FormLabel>
                  {field.value.map((period, index) => (
                    <div key={index} className="flex flex-col space-y-2 border p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <FormLabel>Period {index + 1}</FormLabel>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const newPeriods = [...field.value];
                          newPeriods.splice(index, 1);
                          form.setValue("interestRatePeriods", newPeriods);
                        }}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <FormLabel htmlFor={`startMonth-${index}`}>Start Month</FormLabel>
                          <Input
                            type="number"
                            id={`startMonth-${index}`}
                            placeholder="Start Month"
                            value={period.startMonth}
                            onChange={(e) => {
                              const newPeriods = [...field.value];
                              newPeriods[index].startMonth = Number(e.target.value);
                              field.onChange(newPeriods);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor={`interestRate-${index}`}>Interest Rate</FormLabel>
                          <Input
                            type="number"
                            id={index === 0 ? "interest-rate-input" : `interestRate-${index}`}
                            placeholder="Interest Rate"
                            value={period.interestRate}
                            onChange={(e) => {
                              const newPeriods = [...field.value];
                              newPeriods[index].interestRate = Number(e.target.value);
                              field.onChange(newPeriods);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" onClick={() => {
                    form.setValue("interestRatePeriods", [...field.value, { startMonth: 0, interestRate: 5 }]);
                  }}>Add Period</Button>
                </FormItem>
              )}
            />

            {/* Overpayment Plans */}
            <FormField
              control={form.control}
              name="overpaymentPlans"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overpayment Plans</FormLabel>
                  {field.value.map((plan, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                      <FormLabel>Plan {index + 1}</FormLabel>
                      <div className="flex space-x-2">
                        <div>
                          <FormLabel>Amount</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(loanDetails.currency || 'USD')}</span>
                            </div>
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={plan.amount}
                              className="pl-7"
                              onChange={(e) => {
                                const newPlans = [...field.value];
                                newPlans[index].amount = Number(e.target.value);
                                field.onChange(newPlans);
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <FormLabel>Start Month</FormLabel>
                          <Input
                            type="number"
                            placeholder="Start Month"
                            value={plan.startMonth}
                            onChange={(e) => {
                              const newPlans = [...field.value];
                              newPlans[index].startMonth = Number(e.target.value);
                              field.onChange(newPlans);
                            }}
                          />
                        </div>
                        <div>
                          <FormLabel>End Month</FormLabel>
                          <Input
                            type="number"
                            placeholder="End Month"
                            value={plan.endMonth || ""}
                            onChange={(e) => {
                              const newPlans = [...field.value];
                              newPlans[index].endMonth = Number(e.target.value);
                              field.onChange(newPlans);
                            }}
                          />
                        </div>
                        <div>
                          <FormLabel>Frequency</FormLabel>
                          <select
                            value={plan.frequency}
                            onChange={(e) => {
                              const newPlans = [...field.value];
                              newPlans[index].frequency = e.target.value as any;
                              field.onChange(newPlans);
                            }}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annual">Annual</option>
                            <option value="one-time">One-Time</option>
                          </select>
                        </div>
                        <div>
                          <FormLabel>Effect</FormLabel>
                          <select
                            value={plan.effect}
                            onChange={(e) => {
                              const newPlans = [...field.value];
                              newPlans[index].effect = e.target.value as any;
                              field.onChange(newPlans);
                            }}
                          >
                            <option value="reduceTerm">Reduce Term</option>
                            <option value="reducePayment">Reduce Payment</option>
                          </select>
                        </div>
                      </div>
                      <Button type="button" onClick={() => {
                        const newPlans = [...field.value];
                        newPlans.splice(index, 1);
                        form.setValue("overpaymentPlans", newPlans);
                      }}>Remove Plan</Button>
                    </div>
                  ))}
                  <Button type="button" onClick={() => {
                    form.setValue("overpaymentPlans", [...field.value, { amount: 0, startMonth: 0, endMonth: 0, frequency: "monthly", effect: "reduceTerm", startDate: new Date(), isRecurring: true }]);
                  }}>Add Overpayment Plan</Button>
                </FormItem>
              )}
            />

            {/* Loan Term Input */}
            <FormField
              control={form.control}
              name="loanTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Term (Years)</FormLabel>
                  <FormControl>
                    <Input
                      id="loan-term-input"
                      type="number"
                      placeholder="30"
                      min={1}
                      max={50}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Repayment Model */}
            <FormField
              control={form.control}
              name="repaymentModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repayment Model</FormLabel>
                  <FormControl>
                    <select
                      id="repayment-model-selector"
                      className="w-full p-2 border rounded"
                      {...field}
                    >
                      <option value="equalInstallments">Equal Installments</option>
                      <option value="decreasingInstallments">Decreasing Installments</option>
                    </select>
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
