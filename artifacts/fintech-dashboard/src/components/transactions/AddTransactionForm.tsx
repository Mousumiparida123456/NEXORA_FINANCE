import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, IndianRupee, CalendarIcon, ChevronDown } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type Transaction,
  type TransactionType,
  type Category,
} from "./transactionData";

interface AddTransactionFormProps {
  onAdd: (tx: Transaction) => void;
}

export function AddTransactionForm({ onAdd }: AddTransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food & Dining");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const availableCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleTypeChange(t: TransactionType) {
    setType(t);
    const cats = t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!cats.includes(category)) {
      setCategory(cats[0]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: num,
      category,
      type,
      date,
      description: description.trim() || category,
    };
    onAdd(newTx);
    setAmount("");
    setDescription("");
    setError("");
    setOpen(false);
  }

  return (
    <div className="mb-6">
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            data-testid="button-add-transaction"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 shadow-2xl shadow-slate-950/50 backdrop-blur-sm overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">New Transaction</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in the details below</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                data-testid="button-close-form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Type toggle */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">Type</label>
                <div className="flex rounded-xl bg-slate-900/60 p-1 gap-1">
                  {(["expense", "income"] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-testid={`button-type-${t}`}
                      onClick={() => handleTypeChange(t)}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                        type === t
                          ? t === "income"
                            ? "bg-emerald-500/20 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 shadow-sm ring-1 ring-rose-500/30"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount + Description row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                    Amount
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      data-testid="input-amount"
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional note..."
                    data-testid="input-description"
                    className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Category + Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                    Category
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CategoryIcon category={category} size="sm" />
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      data-testid="select-category"
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 pl-12 pr-8 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {availableCategories.map((c) => (
                        <option key={c} value={c} className="bg-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                    Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      data-testid="input-date"
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-slate-700/60 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="button-submit-transaction"
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all active:scale-95"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
