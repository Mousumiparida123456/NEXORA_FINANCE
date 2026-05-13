import { Transaction } from "@/components/transactions/transactionData";
import { format, isSameMonth, parseISO, subMonths } from "date-fns";
import { CategorySlice, RecurringPattern, TransactionTotals } from "./types";

export function getTransactionTotals(transactions: Transaction[]): TransactionTotals {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  return { income, expenses, net: income - expenses };
}

export function getMonthlyTrends(transactions: Transaction[], months = 6) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => subMonths(now, months - 1 - i)).map((d) => {
    const monthTx = transactions.filter((t) => t.date && isSameMonth(parseISO(t.date), d));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { month: format(d, "MMM"), income, expenses, net: income - expenses };
  });
}

export function getCategorySlices(transactions: Transaction[]): CategorySlice[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const map = new Map<string, number>();
  expenses.forEach((t) => map.set(t.category, (map.get(t.category) || 0) + Number(t.amount)));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export function getRecurringPatterns(transactions: Transaction[]): RecurringPattern[] {
  if (transactions.length < 2) return [];
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((tx) => {
    const baseKey = tx.type === "income"
      ? (tx.category || tx.description || "").toLowerCase().trim()
      : (tx.description || tx.category || "").toLowerCase().trim();
    const key = `${baseKey}:${tx.type}`;
    groups.set(key, [...(groups.get(key) || []), tx]);
  });

  const recurring: RecurringPattern[] = [];
  groups.forEach((txns, key) => {
    if (txns.length < 2) return;
    const amounts = txns.map((t) => Number(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const consistentAmount = amounts.every((a) => Math.abs(a - avgAmount) / Math.max(avgAmount, 1) < 0.25);
    if (!consistentAmount) return;

    const sorted = [...txns].sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    const dates = sorted.map((t) => new Date(t.date || "").getTime()).filter((d) => !Number.isNaN(d));
    if (dates.length < 2) return;
    const avgGapDays = dates.slice(0, -1).reduce((sum, d, i) => sum + Math.abs(d - dates[i + 1]) / (1000 * 60 * 60 * 24), 0) / (dates.length - 1);

    let frequency: RecurringPattern["frequency"] | null = null;
    if (avgGapDays >= 22 && avgGapDays <= 40) frequency = "monthly";
    else if (avgGapDays >= 5 && avgGapDays <= 10) frequency = "weekly";
    else if (avgGapDays >= 80 && avgGapDays <= 105) frequency = "quarterly";
    else if (avgGapDays >= 330 && avgGapDays <= 390) frequency = "yearly";

    if (!frequency && sorted[0].type === "income") {
      const text = `${sorted[0].category} ${sorted[0].description}`.toLowerCase();
      if (text.includes("salary")) frequency = "monthly";
    }
    if (!frequency) return;

    recurring.push({
      key,
      category: sorted[0].category,
      amount: Math.round(avgAmount),
      direction: sorted[0].type,
      frequency,
      lastDate: sorted[0].date || "",
      occurrences: txns.length,
    });
  });
  return recurring.sort((a, b) => b.amount - a.amount);
}

