import { Globe } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  const handleCurrencyChange = (value: string) => {
    if (value === "INR" || value === "USD" || value === "EUR") {
      setCurrency(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-slate-400" />

      <Select value={currency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="h-8 w-[90px] border-slate-700 bg-slate-900 text-slate-200">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>

        <SelectContent className="border-slate-700 bg-slate-900 text-slate-200">
          <SelectItem value="INR">₹ INR</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
          <SelectItem value="EUR">€ EUR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
