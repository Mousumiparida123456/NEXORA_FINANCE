import { useState } from "react";
import { motion } from "framer-motion";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { MOCK_TRANSACTIONS, type Transaction } from "@/components/transactions/transactionData";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function Transactions() {
  const { theme } = useDashboard();
  const isDark = theme === "dark";
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  function handleAdd(tx: Transaction) {
    setTransactions((prev) => [tx, ...prev]);
  }

  function handleDelete(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className={cn("container mx-auto px-4 py-8 pb-16", isDark ? "" : "")}> 
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-slate-50" : "text-slate-950")}>Transactions</h1>
          <p className={cn("mt-1.5 text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>{transactions.length} transactions</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AddTransactionForm onAdd={handleAdd} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <TransactionList transactions={transactions} onDelete={handleDelete} />
      </motion.div>
    </main>
  );
}
