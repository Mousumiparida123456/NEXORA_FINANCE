import { useTransactionsContext } from "@/lib/transactions-context";
import { TransactionInput, FinancialSummary } from "@/lib/transactions-context";

// Re-export types that other files might be importing from here
export type { TransactionInput, FinancialSummary };

export function useTransactions() {
  return useTransactionsContext();
}
