import { addMonths, format } from "date-fns";
import { GoalForecast } from "./types";

export function buildGoalForecast(opts: {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsAllocationPct: number;
  goalRemainingAmount: number;
  targetMonthsLeft: number;
}): GoalForecast {
  const monthlySurplus = Math.max(0, opts.monthlyIncome - opts.monthlyExpenses);
  const monthlySavingsCapacity = Math.round((monthlySurplus * opts.savingsAllocationPct) / 100);
  const projectedMonthsToTarget =
    monthlySavingsCapacity > 0 ? opts.goalRemainingAmount / monthlySavingsCapacity : Number.POSITIVE_INFINITY;
  const projectedDateLabel = Number.isFinite(projectedMonthsToTarget)
    ? format(addMonths(new Date(), Math.ceil(projectedMonthsToTarget)), "MMM yyyy")
    : "N/A";

  let health: GoalForecast["health"] = "Risky";
  if (!Number.isFinite(projectedMonthsToTarget)) health = "Risky";
  else if (projectedMonthsToTarget <= opts.targetMonthsLeft * 0.9) health = "On Track";
  else if (projectedMonthsToTarget <= opts.targetMonthsLeft * 1.1) health = "Achievable";
  else if (projectedMonthsToTarget <= opts.targetMonthsLeft * 1.5) health = "Delayed";

  return {
    monthlySavingsCapacity,
    projectedMonthsToTarget,
    projectedDateLabel,
    health,
  };
}

