import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MOCK_TRANSACTIONS,
  type Category,
  type Transaction,
  type TransactionType,
} from "@/components/transactions/transactionData";

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const TRANSACTIONS_TABLE = import.meta.env.VITE_SUPABASE_TRANSACTIONS_TABLE?.trim() || "transactions";

function canUseSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function mapRowToTransaction(row: any): Transaction {
  return {
    id: String(row.id),
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    description: row.description ?? "",
    date: String(row.date).slice(0, 10),
  };
}

function mapInputToRow(input: TransactionInput) {
  return {
    amount: input.amount,
    type: input.type,
    category: input.category,
    description: input.description.trim() || input.category,
    date: input.date,
  };
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ""}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(details || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
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
      if (!canUseSupabase()) {
        setTransactions(MOCK_TRANSACTIONS);
        return;
      }

      const rows = (await supabaseRequest(
        `${TRANSACTIONS_TABLE}?select=id,amount,type,category,description,date&order=date.desc`,
        { method: "GET" },
      )) as any[];
      setTransactions(rows.map(mapRowToTransaction));
    } catch (err: any) {
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
      if (!canUseSupabase()) {
        const localTx: Transaction = { id: Date.now().toString(), ...input };
        setTransactions((prev) => [localTx, ...prev]);
        return;
      }

      const rows = (await supabaseRequest(TRANSACTIONS_TABLE, {
        method: "POST",
        body: JSON.stringify([mapInputToRow(input)]),
      })) as any[];
      const created = mapRowToTransaction(rows[0]);
      setTransactions((prev) => [created, ...prev]);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, input: TransactionInput) => {
    setSaving(true);
    setError("");
    try {
      if (!canUseSupabase()) {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, ...input, description: input.description.trim() || input.category } : tx)),
        );
        return;
      }

      const rows = (await supabaseRequest(`${TRANSACTIONS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(mapInputToRow(input)),
      })) as any[];

      const updated = mapRowToTransaction(rows[0]);
      setTransactions((prev) => prev.map((tx) => (tx.id === id ? updated : tx)));
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setSaving(true);
    setError("");
    try {
      if (!canUseSupabase()) {
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        return;
      }

      await supabaseRequest(`${TRANSACTIONS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
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

