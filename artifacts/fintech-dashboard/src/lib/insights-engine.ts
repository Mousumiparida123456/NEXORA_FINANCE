import { Transaction } from "@/components/transactions/transactionData";
import { format, parseISO, startOfMonth, subMonths, isSameMonth } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  "Housing": "#ef4444",
  "Rent & Housing": "#ef4444",
  "Food": "#f59e0b",
  "Food & Dining": "#f59e0b",
  "Shopping": "#f97316",
  "Transport": "#3b82f6",
  "Utilities": "#22c55e",
  "Education": "#3b82f6",
  "Health": "#14b8a6",
  "Entertainment": "#8b5cf6",
  "Other": "#64748b",
};

export interface CategoryTrend {
  month: string;
  [key: string]: string | number; // e.g. "Housing": 850
}

export interface TopCategory {
  name: string;
  amount: number;
  value: number; // percentage
  transactions: number;
  color: string;
}

export interface MonthlyComparison {
  month: string;
  income: number;
  expenses: number;
  dateObj: Date;
}

export interface MonthlyBreakdown extends MonthlyComparison {
  change: string;
  net: number;
  savings: number; // percentage
}

export function calculateTopCategories(transactions: Transaction[]): TopCategory[] {
  const expenses = transactions.filter(t => t.type === "expense");
  let totalExpenses = 0;
  const map = new Map<string, { amount: number; txns: number }>();

  expenses.forEach(tx => {
    if (!tx.date) return;
    const amt = Number(tx.amount);
    totalExpenses += amt;
    const existing = map.get(tx.category) || { amount: 0, txns: 0 };
    map.set(tx.category, { amount: existing.amount + amt, txns: existing.txns + 1 });
  });

  if (totalExpenses === 0) return [];

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      value: (data.amount / totalExpenses) * 100,
      transactions: data.txns,
      color: CATEGORY_COLORS[name] || "#64748b"
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateCategoryTrends(transactions: Transaction[], topCategories: TopCategory[]): CategoryTrend[] {
  const top4Names = topCategories.slice(0, 4).map(c => c.name);
  if (top4Names.length === 0) return [];

  const trends: CategoryTrend[] = [];
  const now = new Date();

  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const monthStr = format(d, "MMM");
    const monthTxns = transactions.filter(tx => tx.date && isSameMonth(parseISO(tx.date), d) && tx.type === "expense");
    
    const trendObj: CategoryTrend = { month: monthStr };
    top4Names.forEach(cat => {
      const sum = monthTxns.filter(tx => tx.category === cat).reduce((acc, tx) => acc + Number(tx.amount), 0);
      trendObj[cat] = sum;
    });
    trends.push(trendObj);
  }

  return trends;
}

export function calculateMonthlyComparison(transactions: Transaction[]): MonthlyBreakdown[] {
  const data: MonthlyComparison[] = [];
  const now = new Date();

  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const monthTxns = transactions.filter(tx => tx.date && isSameMonth(parseISO(tx.date), d));
    
    const income = monthTxns.filter(tx => tx.type === "income").reduce((acc, tx) => acc + Number(tx.amount), 0);
    const expenses = monthTxns.filter(tx => tx.type === "expense").reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    data.push({
      month: format(d, "MMM yyyy"),
      income,
      expenses,
      dateObj: d
    });
  }

  const breakdown: MonthlyBreakdown[] = data.map((curr, idx) => {
    let change = "—";
    if (idx > 0) {
      const prev = data[idx - 1];
      if (prev.expenses > 0) {
        const diff = ((curr.expenses - prev.expenses) / prev.expenses) * 100;
        change = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
      }
    }
    
    const net = curr.income - curr.expenses;
    const savings = curr.income > 0 ? Math.round((net / curr.income) * 100) : 0;

    return {
      ...curr,
      change,
      net,
      savings
    };
  });

  // UI expects descending order (newest first)
  return breakdown.reverse();
}

export function calculateAIConfidence(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  
  // Score out of 100 based on history length and transaction volume
  const dates = transactions.map(t => new Date(t.date || "").getTime()).filter(t => !isNaN(t));
  if (dates.length === 0) return 0;
  
  const oldest = Math.min(...dates);
  const newest = Math.max(...dates);
  const monthsDiff = (newest - oldest) / (1000 * 60 * 60 * 24 * 30);
  
  let score = 50; // Base score if they have any transactions
  score += Math.min(25, monthsDiff * 5); // +5 per month of history, max 25
  score += Math.min(25, transactions.length * 0.5); // +0.5 per transaction, max 25
  
  return Math.round(score);
}

export function calculateMarketSentiment(transactions: Transaction[]): number {
  if (transactions.length === 0) return 50;
  
  const expenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.amount), 0);
  const income = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  
  if (income === 0) return expenses > 0 ? 10 : 50;
  
  const savingsRatio = (income - expenses) / income;
  
  // 20% savings = 100 sentiment
  let score = 50 + (savingsRatio / 0.2) * 50;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function generateSmartInsights(transactions: Transaction[], breakdowns: MonthlyBreakdown[]): string[] {
  if (transactions.length < 5) {
    return [
      "We need a bit more data to generate personalized insights.",
      "Try adding your past month's expenses and income.",
      "Connecting more data points increases AI confidence."
    ];
  }

  const insights: string[] = [];
  
  if (breakdowns.length >= 2) {
    const current = breakdowns[0]; // Newest
    const prev = breakdowns[1];

    if (current.expenses > prev.expenses && prev.expenses > 0) {
      const diff = ((current.expenses - prev.expenses) / prev.expenses) * 100;
      insights.push(`Your overall expenses increased by ${diff.toFixed(1)}% this month compared to last month.`);
    } else if (current.expenses < prev.expenses && prev.expenses > 0) {
      const diff = ((prev.expenses - current.expenses) / prev.expenses) * 100;
      insights.push(`Great job! You spent ${diff.toFixed(1)}% less this month compared to last month.`);
    }

    if (current.savings > prev.savings) {
      insights.push(`Your savings rate improved from ${prev.savings}% to ${current.savings}%. Keep it up!`);
    } else if (current.savings < prev.savings && current.savings < 10) {
      insights.push(`Warning: Your savings rate dropped to ${current.savings}%. Try to keep it above 20%.`);
    }
  }

  // Find most frequent category this month
  const currentMonthTxns = transactions.filter(tx => tx.date && isSameMonth(parseISO(tx.date), new Date()) && tx.type === "expense");
  if (currentMonthTxns.length > 0) {
    const catCounts = new Map<string, number>();
    currentMonthTxns.forEach(tx => {
      catCounts.set(tx.category, (catCounts.get(tx.category) || 0) + 1);
    });
    const mostFreq = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (mostFreq && mostFreq[1] > 3) {
      insights.push(`You've made ${mostFreq[1]} transactions in '${mostFreq[0]}' this month. Small repeated purchases add up fast.`);
    }
  }

  // Large transactions
  const largeThreshold = transactions.reduce((acc, t) => acc + Number(t.amount), 0) / transactions.length * 3;
  const largeTxns = currentMonthTxns.filter(t => Number(t.amount) > largeThreshold);
  if (largeTxns.length > 0) {
    insights.push(`You had ${largeTxns.length} unusually large expenses this month. Ensure these were planned.`);
  }

  // Fallbacks
  if (insights.length === 0) {
    insights.push("Your spending patterns look completely normal and stable this month.");
    insights.push("Keep tracking your daily expenses to maintain this consistency.");
    insights.push("Consider investing any surplus savings into a diversified portfolio.");
  }

  return insights;
}

export function calculateNextMilestone(transactions: Transaction[]) {
  const expenses = transactions.filter(t => t.type === "expense");
  if (expenses.length === 0) {
    return { title: "Emergency Fund", remaining: "₹30,000", years: "1.0 years", progressPct: 0 };
  }

  const oldestDate = new Date(Math.min(...expenses.map(t => new Date(t.date || "").getTime() || Date.now())));
  const monthsDiff = Math.max(1, (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const totalExpenses = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
  const avgMonthlyExpense = totalExpenses / monthsDiff;
  
  const emergencyFundTarget = avgMonthlyExpense * 3; // 3 months of expenses
  
  const income = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  const totalSavings = income - totalExpenses;
  
  if (totalSavings >= emergencyFundTarget && emergencyFundTarget > 0) {
    return { title: "Financial Freedom", remaining: `₹${(emergencyFundTarget * 10).toLocaleString()}`, years: "4.2 years", progressPct: 15 };
  }
  
  const remaining = Math.max(0, emergencyFundTarget - totalSavings);
  const progress = emergencyFundTarget > 0 ? Math.min(100, Math.max(0, (totalSavings / emergencyFundTarget) * 100)) : 0;
  
  // Predict time
  const monthlySavings = (income - totalExpenses) / monthsDiff;
  let years = "∞";
  if (monthlySavings > 0) {
    years = (remaining / monthlySavings / 12).toFixed(1) + " years";
  }

  return { 
    title: "Emergency Fund (3mo)", 
    remaining: `₹${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
    years, 
    progressPct: progress 
  };
}
