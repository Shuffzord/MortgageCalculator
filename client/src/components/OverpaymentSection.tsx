import { OverpaymentDetails } from "@/lib/types";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

const overpaymentFormSchema = z.object({
  amount: z.coerce.number()
    .min(0, "Overpayment amount must be a positive number"),
  afterPayment: z.coerce.number()
    .min(1, "Payment number must be at least 1")
    .max(359, "Payment number must be less than 360"),
  effect: z.enum(['reduceTerm', 'reducePayment'])
});

type OverpaymentFormValues = z.infer<typeof overpaymentFormSchema>;

interface OverpaymentSectionProps {
  overpaymentDetails: OverpaymentDetails;
  setOverpaymentDetails: (overpaymentDetails: OverpaymentDetails) => void;
  onApplyOverpayment: () => void;
}

export default function OverpaymentSection({
  overpaymentDetails,
  setOverpaymentDetails,
  onApplyOverpayment
}: OverpaymentSectionProps) {
  const { t } = useTranslation();
  const form = useForm<OverpaymentFormValues>({
    // TODO: Restore resolver when dependency is fixed
    // resolver: zodResolver(overpaymentFormSchema),
    defaultValues: {
      amount: overpaymentDetails.amount,
      afterPayment: overpaymentDetails.afterPayment,
      effect: overpaymentDetails.effect
    }
  });

  const onSubmit = (values: OverpaymentFormValues) => {
    setOverpaymentDetails({
      amount: values.amount,
      afterPayment: values.afterPayment,
      effect: values.effect
    });
    onApplyOverpayment();
  };

  return (
    <div className="border-t border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('overpayment.title')}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  {t('overpayment.amount')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Additional one-time payment toward your loan principal.</p>
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
                      min="0"
                      step="1000"
                      className="pl-7"
                    />
                  </div>
                </FormControl>
                {form.formState.errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="afterPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('overpayment.afterPayment')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    max="359"
                    step="1"
                  />
                </FormControl>
                {form.formState.errors.afterPayment && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.afterPayment.message}
                  </p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="effect"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('overpayment.effect')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reduceTerm" id="reduceTerm" />
                      <Label htmlFor="reduceTerm">{t('overpayment.reduceTerm')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reducePayment" id="reducePayment" />
                      <Label htmlFor="reducePayment">{t('overpayment.reducePayment')}</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-success-500 hover:bg-green-600"
            >
              Apply Overpayment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
