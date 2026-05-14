import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  CircleDot,
  PiggyBank,
  Sparkles,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

import { useTransactions } from "@/hooks/useTransactions";
import { 
  calculateTopCategories, 
  calculateCategoryTrends, 
  calculateMonthlyComparison, 
  calculateAIConfidence, 
  calculateMarketSentiment, 
  generateSmartInsights, 
  calculateNextMilestone 
} from "@/lib/insights-engine";
import { GamificationBadges } from "./GamificationBadges";

export function InsightsSection() {
  const { formatCurrency, formatCompactCurrency, theme } = useDashboard();
  const { transactions } = useTransactions();
  
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // --- Dynamic Insights Engine ---
  const topCatMemo = useMemo(() => calculateTopCategories(transactions), [transactions]);
  const categoryTrendData = useMemo(() => calculateCategoryTrends(transactions, topCatMemo), [transactions, topCatMemo]);
  const breakdownData = useMemo(() => calculateMonthlyComparison(transactions), [transactions]);
  const comparisonData = useMemo(() => [...breakdownData].reverse(), [breakdownData]);

  const confidenceScore = useMemo(() => calculateAIConfidence(transactions), [transactions]);
  const sentimentScore = useMemo(() => calculateMarketSentiment(transactions), [transactions]);
  const nextMilestone = useMemo(() => calculateNextMilestone(transactions), [transactions]);
  const smartInsights = useMemo(() => generateSmartInsights(transactions, breakdownData), [transactions, breakdownData]);

  // Generate dynamic observations
  const observations = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const obs = [];
    const expenses = transactions.filter(t => t.type === "expense");
    const income = transactions.filter(t => t.type === "income");
    
    // 1. Top Spending Category
    if (topCatMemo.length > 0) {
      const top = topCatMemo[0];
      obs.push({
        title: "Top Spending Category",
        value: top.name,
        detail: `${formatCurrency(top.amount)} total — ${top.value.toFixed(1)}% of all expenses`,
        icon: ShieldCheck,
        accent: "text-red-500 bg-red-500/10",
      });
    }

    // 2. Month-over-Month Expenses
    if (breakdownData.length >= 2) {
      const current = breakdownData[0];
      const prev = breakdownData[1];
      const diff = current.expenses - prev.expenses;
      const isUp = diff > 0;
      obs.push({
        title: "Month-over-Month Expenses",
        value: current.change,
        detail: `Expenses ${isUp ? "increased" : "decreased"} from ${formatCurrency(prev.expenses)} to ${formatCurrency(current.expenses)}`,
        icon: isUp ? TrendingUp : TrendingDown,
        accent: isUp ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10",
      });
      
      // 3. Current Month Savings Rate
      obs.push({
        title: "Current Month Savings Rate",
        value: `${current.savings}%`,
        detail: current.savings >= 20 ? "Great job! You’re saving well above the 20% benchmark." : "You're saving below the recommended 20% benchmark.",
        icon: PiggyBank,
        accent: current.savings >= 20 ? "text-emerald-700 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10",
      });
    }

    // 4. Largest Transaction
    if (transactions.length > 0) {
      const sorted = [...transactions].sort((a, b) => Number(b.amount) - Number(a.amount));
      const largest = sorted[0];
      obs.push({
        title: "Largest Transaction",
        value: formatCurrency(Number(largest.amount)),
        detail: `${largest.description || largest.category} on ${new Date(largest.date!).toLocaleDateString()}`,
        icon: DollarSign,
        accent: "text-sky-600 bg-sky-500/10",
      });
    }

    // 5. Overall Net Balance
    const totalExp = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
    const totalInc = income.reduce((acc, t) => acc + Number(t.amount), 0);
    const net = totalInc - totalExp;
    obs.push({
      title: "Overall Net Balance",
      value: formatCurrency(net),
      detail: `You've ${net >= 0 ? 'saved' : 'overspent'} ${formatCurrency(Math.abs(net))} across all recorded transactions.`,
      icon: CircleDot,
      accent: net >= 0 ? "text-slate-900 bg-slate-200 dark:bg-slate-800 dark:text-slate-100" : "text-rose-900 bg-rose-200",
    });

    return obs;
  }, [transactions, topCatMemo, breakdownData, formatCurrency]);

  // Load default dynamic insights initially
  useEffect(() => {
    if (!advice) {
      setAdvice(smartInsights.map(s => `* ${s}`).join('\n'));
    }
  }, [smartInsights]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const res = await api.getAIInsights();
      setAdvice(res.advice);
    } catch (error) {
      console.error("AI Fetch Error:", error);
      // Fallback to dynamic frontend insights
      setAdvice(smartInsights.map(s => `* ${s}`).join('\n'));
    } finally {
      setLoading(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">No data available</h3>
        <p className="text-slate-500 max-w-sm mb-6">Add more transactions to generate smarter insights and unlock the Financial Intelligence Engine.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Advice Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent shadow-xl dark:border-emerald-500/10 dark:bg-slate-950/40">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="relative flex flex-1 flex-col p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Nexora Smart Advice</h2>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Powered by Gemini 1.5 Pro</p>
                  </div>
                  <button 
                    onClick={fetchAdvice}
                    disabled={loading}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
                  </button>
                </div>

                <div className="min-h-[120px] space-y-4">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="prose prose-sm prose-slate dark:prose-invert max-w-none"
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {advice.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0 flex items-start gap-2">
                            {line.trim().startsWith('*') || line.trim().startsWith('-') ? (
                              <>
                                <ChevronRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                <span>{line.replace(/^[*|-]\s*/, '')}</span>
                              </>
                            ) : line}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 dark:border-slate-950 dark:bg-slate-800" />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Trusted by <span className="font-bold text-slate-900 dark:text-slate-200">12.4k+</span> elite investors
                  </p>
                </div>
              </div>

              <div className="hidden w-full max-w-[280px] flex-col border-l border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/30 lg:flex">
                <div className="mb-6 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-500">{confidenceScore}%</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Market Sentiment</p>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${sentimentScore}%` }} />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                    <p className="text-[10px] font-bold text-slate-400">NEXT MILESTONE</p>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">{nextMilestone.title}</p>
                    <p className="mt-0.5 text-[10px] text-emerald-500">{nextMilestone.years} remaining</p>
                    <div className="mt-2 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${nextMilestone.progressPct}%` }} />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 mt-4">
                    <p className="text-[10px] font-bold text-slate-400 mb-2">ACHIEVEMENTS</p>
                    <GamificationBadges />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className={cn("h-full border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80")}> 
            <CardHeader className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className={cn("text-lg font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-950")}>Spending Patterns by Category</CardTitle>
                <p className={cn("text-sm text-slate-500", theme === "dark" ? "text-slate-400" : "text-slate-600")}>Monthly expense trends for your top 4 categories.</p>
              </div>
            </CardHeader>
            <CardContent className="h-[320px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={categoryTrendData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={theme === "dark" ? "#334155" : "#e2e8f0"} vertical={false} opacity={0.5} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#64748b" : "#64748b"} tickLine={false} axisLine={false} tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                  <YAxis stroke={theme === "dark" ? "#64748b" : "#64748b"} tickLine={false} axisLine={false} tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0", backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff" }} cursor={{ stroke: theme === "dark" ? "#475569" : "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10, fontSize: 12, color: theme === "dark" ? "#94a3b8" : "#64748b" }} />
                  {topCatMemo.slice(0, 4).map((cat, i) => {
                    const colors = ["#ef4444", "#f97316", "#f59e0b", "#22c55e"];
                    return (
                      <Line key={cat.name} type="monotone" dataKey={cat.name} stroke={colors[i]} strokeWidth={3} dot={false} />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={cn("h-full border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80")}> 
            <CardHeader className="mb-3">
              <CardTitle className={cn("text-lg font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-950")}>Top Spending Categories</CardTitle>
              <p className={cn("text-sm text-slate-500", theme === "dark" ? "text-slate-400" : "text-slate-600")}>By total amount spent — all time.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {topCatMemo.slice(0, 6).map((category) => (
                <div key={category.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{category.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{category.transactions} txns</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950 dark:text-slate-100">{formatCurrency(category.amount)}</p>
                      <p className={cn("text-xs font-medium", "text-slate-500")}>{category.value.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full" style={{ width: `${category.value}%`, backgroundColor: category.color }} />
                  </div>
                </div>
              ))}
              {topCatMemo.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No categories tracked yet.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className={cn("border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80")}> 
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-950")}>Monthly Comparison</CardTitle>
              <p className={cn("text-sm text-slate-500", theme === "dark" ? "text-slate-400" : "text-slate-600")}>Income vs expenses — last 6 months.</p>
            </CardHeader>
            <CardContent className="h-[340px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={theme === "dark" ? "#334155" : "#e2e8f0"} vertical={false} opacity={0.5} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#64748b" : "#64748b"} tickLine={false} axisLine={false} tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                  <YAxis stroke={theme === "dark" ? "#64748b" : "#64748b"} tickLine={false} axisLine={false} tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }} tickFormatter={(value) => formatCompactCurrency(value)} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0", backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff" }} cursor={{ fill: theme === "dark" ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.12)" }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10, fontSize: 12, color: theme === "dark" ? "#94a3b8" : "#64748b" }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={cn("border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80")}> 
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-950")}>Month-by-Month Breakdown</CardTitle>
              <p className={cn("text-sm text-slate-500", theme === "dark" ? "text-slate-400" : "text-slate-600")}>All recorded months with savings rate and expense trend.</p>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <div className="min-w-[680px]">
                <table className="w-full border-separate border-spacing-y-3 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <th className="pb-3">Month</th>
                      <th className="pb-3">Income</th>
                      <th className="pb-3">Expenses</th>
                      <th className="pb-3">vs Prior</th>
                      <th className="pb-3">Net</th>
                      <th className="pb-3">Savings %</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-3">
                    {breakdownData.map((row) => (
                      <tr key={row.month} className="rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/80">
                        <td className="px-4 py-4 font-semibold text-slate-900 dark:text-slate-100">{row.month}</td>
                        <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400">{formatCurrency(row.income)}</td>
                        <td className="px-4 py-4 text-rose-600 dark:text-rose-400">{formatCurrency(row.expenses)}</td>
                        <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{row.change === "—" ? "—" : row.change}</td>
                        <td className={cn("px-4 py-4", row.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {row.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(row.net))}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", row.savings >= 20 ? "bg-emerald-500/10 text-emerald-700" : row.savings > 0 ? "bg-amber-500/10 text-amber-700" : "bg-rose-500/10 text-rose-700")}>
                            {row.savings}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {breakdownData.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4 text-slate-500">No monthly data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3 sm:auto-rows-fr">
        {observations.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="h-full"
            >
              <Card className={cn("h-full border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80")}> 
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", item.accent)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", theme === "dark" ? "text-slate-400" : "text-slate-500")}>{item.title}</p>
                      <p className={cn("mt-1 text-xl font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-950")}>{item.value}</p>
                    </div>
                  </div>
                  <p className={cn("text-sm leading-6", theme === "dark" ? "text-slate-400" : "text-slate-600")}>{item.detail}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
