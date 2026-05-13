import { useCurrency } from "@/lib/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-slate-400" />
      <Select
        value={currency}
        onValueChange={(val: any) => setCurrency(val)}
      >
        <SelectTrigger className="h-8 w-[90px] bg-slate-900 border-slate-700 text-slate-200">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
          <SelectItem value="INR">₹ INR</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
          <SelectItem value="EUR">€ EUR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
