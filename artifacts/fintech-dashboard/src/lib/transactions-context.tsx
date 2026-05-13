import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Transaction, TransactionInput, Category, TransactionType, MOCK_TRANSACTIONS } from "@/components/transactions/transactionData";
import { api } from "@/lib/api";
import { MonthlyData, ExpenseBreakdown, generateMonthlyChartData, generateExpenseBreakdown, calculateFinancialHealth } from "./financial-analytics";

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
    try {
      const data = await api.get<Transaction[]>("/transactions");
      const mapped = data.map(tx => ({
        ...tx,
        id: String(tx.id),
        date: tx.date ? String(tx.date).slice(0, 10) : "",
        amount: Number(tx.amount)
      }));
      setTransactions(mapped);
    } catch (err: any) {
      console.warn("API Error, falling back to mock transactions", err);
      setError(err?.message || "Failed to fetch transactions.");
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (input: TransactionInput) => {
    setSaving(true);
    setError("");
    try {
      const created = await api.post<Transaction>("/transactions", input);
      const mappedCreated = {
        ...created,
        id: String(created.id),
        date: created.date ? String(created.date).slice(0, 10) : "",
        amount: Number(created.amount)
      };
      setTransactions((prev) => [mappedCreated, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Failed to add transaction.");
      throw err;
    } finally {
      setSaving(false);
    }
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
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((tx) => tx.id !== String(id)));
    } catch (err: any) {
      setError(err?.message || "Failed to delete transaction.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

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
