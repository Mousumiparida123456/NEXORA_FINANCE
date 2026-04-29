import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, ChevronDown, IndianRupee, X } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
  type Transaction,
  type TransactionType,
} from "./transactionData";

interface EditTransactionModalProps {
  open: boolean;
  transaction: Transaction | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (id: string, payload: Omit<Transaction, "id">) => Promise<void> | void;
}

export function EditTransactionModal({
  open,
  transaction,
  loading = false,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<Category>("Food & Dining");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const categories = useMemo(
    () => (type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [type],
  );

  useEffect(() => {
    if (!transaction || !open) return;
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setCategory(transaction.category);
    setDescription(transaction.description);
    setDate(transaction.date);
    setError("");
  }, [transaction, open]);

  function onTypeChange(next: TransactionType) {
    setType(next);
    const nextCategories = next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!nextCategories.includes(category)) {
      setCategory(nextCategories[0]);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setError("");
    try {
      await onSave(transaction.id, {
        amount: parsedAmount,
        type,
        category,
        description: description.trim() || category,
        date,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update transaction.");
    }
  }

  return (
    <AnimatePresence>
      {open && transaction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-[#1e293b] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Edit Transaction</h3>
                <p className="mt-0.5 text-xs text-slate-500">Update details and save changes</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Type</label>
                <div className="flex gap-1 rounded-xl bg-slate-900/60 p-1">
                  {(["expense", "income"] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onTypeChange(t)}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                        type === t
                          ? t === "income"
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 py-2.5 pl-9 pr-3 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Category</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CategoryIcon category={category} size="sm" />
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full appearance-none rounded-xl border border-slate-700/60 bg-slate-900/60 py-2.5 pl-12 pr-8 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item} className="bg-slate-900">
                          {item}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Date</label>
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 py-2.5 pl-9 pr-3 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-700/60 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

