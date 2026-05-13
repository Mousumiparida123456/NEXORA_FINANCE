import { Transaction } from "@/components/transactions/transactionData";
import { format, parseISO } from "date-fns";

export interface MonthlyData {
  name: string; // "Jan", "Feb", etc.
  income: number;
  expenses: number;
  sortIndex: number;
}

export interface ExpenseBreakdown {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Housing": "#3b82f6",
  "Rent & Housing": "#3b82f6",
  "Food": "#10b981",
  "Food & Dining": "#10b981",
  "Transport": "#f59e0b",
  "Entertainment": "#8b5cf6",
  "Health": "#ec4899",
  "Shopping": "#06b6d4",
  "Other": "#64748b",
  "Salary": "#22c55e",
  "Freelance": "#14b8a6",
  "Investment": "#3b82f6",
  "Travel": "#f43f5e"
};

export function generateMonthlyChartData(transactions: Transaction[]): MonthlyData[] {
  const monthlyMap = new Map<string, { income: number; expenses: number; sortIndex: number }>();
  
  // Initialize last 12 months to ensure we have data points even if empty
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = format(d, "MMM");
    const sortIndex = d.getFullYear() * 100 + d.getMonth();
    monthlyMap.set(monthName, { income: 0, expenses: 0, sortIndex });
  }

  transactions.forEach(tx => {
    if (!tx.date) return;
    const dateObj = parseISO(tx.date);
    // if date is invalid, skip
    if (isNaN(dateObj.getTime())) return;
    
    const monthName = format(dateObj, "MMM");
    const sortIndex = dateObj.getFullYear() * 100 + dateObj.getMonth();

    if (!monthlyMap.has(monthName)) {
      monthlyMap.set(monthName, { income: 0, expenses: 0, sortIndex });
    }

    const data = monthlyMap.get(monthName)!;
    if (tx.type === "income") {
      data.income += Number(tx.amount);
    } else {
      data.expenses += Number(tx.amount);
    }
  });

  return Array.from(monthlyMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .slice(-12); // return up to 12 months
}

export function generateExpenseBreakdown(transactions: Transaction[]): ExpenseBreakdown[] {
  const expenses = transactions.filter(tx => tx.type === "expense");
  const totalExpenses = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (totalExpenses === 0) return [];

  const categoryMap = new Map<string, number>();
  
  expenses.forEach(tx => {
    const amount = Number(tx.amount);
    categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + amount);
  });

  const breakdown = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      value: Math.round((amount / totalExpenses) * 100),
      color: CATEGORY_COLORS[name] || "#64748b"
    }))
    .sort((a, b) => b.value - a.value);

  return breakdown;
}

export function calculateFinancialHealth(income: number, expenses: number): number {
  if (income === 0) {
    return expenses > 0 ? 10 : 50; // no income but expenses = bad, no both = neutral
  }
  
  const savings = income - expenses;
  const savingsRatio = savings / income;
  
  // Health score calculation logic:
  // > 20% savings = Excellent (90-100)
  // 10-20% savings = Good (70-89)
  // 0-10% savings = Fair (50-69)
  // < 0 savings = Poor (< 50)
  
  let score = 50; // base score for 0 savings
  
  if (savingsRatio >= 0.2) {
    score = 90 + Math.min(10, (savingsRatio - 0.2) * 100);
  } else if (savingsRatio > 0) {
    score = 50 + (savingsRatio / 0.2) * 40;
  } else {
    // negative savings
    const deficitRatio = Math.abs(savings) / income;
    score = Math.max(0, 50 - (deficitRatio * 100));
  }
  
  return Math.round(score);
}
