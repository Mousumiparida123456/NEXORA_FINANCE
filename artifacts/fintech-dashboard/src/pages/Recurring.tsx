import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Edit3, Play, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

type RecurringItem = {
  id: string;
  title: string;
  category: string;
  frequency: string;
  nextDate: string;
  amount: number;
  direction: "income" | "expense";
  active: boolean;
};

const recurringItems: RecurringItem[] = [
  {
    id: "salary",
    title: "Monthly Salary",
    category: "Salary",
    frequency: "monthly",
    nextDate: "2026-04-30",
    amount: 85000,
    direction: "income",
    active: true,
  },
  {
    id: "rent",
    title: "House Rent",
    category: "Housing",
    frequency: "monthly",
    nextDate: "2026-04-01",
    amount: -12000,
    direction: "expense",
    active: true,
  },
  {
    id: "netflix",
    title: "Netflix",
    category: "Entertainment",
    frequency: "monthly",
    nextDate: "2026-04-20",
    amount: -649,
    direction: "expense",
    active: true,
  },
  {
    id: "gym",
    title: "Gym Membership",
    category: "Health",
    frequency: "monthly",
    nextDate: "2026-04-25",
    amount: -1200,
    direction: "expense",
    active: true,
  },
  {
    id: "phone",
    title: "Phone Bill",
    category: "Utilities",
    frequency: "monthly",
    nextDate: "2026-04-15",
    amount: -599,
    direction: "expense",
    active: false,
  },
];

function formatAmount(amount: number, formatCurrency: (valueInINR: number) => string) {
  return amount >= 0 ? `+${formatCurrency(amount)}` : formatCurrency(amount);
}

export function Recurring() {
  const { theme, formatCurrency } = useDashboard();
  const isDark = theme === "dark";

  const activeRecurring = useMemo(() => recurringItems.filter((item) => item.active), []);
  const inactiveRecurring = useMemo(() => recurringItems.filter((item) => !item.active), []);
  const monthlyTotal = useMemo(
    () => activeRecurring.reduce((sum, item) => sum + item.amount, 0),
    [activeRecurring],
  );

  return (
    <main className={cn("container mx-auto px-4 py-8 pb-16", isDark ? "" : "")}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-950")}>Recurring</h1>
          <p className={cn("mt-1.5 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Manage recurring income and expense schedules.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg">
            <RefreshCcw className="h-4 w-4" />
            Add Recurring
          </Button>
        </div>
      </div>

      <Card className={cn("mb-6 border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className={cn("text-lg font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>Recurring Transactions</CardTitle>
            <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>Monthly net estimate based on active recurring entries.</p>
          </div>
          <div className={cn("rounded-2xl px-4 py-3 text-sm font-semibold", isDark ? "bg-slate-900 text-slate-100 border border-slate-800" : "bg-slate-50 text-slate-900 border border-slate-200")}> 
            {monthlyTotal >= 0 ? "+" : ""}{formatCurrency(monthlyTotal)} / month
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div>
          <div className={cn("mb-4 flex items-center justify-between gap-4", isDark ? "" : "")}> 
            <h2 className={cn("text-xl font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>Active</h2>
          </div>
          <div className="grid gap-4">
            {activeRecurring.map((item) => (
              <Card key={item.id} className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
                <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className={cn("text-base font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{item.title}</p>
                        <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>{item.category} · {item.frequency} · Next: {item.nextDate}</p>
                      </div>
                      <div className={cn("text-lg font-semibold", item.direction === "income" ? "text-emerald-500" : "text-rose-500")}> {formatAmount(item.amount, formatCurrency)}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-3.5 w-3.5" />
                        Generate Now
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        Deactivate
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className={cn("mb-4 flex items-center justify-between gap-4", isDark ? "" : "")}> 
            <h2 className={cn("text-xl font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>Inactive</h2>
          </div>
          <div className="grid gap-4">
            {inactiveRecurring.map((item) => (
              <Card key={item.id} className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
                <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className={cn("text-base font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{item.title}</p>
                        <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>{item.category} · {item.frequency} · Next: {item.nextDate}</p>
                      </div>
                      <div className={cn("text-lg font-semibold", item.direction === "income" ? "text-emerald-500" : "text-rose-500")}> {formatAmount(item.amount, formatCurrency)}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Activate
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
