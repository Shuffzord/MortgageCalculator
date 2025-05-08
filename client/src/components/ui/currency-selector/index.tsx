import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { CURRENCIES } from "@/lib/utils";

export interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2">
      <Label htmlFor="currency-select">{t('form.currency')}</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger id="currency-select" className="w-full">
          <SelectValue placeholder={t('form.selectCurrency')} />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center">
                <span className="mr-2">{currency.symbol}</span>
                <span>{currency.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default CurrencySelector;