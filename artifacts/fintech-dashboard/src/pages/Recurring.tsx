import { useMemo } from "react";
import { AlertTriangle, CalendarClock, RefreshCcw, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { useTransactions } from "@/hooks/useTransactions";
import { detectRecurringTransactions, type RecurringTransaction } from "@/lib/insights-engine";
import { cn } from "@/lib/utils";
import { addDays, addMonths, format, parseISO, subMonths } from "date-fns";

const SUBSCRIPTION_KEYWORDS = [
  "netflix",
  "spotify",
  "prime",
  "youtube",
  "subscription",
  "apple",
  "google one",
  "hotstar",
];

function normalizeMonthlyAmount(item: RecurringTransaction): number {
  if (item.frequency === "weekly") return item.amount * 4;
  if (item.frequency === "quarterly") return item.amount / 3;
  if (item.frequency === "yearly") return item.amount / 12;
  return item.amount;
}

function yearlyCost(item: RecurringTransaction): number {
  if (item.frequency === "weekly") return item.amount * 52;
  if (item.frequency === "quarterly") return item.amount * 4;
  if (item.frequency === "yearly") return item.amount;
  return item.amount * 12;
}

function nextDate(item: RecurringTransaction): string {
  if (!item.lastDate) return "N/A";
  const d = parseISO(item.lastDate);
  if (Number.isNaN(d.getTime())) return "N/A";
  if (item.frequency === "weekly") return format(addDays(d, 7), "yyyy-MM-dd");
  if (item.frequency === "quarterly") return format(addMonths(d, 3), "yyyy-MM-dd");
  if (item.frequency === "yearly") return format(addMonths(d, 12), "yyyy-MM-dd");
  return format(addMonths(d, 1), "yyyy-MM-dd");
}

function isSubscription(item: RecurringTransaction): boolean {
  const text = `${item.title} ${item.category}`.toLowerCase();
  return SUBSCRIPTION_KEYWORDS.some((k) => text.includes(k));
}

export function Recurring() {
  const { theme, formatCurrency } = useDashboard();
  const { transactions } = useTransactions();
  const isDark = theme === "dark";

  const recurringItems = useMemo(() => detectRecurringTransactions(transactions), [transactions]);
  const recurringExpense = useMemo(() => recurringItems.filter((i) => i.direction === "expense"), [recurringItems]);
  const recurringIncome = useMemo(() => recurringItems.filter((i) => i.direction === "income"), [recurringItems]);
  const subscriptions = useMemo(() => recurringExpense.filter((i) => isSubscription(i)), [recurringExpense]);

  const monthlyExpenseTotal = useMemo(
    () => recurringExpense.reduce((sum, item) => sum + normalizeMonthlyAmount(item), 0),
    [recurringExpense],
  );
  const monthlyIncomeTotal = useMemo(
    () => recurringIncome.reduce((sum, item) => sum + normalizeMonthlyAmount(item), 0),
    [recurringIncome],
  );
  const monthlyNet = monthlyIncomeTotal - monthlyExpenseTotal;

  const yearlySubscriptionCost = useMemo(
    () => subscriptions.reduce((sum, item) => sum + yearlyCost(item), 0),
    [subscriptions],
  );

  // "Unused" heuristic: subscription exists but has very few occurrences in the last 6 months.
  const unusedSubscriptions = useMemo(() => {
    const cutoff = subMonths(new Date(), 6).getTime();
    return subscriptions.filter((sub) => {
      const text = `${sub.title} ${sub.category}`.toLowerCase();
      const hits = transactions.filter((tx) => {
        if (tx.type !== "expense") return false;
        const txTime = tx.date ? parseISO(tx.date).getTime() : 0;
        if (!txTime || txTime < cutoff) return false;
        const source = `${tx.description || ""} ${tx.category || ""}`.toLowerCase();
        return source.includes(sub.title.toLowerCase()) || source.includes(text);
      }).length;
      return hits <= 2;
    });
  }, [subscriptions, transactions]);

  const cancelRecommendationAmount = useMemo(
    () => unusedSubscriptions.reduce((sum, item) => sum + yearlyCost(item), 0),
    [unusedSubscriptions],
  );

  return (
    <main className={cn("container mx-auto px-4 py-8 pb-16")}>
      <div className="mb-8">
        <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-950")}>
          Recurring Detector
        </h1>
        <p className={cn("mt-1.5 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
          Auto-detected salary, subscriptions, rent, EMI, and repeating expenses from your real transaction history.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Recurring Income</p>
            <p className="mt-2 text-2xl font-bold text-emerald-500">+{formatCurrency(monthlyIncomeTotal)}</p>
          </CardContent>
        </Card>
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Recurring Expense</p>
            <p className="mt-2 text-2xl font-bold text-rose-500">-{formatCurrency(monthlyExpenseTotal)}</p>
          </CardContent>
        </Card>
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Monthly Net</p>
            <p className={cn("mt-2 text-2xl font-bold", monthlyNet >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {monthlyNet >= 0 ? "+" : ""}{formatCurrency(monthlyNet)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Yearly Subscription Cost</p>
            <p className="mt-2 text-2xl font-bold text-amber-500">{formatCurrency(yearlySubscriptionCost)}</p>
          </CardContent>
        </Card>
      </div>

      {unusedSubscriptions.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              Cancel recommendation: You may be spending {formatCurrency(cancelRecommendationAmount)}/year on low-use subscriptions.
            </div>
          </div>
        </div>
      )}

      {recurringItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCcw className="mb-4 h-12 w-12 text-slate-400" />
          <h3 className={cn("text-lg font-semibold", isDark ? "text-slate-100" : "text-slate-900")}>No recurring patterns detected</h3>
          <p className={cn("mt-2 max-w-sm text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
            Add repeated transactions with similar amount and interval to unlock salary/subscription detection.
          </p>
        </div>
      ) : (
        <section className="space-y-6">
          {recurringIncome.length > 0 && (
            <div>
              <h2 className={cn("mb-4 text-xl font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>Recurring Income</h2>
              <div className="grid gap-4">
                {recurringIncome.map((item) => (
                  <Card key={item.id} className={cn("border shadow-sm", isDark ? "border-emerald-900/30 bg-slate-950" : "border-emerald-100 bg-white")}>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <p className={cn("text-base font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{item.title}</p>
                        </div>
                        <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                          {item.category} · {item.frequency} · Next credit: {nextDate(item)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-emerald-500">+{formatCurrency(item.amount)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recurringExpense.length > 0 && (
            <div>
              <h2 className={cn("mb-4 text-xl font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>Subscriptions & Recurring Expenses</h2>
              <div className="grid gap-4">
                {recurringExpense.map((item) => {
                  const isSub = isSubscription(item);
                  return (
                    <Card key={item.id} className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
                      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                            <p className={cn("text-base font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{item.title}</p>
                            {isSub && (
                              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500">
                                Subscription
                              </span>
                            )}
                          </div>
                          <div className={cn("flex flex-wrap items-center gap-3 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                            <span>{item.category}</span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Next debit: {nextDate(item)}
                            </span>
                            <span>Yearly: {formatCurrency(yearlyCost(item))}</span>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-rose-500">-{formatCurrency(item.amount)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

