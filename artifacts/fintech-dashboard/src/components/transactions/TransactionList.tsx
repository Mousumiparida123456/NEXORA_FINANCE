import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import {
  type Transaction,
  type Category,
  type TransactionType,
  CATEGORIES,
} from "./transactionData";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterType, setFilterType] = useState<TransactionType | "All">("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !tx.description.toLowerCase().includes(q) &&
          !tx.category.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterCategory !== "All" && tx.category !== filterCategory) return false;
      if (filterType !== "All" && tx.type !== filterType) return false;
      if (filterDateFrom && tx.date < filterDateFrom) return false;
      if (filterDateTo && tx.date > filterDateTo) return false;
      return true;
    });
  }, [transactions, search, filterCategory, filterType, filterDateFrom, filterDateTo]);

  const hasActiveFilters =
    filterCategory !== "All" ||
    filterType !== "All" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  function clearFilters() {
    setFilterCategory("All");
    setFilterType("All");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-950 dark:shadow-none">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">Transactions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:grid-cols-[1fr_auto_auto] xl:items-center xl:gap-3">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                data-testid="input-search-transactions"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="relative min-w-[170px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category | "All")}
                data-testid="select-filter-category"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="All">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                hasActiveFilters
                  ? "bg-slate-950 text-white shadow-sm dark:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/40">
                {/* Category filter */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Category</label>
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as Category | "All")}
                      data-testid="select-filter-category"
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-3 pr-8 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer"
                    >
                      <option value="All" className="bg-slate-900">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Type filter */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Type</label>
                  <div className="relative">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as TransactionType | "All")}
                      data-testid="select-filter-type"
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-3 pr-8 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none cursor-pointer"
                    >
                      <option value="All" className="bg-slate-900">All Types</option>
                      <option value="income" className="bg-slate-900">Income</option>
                      <option value="expense" className="bg-slate-900">Expense</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Date from */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">From</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    data-testid="input-filter-date-from"
                    className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [color-scheme:dark]"
                  />
                </div>

                {/* Date to */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">To</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    data-testid="input-filter-date-to"
                    className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [color-scheme:dark]"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs text-slate-500 hover:text-rose-400 transition-colors underline-offset-2 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction rows */}
      <div className="border-t border-slate-200 dark:border-slate-700/60 overflow-x-auto">
        <div className="min-w-[720px] table w-full">
          <div className="table-header-group border-b border-slate-200 dark:border-slate-700/60">
            <div className="table-row">
              <div className="table-cell px-6 py-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Date</div>
              <div className="table-cell px-6 py-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Description</div>
              <div className="table-cell px-6 py-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Category</div>
              <div className="table-cell px-6 py-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Type</div>
              <div className="table-cell px-6 py-3 text-right text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Amount</div>
              <div className="table-cell px-6 py-3 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sr-only">Actions</div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-16 text-slate-600 dark:text-slate-400"
              >
                <div className="flex flex-col items-center justify-center">
                  <Search className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              </motion.div>
            ) : (
              filtered.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  transition={{ delay: i < 10 ? i * 0.02 : 0 }}
                  data-testid={`row-transaction-${tx.id}`}
                  className="group table-row border-b border-slate-200 last:border-b-0 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-900"
                >
                  <div className="table-cell px-6 py-4 align-middle whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(tx.date)}
                  </div>
                  <div className="table-cell px-6 py-4 align-middle max-w-[340px] overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">{tx.description}</span>
                  </div>
                  <div className="table-cell px-6 py-4 align-middle whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <CategoryIcon category={tx.category} size="sm" />
                      <span className="truncate">{tx.category}</span>
                    </div>
                  </div>
                  <div className="table-cell px-6 py-4 align-middle whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      tx.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    }`}>{tx.type}</span>
                  </div>
                  <div className={`table-cell px-6 py-4 align-middle whitespace-nowrap text-right text-sm font-semibold ${
                    tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </div>
                  <div className="table-cell px-6 py-4 align-middle whitespace-nowrap">
                    <button
                      onClick={() => onDelete(tx.id)}
                      data-testid={`button-delete-${tx.id}`}
                      className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800 transition"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
