import { Transaction } from "@/components/transactions/transactionData";

export interface TransactionTotals {
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
}

export interface RecurringPattern {
  key: string;
  category: string;
  amount: number;
  direction: "income" | "expense";
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  lastDate: string;
  occurrences: number;
}

export interface GoalForecast {
  monthlySavingsCapacity: number;
  projectedMonthsToTarget: number;
  projectedDateLabel: string;
  health: "On Track" | "Achievable" | "Delayed" | "Risky";
}

export interface InvestmentSnapshot {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  roiPct: number;
  cagrPct: number;
}

export interface CreditSnapshot {
  estimatedScore: number;
  debtToIncomePct: number;
  affordabilityScore: number;
  repaymentCapacity: number;
}

export interface FinanceAnalyticsSnapshot {
  transactions: Transaction[];
  totals: TransactionTotals;
  trends: { month: string; income: number; expenses: number; net: number }[];
  categories: CategorySlice[];
  recurring: RecurringPattern[];
  goal: GoalForecast;
  investment: InvestmentSnapshot;
  credit: CreditSnapshot;
}

