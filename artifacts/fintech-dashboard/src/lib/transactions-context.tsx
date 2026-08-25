import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Transaction, Category, TransactionType } from "@/components/transactions/transactionData";
import { api } from "@/lib/api";
import { MonthlyData, ExpenseBreakdown, generateMonthlyChartData, generateExpenseBreakdown, calculateFinancialHealth } from "./financial-analytics";
import { subscribeToTransactionsRealtime } from "@/lib/supabase-realtime-bridge";

export interface TransactionInput {
  description: string;
  amount: number | string;
  category: Category;
  type: TransactionType;
  date: string;
}


export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  healthScore: number;
}

export interface TransactionsContextState {
  transactions: Transaction[];
  loading: boolean;
  saving: boolean;
  error: string;
  summary: FinancialSummary;
  monthlyChartData: MonthlyData[];
  expenseBreakdown: ExpenseBreakdown[];
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Filters
  filterMonth: number | null;
  filterYear: number | null;
  filterCategory: Category | "All";
  filterType: TransactionType | "All";
  setFilterMonth: (month: number | null) => void;
  setFilterYear: (year: number | null) => void;
  setFilterCategory: (category: Category | "All") => void;
  setFilterType: (type: TransactionType | "All") => void;
  clearFilters: () => void;
}

const TransactionsContext = createContext<TransactionsContextState | undefined>(undefined);
const TRANSACTION_SYNC_EVENT = "nexora:transactions:changed";
const TRANSACTION_NOTIFICATION_EVENT = "nexora:transaction:notify";

const LOCAL_TX_KEY = "nexora_custom_transactions";

function getLocalStoredTransactions(): Transaction[] {
  try {
    const data = window.localStorage.getItem(LOCAL_TX_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalStoredTransaction(tx: Transaction) {
  try {
    const existing = getLocalStoredTransactions();
    const filtered = existing.filter(t => t.id !== tx.id);
    const updated = [tx, ...filtered];
    window.localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to save local transaction:", e);
  }
}

function mergeTransactions(primary: Transaction[], local: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  local.forEach(tx => map.set(String(tx.id), tx));
  primary.forEach(tx => map.set(String(tx.id), tx));
  return Array.from(map.values()).sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterType, setFilterType] = useState<TransactionType | "All">("All");

  const clearFilters = useCallback(() => {
    setFilterMonth(null);
    setFilterYear(null);
    setFilterCategory("All");
    setFilterType("All");
  }, []);

  const refreshTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    const localTxs = getLocalStoredTransactions();
    try {
      const data = await api.get<Transaction[]>("/transactions");
      const mapped = data.map(tx => ({
        ...tx,
        id: String(tx.id),
        date: tx.date ? String(tx.date).slice(0, 10) : "",
        amount: Number(tx.amount)
      }));
      const merged = mergeTransactions(mapped, localTxs);
      setTransactions(merged);
    } catch (err: any) {
      console.warn("API Error, falling back to user local transactions only:", err);
      setError(err?.message || "Failed to fetch transactions.");
      setTransactions(localTxs);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (input: TransactionInput) => {
    setSaving(true);
    setError("");
    let newTx: Transaction;
    try {
      const created = await api.post<Transaction>("/transactions", input);
      newTx = {
        ...created,
        id: String(created.id || Date.now()),
        date: created.date ? String(created.date).slice(0, 10) : (input.date || new Date().toISOString().split('T')[0]),
        amount: Number(created.amount || input.amount),
        description: created.description || input.description,
        category: created.category || input.category,
        type: created.type || input.type
      };
    } catch (err: any) {
      console.warn("⚠️ API addTransaction error, saving transaction locally:", err?.message || err);
      newTx = {
        id: `tx_${Date.now()}`,
        description: input.description,
        amount: Number(input.amount),
        category: input.category,
        type: input.type,
        date: input.date || new Date().toISOString().split('T')[0]
      };
    }

    saveLocalStoredTransaction(newTx);
    setTransactions((prev) => {
      const filtered = prev.filter(t => t.id !== newTx.id);
      return [newTx, ...filtered];
    });

    window.dispatchEvent(new CustomEvent(TRANSACTION_NOTIFICATION_EVENT, {
      detail: { action: "add", description: input.description, category: input.category, amount: Number(input.amount), type: input.type }
    }));
    setSaving(false);
  }, []);

  const updateTransaction = useCallback(async (id: string, input: TransactionInput) => {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<Transaction>(`/transactions/${id}`, input);
      const mappedUpdated = {
        ...updated,
        id: String(updated.id),
        date: updated.date ? String(updated.date).slice(0, 10) : "",
        amount: Number(updated.amount)
      };
      setTransactions((prev) => prev.map((tx) => (tx.id === String(id) ? mappedUpdated : tx)));
      window.dispatchEvent(new CustomEvent(TRANSACTION_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent(TRANSACTION_NOTIFICATION_EVENT, {
        detail: { action: "edit", description: input.description, category: input.category, amount: Number(input.amount), type: input.type }
      }));
    } catch (err: any) {
      setError(err?.message || "Failed to update transaction.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setSaving(true);
    setError("");
    try {
      const txToDelete = transactions.find((tx) => tx.id === String(id));
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== String(id)));
      window.dispatchEvent(new CustomEvent(TRANSACTION_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent(TRANSACTION_NOTIFICATION_EVENT, {
        detail: { action: "delete", description: txToDelete?.description, category: txToDelete?.category, amount: txToDelete?.amount, type: txToDelete?.type }
      }));
    } catch (err: any) {
      setError(err?.message || "Failed to delete transaction.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [transactions]);

  // Compute derived state dynamically
  const { filteredTransactions, summary, monthlyChartData, expenseBreakdown } = useMemo(() => {
    // 1. Filter
    const filtered = transactions.filter(tx => {
      if (filterType !== "All" && tx.type !== filterType) return false;
      if (filterCategory !== "All" && tx.category !== filterCategory) return false;
      
      if ((filterMonth !== null || filterYear !== null) && tx.date) {
        const txDate = new Date(tx.date);
        if (filterMonth !== null && txDate.getMonth() !== filterMonth) return false;
        if (filterYear !== null && txDate.getFullYear() !== filterYear) return false;
      }
      return true;
    });

    // 2. Summary
    const totalIncome = filtered
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = filtered
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const savings = totalIncome - totalExpenses;
    
    // We compute health score based on the filtered data or overall depending on needs,
    // usually overall health score is better, but here we do it based on filtered transactions.
    const healthScore = calculateFinancialHealth(totalIncome, totalExpenses);

    const summaryData = { totalIncome, totalExpenses, savings, healthScore };

    // 3. Chart Data
    const monthlyData = generateMonthlyChartData(filtered);
    const expenseData = generateExpenseBreakdown(filtered);

    return {
      filteredTransactions: filtered,
      summary: summaryData,
      monthlyChartData: monthlyData,
      expenseBreakdown: expenseData
    };
  }, [transactions, filterMonth, filterYear, filterCategory, filterType]);

  // Initial fetch
  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  // Centralized auto-sync: refresh on focus, visibility, interval, and supabase realtime.
  useEffect(() => {
    const onFocus = () => { void refreshTransactions(); };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshTransactions();
    };
    const onSync = () => { void refreshTransactions(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(TRANSACTION_SYNC_EVENT, onSync);
    const id = window.setInterval(() => { void refreshTransactions(); }, 20000);
    const unsubscribeRealtime = subscribeToTransactionsRealtime(() => { void refreshTransactions(); });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(TRANSACTION_SYNC_EVENT, onSync);
      window.clearInterval(id);
      unsubscribeRealtime();
    };
  }, [refreshTransactions]);

  return (
    <TransactionsContext.Provider value={{
      transactions: filteredTransactions,
      loading,
      saving,
      error,
      summary,
      monthlyChartData,
      expenseBreakdown,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      refreshTransactions,
      filterMonth,
      filterYear,
      filterCategory,
      filterType,
      setFilterMonth,
      setFilterYear,
      setFilterCategory,
      setFilterType,
      clearFilters
    }}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactionsContext() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error("useTransactionsContext must be used within a TransactionsProvider");
  }
  return context;
}
