import { useMemo, useState } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Clock, BellRing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/dashboard-context";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { addDays, addMonths, differenceInDays, format, isSameMonth, parseISO, subMonths } from "date-fns";
import { detectRecurringTransactions } from "@/lib/insights-engine";

const BILL_KEYWORDS = ["electricity", "netflix", "internet", "emi", "rent", "credit card", "bill", "utility"];
const BILL_CATEGORIES = ["bills", "utilities", "housing", "health", "entertainment", "transport", "education", "rent & housing"];
const WARNING_CATEGORY = "utilities";

type BillStatus = "overdue" | "upcoming" | "paid";

interface SmartBill {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  recurring: boolean;
  frequency: string;
}

const statusStyles: Record<BillStatus, string> = {
  overdue: "bg-rose-500/10 text-rose-500 border border-rose-500/10",
  upcoming: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/10",
  paid: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10",
};

const statusLabel: Record<BillStatus, string> = {
  overdue: "Overdue",
  upcoming: "Upcoming",
  paid: "Paid",
};

function isBillLike(category: string, description: string) {
  const c = (category || "").toLowerCase();
  const d = (description || "").toLowerCase();
  return BILL_CATEGORIES.includes(c) || BILL_KEYWORDS.some((kw) => c.includes(kw) || d.includes(kw));
}

function nextDueDate(lastDate: string, frequency: string) {
  const base = lastDate ? parseISO(lastDate) : new Date();
  if (frequency === "weekly") return addDays(base, 7);
  if (frequency === "quarterly") return addMonths(base, 3);
  if (frequency === "yearly") return addMonths(base, 12);
  return addMonths(base, 1);
}

export function Bills() {
  const { theme, formatCurrency } = useDashboard();
  const { transactions } = useTransactions();
  const isDark = theme === "dark";
  const [manuallyPaid, setManuallyPaid] = useState<Record<string, boolean>>({});

  const recurring = useMemo(() => detectRecurringTransactions(transactions), [transactions]);

  const bills = useMemo<SmartBill[]>(() => {
    const now = new Date();

    const recurringBills: SmartBill[] = recurring
      .filter((r) => r.direction === "expense" && isBillLike(r.category, r.title))
      .map((r) => {
        const due = nextDueDate(r.lastDate, r.frequency || "monthly");
        const daysLeft = differenceInDays(due, now);
        const id = `rec-${r.id}`;
        return {
          id,
          title: r.title,
          category: r.category,
          amount: r.amount,
          dueDate: format(due, "yyyy-MM-dd"),
          status: daysLeft < 0 ? "overdue" : "upcoming",
          recurring: true,
          frequency: r.frequency || "monthly",
        };
      });

    const oneOffBills: SmartBill[] = transactions
      .filter((tx) => tx.type === "expense" && isBillLike(tx.category, tx.description || ""))
      .map((tx) => {
        const txDate = tx.date ? parseISO(tx.date) : new Date();
        const due = addMonths(txDate, 1);
        const daysLeft = differenceInDays(due, now);
        return {
          id: `txn-${tx.id}`,
          title: tx.description || tx.category,
          category: tx.category,
          amount: Number(tx.amount),
          dueDate: format(due, "yyyy-MM-dd"),
          status: daysLeft < 0 ? "overdue" : "upcoming",
          recurring: false,
          frequency: "one-off",
        };
      });

    const merged = [...recurringBills, ...oneOffBills];
    const dedup = new Map<string, SmartBill>();
    for (const b of merged) {
      const key = `${b.title.toLowerCase()}-${b.category.toLowerCase()}`;
      const existing = dedup.get(key);
      if (!existing || b.recurring) dedup.set(key, b);
    }

    const rows = Array.from(dedup.values()).map((b) => ({
      ...b,
      status: manuallyPaid[b.id] ? "paid" : b.status,
    }));

    const order: Record<BillStatus, number> = { overdue: 0, upcoming: 1, paid: 2 };
    return rows.sort((a, b) => order[a.status] - order[b.status] || b.amount - a.amount);
  }, [transactions, recurring, manuallyPaid]);

  const monthlyBillTotal = useMemo(() => bills.reduce((sum, b) => sum + b.amount, 0), [bills]);
  const paidTotal = useMemo(() => bills.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.amount, 0), [bills]);
  const unpaidTotal = monthlyBillTotal - paidTotal;
  const overdueCount = bills.filter((b) => b.status === "overdue").length;
  const upcomingCount = bills.filter((b) => b.status === "upcoming").length;
  const paidPct = monthlyBillTotal > 0 ? Math.round((paidTotal / monthlyBillTotal) * 100) : 0;
  const nextMonthPrediction = monthlyBillTotal;

  const utilityWarning = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions
      .filter((t) => t.type === "expense" && (t.category || "").toLowerCase().includes(WARNING_CATEGORY))
      .filter((t) => t.date && isSameMonth(parseISO(t.date), now))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const prevMonthDate = subMonths(now, 1);
    const prevMonth = transactions
      .filter((t) => t.type === "expense" && (t.category || "").toLowerCase().includes(WARNING_CATEGORY))
      .filter((t) => t.date && isSameMonth(parseISO(t.date), prevMonthDate))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (prevMonth <= 0 || thisMonth <= prevMonth) return "";
    const increase = ((thisMonth - prevMonth) / prevMonth) * 100;
    if (increase < 10) return "";
    return `Your electricity/utilities bill increased ${increase.toFixed(0)}% this month.`;
  }, [transactions]);

  return (
    <main className={cn("container mx-auto px-4 py-8 pb-16")}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-950")}>Smart Bill Manager</h1>
          <p className={cn("mt-1.5 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
            Auto-detected from recurring expense transactions with due-date prediction and payment tracking.
          </p>
        </div>

        <div className="rounded-3xl border p-4 text-sm font-semibold shadow-sm" style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: isDark ? "rgba(148,163,184,0.12)" : "rgba(226,232,240,1)" }}>
          <div className="flex items-center gap-2 text-slate-500">
            <CreditCard className="h-4 w-4" />
            Unpaid total
          </div>
          <p className={cn("mt-1 text-2xl font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{formatCurrency(unpaidTotal)}</p>
          <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
            {overdueCount > 0 && <span className="text-rose-500">{overdueCount} overdue · </span>}
            {upcomingCount} upcoming
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Monthly bill analytics</p>
            <p className={cn("mt-2 text-xl font-bold", isDark ? "text-slate-100" : "text-slate-900")}>{formatCurrency(monthlyBillTotal)}</p>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Detected bill spend this cycle</p>
          </CardContent>
        </Card>
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Payment progress</p>
            <p className={cn("mt-2 text-xl font-bold", isDark ? "text-slate-100" : "text-slate-900")}>{paidPct}% paid</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200/80" style={{ backgroundColor: isDark ? "rgba(148,163,184,0.15)" : "#e2e8f0" }}>
              <div className="h-2 rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${paidPct}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Next month prediction</p>
            <p className={cn("mt-2 text-xl font-bold", isDark ? "text-slate-100" : "text-slate-900")}>{formatCurrency(nextMonthPrediction)}</p>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Based on recurring bill patterns</p>
          </CardContent>
        </Card>
      </div>

      {utilityWarning && (
        <div className={cn("mb-6 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium", "border-amber-400/30 bg-amber-400/10 text-amber-500")}>
          <BellRing className="h-4 w-4" />
          {utilityWarning}
        </div>
      )}

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CreditCard className="mb-4 h-12 w-12 text-slate-400" />
          <h3 className={cn("text-lg font-semibold", isDark ? "text-slate-100" : "text-slate-900")}>No bill patterns detected</h3>
          <p className={cn("mt-2 max-w-sm text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
            Add recurring transactions like rent, electricity, internet, EMI, or subscriptions to auto-generate your bill manager.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <Card key={bill.id} className={cn("border shadow-sm", isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={cn("text-base font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>{bill.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span>{bill.category}</span>
                        <span>·</span>
                        <span>Due: {bill.dueDate}</span>
                        <span>·</span>
                        <span>{bill.frequency}</span>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[bill.status])}>
                      {statusLabel[bill.status]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {bill.status === "overdue" && <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />}
                  {bill.status === "paid" && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                  {bill.status === "upcoming" && <Clock className="h-5 w-5 text-indigo-500 flex-shrink-0" />}
                  <p className={cn("text-lg font-semibold", bill.status === "overdue" ? "text-rose-500" : isDark ? "text-slate-100" : "text-slate-900")}>
                    {formatCurrency(bill.amount)}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={bill.status === "paid" ? "outline" : "default"}
                    onClick={() => setManuallyPaid((cur) => ({ ...cur, [bill.id]: !cur[bill.id] }))}
                  >
                    {bill.status === "paid" ? "Mark Unpaid" : "Pay Bill"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

