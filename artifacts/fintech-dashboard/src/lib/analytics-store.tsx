import { createContext, ReactNode, useContext, useMemo } from "react";
import { buildFinanceAnalyticsSnapshot, FinanceAnalyticsSnapshot } from "@/lib/financial-engine";
import { useTransactions } from "@/hooks/useTransactions";

const AnalyticsStoreContext = createContext<FinanceAnalyticsSnapshot | undefined>(undefined);

export function AnalyticsStoreProvider({ children }: { children: ReactNode }) {
  const { transactions } = useTransactions();

  const snapshot = useMemo(() => {
    return buildFinanceAnalyticsSnapshot(transactions, {
      savingsAllocationPct: 20,
      goalTargetMonths: 12,
    });
  }, [transactions]);

  return <AnalyticsStoreContext.Provider value={snapshot}>{children}</AnalyticsStoreContext.Provider>;
}

export function useAnalyticsStore() {
  const ctx = useContext(AnalyticsStoreContext);
  if (!ctx) throw new Error("useAnalyticsStore must be used within AnalyticsStoreProvider");
  return ctx;
}

