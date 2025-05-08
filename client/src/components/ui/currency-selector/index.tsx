import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
];

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

// Helper function to get currency symbol from code
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : CURRENCIES[0].symbol;
}

export default CurrencySelector;