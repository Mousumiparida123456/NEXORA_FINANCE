import { Transaction } from "@/components/transactions/transactionData";
import { buildCreditSnapshot } from "./credit-engine";
import { buildGoalForecast } from "./goal-engine";
import { buildInvestmentSnapshot } from "./investment-engine";
import { getCategorySlices, getMonthlyTrends, getRecurringPatterns, getTransactionTotals } from "./transaction-analytics-service";
import { FinanceAnalyticsSnapshot } from "./types";

export function buildFinanceAnalyticsSnapshot(
  transactions: Transaction[],
  opts?: { savingsAllocationPct?: number; goalRemainingAmount?: number; goalTargetMonths?: number },
): FinanceAnalyticsSnapshot {
  const totals = getTransactionTotals(transactions);
  const trends = getMonthlyTrends(transactions);
  const categories = getCategorySlices(transactions);
  const recurring = getRecurringPatterns(transactions);
  const monthlyIncome = trends.length ? trends[trends.length - 1].income : totals.income;
  const monthlyExpenses = trends.length ? trends[trends.length - 1].expenses : totals.expenses;

  const goal = buildGoalForecast({
    monthlyIncome,
    monthlyExpenses,
    savingsAllocationPct: opts?.savingsAllocationPct ?? 20,
    goalRemainingAmount: opts?.goalRemainingAmount ?? Math.max(0, totals.expenses * 3 - Math.max(0, totals.net)),
    targetMonthsLeft: opts?.goalTargetMonths ?? 12,
  });

  const investment = buildInvestmentSnapshot(transactions);
  const credit = buildCreditSnapshot({ monthlyIncome, monthlyExpenses, recurring });

  return {
    transactions,
    totals,
    trends,
    categories,
    recurring,
    goal,
    investment,
    credit,
  };
}

export * from "./types";

