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

export function buildTrajectory(currentSavings: number, monthlySavingsCapacity: number, annualReturnRate: number = 0.08, years: number = 5) {
  const data = [];
  let currentCompounded = currentSavings;
  const monthlyRate = annualReturnRate / 12;

  const now = new Date();

  for (let m = 0; m <= years * 12; m += 3) { // Plot every 3 months
    const dateLabel = format(addMonths(now, m), "MMM yyyy");
    
    // Future value of current savings
    const fvSavings = currentSavings * Math.pow(1 + monthlyRate, m);
    
    // Future value of regular monthly contributions
    let fvContributions = 0;
    if (monthlyRate > 0) {
      fvContributions = monthlySavingsCapacity * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate);
    } else {
      fvContributions = monthlySavingsCapacity * m;
    }

    const projectedValue = fvSavings + fvContributions;
    
    // Without compounding (just saving cash under mattress)
    const mattressValue = currentSavings + (monthlySavingsCapacity * m);

    data.push({
      date: dateLabel,
      monthIndex: m,
      projectedValue: Math.round(projectedValue),
      mattressValue: Math.round(mattressValue),
    });
  }

  return data;
}

export function predictNetWorth(currentSavings: number, monthlySavingsCapacity: number, annualReturnRate: number = 0.08) {
  const monthlyRate = annualReturnRate / 12;
  
  const calculateValue = (months: number) => {
    const fvSavings = currentSavings * Math.pow(1 + monthlyRate, months);
    let fvContributions = 0;
    if (monthlyRate > 0) {
      fvContributions = monthlySavingsCapacity * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else {
      fvContributions = monthlySavingsCapacity * months;
    }
    return Math.round(fvSavings + fvContributions);
  };

  return {
    oneYear: calculateValue(12),
    threeYear: calculateValue(36),
    fiveYear: calculateValue(60),
  };
}
