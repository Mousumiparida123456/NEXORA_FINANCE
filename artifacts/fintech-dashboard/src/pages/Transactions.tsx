import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { EditTransactionModal } from "@/components/transactions/EditTransactionModal";
import { CSVUploader } from "@/components/transactions/CSVUploader";
import { type Transaction } from "@/components/transactions/transactionData";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function Transactions() {
  const { theme } = useDashboard();
  const isDark = theme === "dark";
  const { toast } = useToast();
  const {
    transactions,
    summary,
    loading,
    saving,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const healthScoreLabel = useMemo(() => {
    const score = summary.healthScore;
    if (score >= 50) return "Excellent";
    if (score >= 25) return "Good";
    if (score >= 0) return "Needs Attention";
    return "Critical";
  }, [summary.healthScore]);

  async function handleAdd(tx: Transaction) {
    await addTransaction({
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      description: tx.description,
      date: tx.date,
    });
    toast({
      title: "Transaction added",
      description: "Your record has been saved successfully.",
    });
  }

  async function handleImport(payload: any[]) {
    try {
      // In a real app we'd want a bulk insert endpoint. Here we'll map promises for simplicity as requested.
      await Promise.all(payload.map(tx => addTransaction({
        amount: tx.amount,
        category: tx.category,
        type: tx.type as "income" | "expense",
        description: tx.description,
        date: tx.date,
      })));
      toast({
        title: "Import Successful",
        description: `Imported ${payload.length} transactions.`,
      });
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err?.message || "Could not complete import.",
        variant: "destructive",
      });
    }
  }

  async function handleUpdate(id: string, tx: Omit<Transaction, "id">) {
    await updateTransaction(id, tx);
    toast({
      title: "Transaction updated",
      description: "Changes synced successfully.",
    });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this transaction permanently?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteTransaction(id);
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete this transaction.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className={cn("container mx-auto px-4 py-8 pb-16", isDark ? "" : "")}> 
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-950")}>Transactions</h1>
          <p className={cn("mt-1.5 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>{transactions.length} transactions</p>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AddTransactionForm onAdd={handleAdd} loading={saving} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-300">Total Income</p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-rose-300">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold text-rose-200">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-cyan-300">Savings</p>
          <p className="mt-1 text-2xl font-bold text-cyan-200">{formatCurrency(summary.savings)}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-indigo-300">Financial Health</p>
          <p className="mt-1 text-2xl font-bold text-indigo-200">{summary.healthScore.toFixed(1)}%</p>
          <p className="mt-0.5 text-xs text-indigo-300/90">{healthScoreLabel}</p>
        </div>
      </div>

      <CSVUploader onImport={handleImport} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-950 dark:text-slate-400">
            Loading transactions...
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
            onEdit={setEditingTx}
            deletingId={deletingId}
          />
        )}
      </motion.div>

      <EditTransactionModal
        open={Boolean(editingTx)}
        transaction={editingTx}
        loading={saving}
        onClose={() => setEditingTx(null)}
        onSave={handleUpdate}
      />
    </main>
  );
}
