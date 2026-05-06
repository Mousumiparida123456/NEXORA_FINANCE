import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MOCK_TRANSACTIONS,
  type Category,
  type Transaction,
  type TransactionType,
} from "@/components/transactions/transactionData";
import { api } from "@/lib/api";

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  date: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  healthScore: number;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  saving: boolean;
  error: string;
  summary: FinancialSummary;
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      console.log("✏️ Editing Transaction ID:", id);
      console.log("💵 Updated Amount:", input.amount);

      const updated = await api.patch<Transaction>(`/transactions/${id}`, input);
      
      console.log("✅ API/Supabase update response:", updated);

      // 1. Await completed properly. Update local state.
      const mappedUpdated = {
        ...updated,
        id: String(updated.id),
        date: updated.date ? String(updated.date).slice(0, 10) : "",
        amount: Number(updated.amount)
      };
      setTransactions((prev) => prev.map((tx) => (tx.id === String(id) ? mappedUpdated : tx)));
      
      // 2. Refetch completely as requested by user to guarantee sync
      const freshData = await api.get<Transaction[]>("/transactions");
      const mappedFresh = freshData.map(tx => ({
        ...tx,
        id: String(tx.id),
        date: tx.date ? String(tx.date).slice(0, 10) : "",
        amount: Number(tx.amount)
      }));
      setTransactions(mappedFresh);
      
      console.log("🔄 Fetched fresh data after update:", mappedFresh);

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

  const summary = useMemo<FinancialSummary>(() => {
    const totalIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const savings = totalIncome - totalExpenses;
    const healthScore = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      savings,
      healthScore,
    };
  }, [transactions]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  return {
    transactions,
    loading,
    saving,
    error,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
  };
}
