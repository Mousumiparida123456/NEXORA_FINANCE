import { CreditSnapshot, RecurringPattern } from "./types";

export function buildCreditSnapshot(opts: {
  monthlyIncome: number;
  monthlyExpenses: number;
  recurring: RecurringPattern[];
}): CreditSnapshot {
  const recurringLiabilities = opts.recurring
    .filter((r) => r.direction === "expense")
    .reduce((sum, r) => sum + (r.frequency === "monthly" ? r.amount : r.frequency === "weekly" ? r.amount * 4 : r.frequency === "quarterly" ? r.amount / 3 : r.frequency === "yearly" ? r.amount / 12 : r.amount), 0);

  const debtToIncomePct = opts.monthlyIncome > 0 ? (recurringLiabilities / opts.monthlyIncome) * 100 : 100;
  const savingsRatio = opts.monthlyIncome > 0 ? ((opts.monthlyIncome - opts.monthlyExpenses) / opts.monthlyIncome) * 100 : 0;
  const affordabilityScore = Math.max(0, Math.min(100, Math.round((Math.max(0, savingsRatio) * 0.45) + (Math.max(0, 100 - debtToIncomePct) * 0.55))));
  const repaymentCapacity = Math.max(0, opts.monthlyIncome - opts.monthlyExpenses);

  const estimatedScore = Math.max(
    300,
    Math.min(900, Math.round(300 + (Math.max(0, 100 - debtToIncomePct) * 2.2) + (Math.max(0, savingsRatio) * 2.1))),
  );

  return { estimatedScore, debtToIncomePct, affordabilityScore, repaymentCapacity };
}

