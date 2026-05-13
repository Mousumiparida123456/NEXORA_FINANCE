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

// =================== RECURRING DETECTION ===================

export interface RecurringTransaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  direction: "income" | "expense";
  frequency: string;
  lastDate: string;
  occurrences: number;
}

export function detectRecurringTransactions(transactions: Transaction[]): RecurringTransaction[] {
  if (transactions.length < 2) return [];

  const groups = new Map<string, Transaction[]>();
  transactions.forEach(tx => {
    const key = `${(tx.description || tx.category).toLowerCase().trim()}:${tx.type}`;
    const existing = groups.get(key) || [];
    groups.set(key, [...existing, tx]);
  });

  const recurring: RecurringTransaction[] = [];

  groups.forEach((txns) => {
    if (txns.length < 2) return;

    const amounts = txns.map(t => Number(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const allConsistent = amounts.every(a => Math.abs(a - avgAmount) / Math.max(avgAmount, 1) < 0.25);
    if (!allConsistent) return;

    const sorted = [...txns].sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    const latest = sorted[0];

    const dates = sorted.map(t => new Date(t.date || "").getTime()).filter(d => !isNaN(d));
    if (dates.length < 2) return;

    const avgGapDays = dates.slice(0, -1).reduce((sum, d, i) =>
      sum + Math.abs(d - dates[i + 1]) / (1000 * 60 * 60 * 24), 0) / (dates.length - 1);

    let frequency = "";
    if (avgGapDays >= 25 && avgGapDays <= 35) frequency = "monthly";
    else if (avgGapDays >= 6 && avgGapDays <= 8) frequency = "weekly";
    else if (avgGapDays >= 85 && avgGapDays <= 95) frequency = "quarterly";
    else if (avgGapDays >= 355 && avgGapDays <= 375) frequency = "yearly";

    if (!frequency) return;

    recurring.push({
      id: `${latest.description || latest.category}-${latest.type}`,
      title: latest.description || latest.category,
      category: latest.category,
      amount: Math.round(avgAmount),
      direction: latest.type === "income" ? "income" : "expense",
      frequency,
      lastDate: latest.date || "",
      occurrences: txns.length,
    });
  });

  return recurring.sort((a, b) => b.amount - a.amount);
}

// =================== INVESTMENT ANALYTICS ===================

export interface InvestmentAnalytics {
  totalInvested: number;
  totalReturns: number;
  netGain: number;
  roiPercent: number;
  monthlyTrend: { month: string; invested: number }[];
  categoryBreakdown: { name: string; amount: number; color: string; value: number }[];
}

const INVESTMENT_CATEGORIES = ["investment", "stocks", "mutual funds", "crypto", "sip", "gold", "real estate"];

export function calculateInvestmentAnalytics(transactions: Transaction[]): InvestmentAnalytics {
  const investTxns = transactions.filter(tx =>
    INVESTMENT_CATEGORIES.some(c => (tx.category || "").toLowerCase().includes(c))
  );

  const invested = investTxns.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const returns = investTxns.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const netGain = returns - invested;
  const roiPercent = invested > 0 ? (netGain / invested) * 100 : 0;

  const now = new Date();
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const monthTxns = investTxns.filter(t => t.date && isSameMonth(parseISO(t.date), d) && t.type === "expense");
    return { month: format(d, "MMM"), invested: monthTxns.reduce((s, t) => s + Number(t.amount), 0) };
  });

  const catMap = new Map<string, number>();
  investTxns.filter(t => t.type === "expense").forEach(tx => {
    catMap.set(tx.category, (catMap.get(tx.category) || 0) + Number(tx.amount));
  });

  const catColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
  const total = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
  const categoryBreakdown = Array.from(catMap.entries()).map(([name, amount], i) => ({
    name, amount, color: catColors[i % catColors.length],
    value: total > 0 ? Math.round((amount / total) * 100) : 0,
  }));

  return { totalInvested: invested, totalReturns: returns, netGain, roiPercent, monthlyTrend, categoryBreakdown };
}

// =================== CREDIT SCORE ESTIMATION ===================

export interface CreditScoreData {
  score: number;
  band: "Excellent" | "Good" | "Fair" | "Poor";
  bandColor: string;
  paymentConsistency: number;
  debtUtilization: number;
  incomeStability: number;
  savingsRate: number;
}

export function calculateCreditScore(transactions: Transaction[]): CreditScoreData {
  if (transactions.length === 0) {
    return { score: 650, band: "Fair", bandColor: "#f59e0b", paymentConsistency: 50, debtUtilization: 50, incomeStability: 50, savingsRate: 0 };
  }

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  const recurring = detectRecurringTransactions(transactions);
  const hasRecurringIncome = recurring.some(r => r.direction === "income");
  const paymentConsistency = hasRecurringIncome ? 85 : 60;
  const debtUtilization = income > 0 ? Math.min(100, (expenses / income) * 100) : 80;
  const incomeCount = transactions.filter(t => t.type === "income").length;
  const incomeStability = Math.min(100, 50 + incomeCount * 5);

  let score = 500;
  score += savingsRate > 20 ? 100 : savingsRate > 10 ? 70 : savingsRate > 0 ? 40 : 0;
  score += paymentConsistency > 80 ? 80 : paymentConsistency > 60 ? 50 : 20;
  score += debtUtilization < 30 ? 80 : debtUtilization < 50 ? 50 : debtUtilization < 80 ? 20 : 0;
  score += Math.min(40, incomeStability / 2.5);
  score = Math.min(900, Math.max(300, Math.round(score)));

  let band: CreditScoreData["band"] = "Poor";
  let bandColor = "#ef4444";
  if (score >= 750) { band = "Excellent"; bandColor = "#10b981"; }
  else if (score >= 650) { band = "Good"; bandColor = "#3b82f6"; }
  else if (score >= 550) { band = "Fair"; bandColor = "#f59e0b"; }

  return {
    score, band, bandColor,
    paymentConsistency: Math.round(paymentConsistency),
    debtUtilization: Math.round(debtUtilization),
    incomeStability: Math.round(incomeStability),
    savingsRate: Math.round(savingsRate),
  };
}

