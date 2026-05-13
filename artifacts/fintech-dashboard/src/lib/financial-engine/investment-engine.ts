import { Transaction } from "@/components/transactions/transactionData";
import { InvestmentSnapshot } from "./types";

export function buildInvestmentSnapshot(transactions: Transaction[]): InvestmentSnapshot {
  const investTx = transactions.filter((t) => (t.category || "").toLowerCase().includes("investment"));
  const totalInvested = investTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalReturns = investTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const currentValue = totalInvested + (totalReturns - totalInvested);
  const profitLoss = currentValue - totalInvested;
  const roiPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  const dates = investTx.map((t) => new Date(t.date || "").getTime()).filter((d) => !Number.isNaN(d));
  const years = dates.length > 1 ? Math.max(1 / 12, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 365)) : 1;
  const cagrPct = totalInvested > 0 && currentValue > 0 ? (Math.pow(currentValue / totalInvested, 1 / years) - 1) * 100 : 0;

  return { totalInvested, currentValue, profitLoss, roiPct, cagrPct };
}

