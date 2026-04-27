import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
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

const categoryTrendData = [
  { month: "Oct", Housing: 850, Shopping: 950, "Food & Dining": 430, Utilities: 95 },
  { month: "Nov", Housing: 1200, Shopping: 820, "Food & Dining": 510, Utilities: 115 },
  { month: "Dec", Housing: 1120, Shopping: 1080, "Food & Dining": 720, Utilities: 130 },
  { month: "Jan", Housing: 980, Shopping: 740, "Food & Dining": 600, Utilities: 105 },
  { month: "Feb", Housing: 1040, Shopping: 860, "Food & Dining": 690, Utilities: 120 },
  { month: "Mar", Housing: 1180, Shopping: 780, "Food & Dining": 650, Utilities: 140 },
];

const topCategories = [
  { name: "Housing", amount: 5100, value: 42.4, transactions: 6, color: "#ef4444" },
  { name: "Shopping", amount: 2850, value: 23.7, transactions: 8, color: "#f97316" },
  { name: "Food & Dining", amount: 2030, value: 16.9, transactions: 18, color: "#f59e0b" },
  { name: "Utilities", amount: 523, value: 4.3, transactions: 6, color: "#22c55e" },
  { name: "Education", amount: 470, value: 3.9, transactions: 3, color: "#3b82f6" },
  { name: "Health", amount: 435, value: 3.6, transactions: 5, color: "#14b8a6" },
];

const comparisonData = [
  { month: "Oct 2024", income: 5450, expenses: 1580 },
  { month: "Nov 2024", income: 5700, expenses: 1860 },
  { month: "Dec 2024", income: 6700, expenses: 2615 },
  { month: "Jan 2025", income: 5100, expenses: 1608 },
  { month: "Feb 2025", income: 5650, expenses: 2620 },
  { month: "Mar 2025", income: 6600, expenses: 1740 },
];

const breakdownData = [
  { month: "Mar 2025", income: 6600, expenses: 1740, change: "34%", net: 4860, savings: 74 },
  { month: "Feb 2025", income: 5650, expenses: 2620, change: "63%", net: 3030, savings: 54 },
  { month: "Jan 2025", income: 5100, expenses: 1608, change: "39%", net: 3492, savings: 68 },
  { month: "Dec 2024", income: 6700, expenses: 2615, change: "41%", net: 4085, savings: 61 },
  { month: "Nov 2024", income: 5700, expenses: 1860, change: "18%", net: 3840, savings: 67 },
  { month: "Oct 2024", income: 5450, expenses: 1580, change: "—", net: 3870, savings: 71 },
];

const observations = [
  {
    title: "Top Spending Category",
    value: "Housing",
    detail: "₹5,100.00 total — 42.4% of all expenses",
    icon: ShieldCheck,
    accent: "text-red-500 bg-red-500/10",
  },
  {
    title: "Month-over-Month Expenses",
    value: "-33.6%",
    detail: "Expenses decreased from ₹2,620.00 to ₹1,740.00",
    icon: TrendingDown,
    accent: "text-emerald-500 bg-emerald-500/10",
  },
  {
    title: "Current Month Savings Rate",
    value: "73.6%",
    detail: "Great job! You’re saving well above the 20% benchmark.",
    icon: PiggyBank,
    accent: "text-emerald-700 bg-emerald-500/10",
  },
  {
    title: "Largest Transaction",
    value: "₹4,800.00",
    detail: "Monthly salary (raise) on Mar 1, 2025",
    icon: DollarSign,
    accent: "text-sky-600 bg-sky-500/10",
  },
  {
    title: "Most Frequent Category",
    value: "Food & Dining",
    detail: "18 transactions — small amounts add up quickly",
    icon: BarChart3,
    accent: "text-emerald-600 bg-emerald-500/10",
  },
  {
    title: "Overall Net Balance",
    value: "₹23,177.00",
    detail: "You’ve saved ₹23,177.00 across all recorded transactions.",
    icon: CircleDot,
    accent: "text-slate-900 bg-slate-200",
  },
];

export function InsightsSection() {
  const { formatCurrency, formatCompactCurrency, theme } = useDashboard();
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const res = await api.getAIInsights();
      setAdvice(res.advice);
    } catch (error) {
      console.error("AI Fetch Error:", error);
      setAdvice("Nexora is currently analyzing your deeper data patterns. Please check back in a few moments for elite financial strategies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

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
                    <span className="text-2xl font-black text-emerald-500">98%</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Market Sentiment</p>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-1.5 w-[75%] rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
                    <p className="text-[10px] font-bold text-slate-400">NEXT MILESTONE</p>
                    <p className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">Financial Freedom</p>
                    <p className="mt-0.5 text-[10px] text-emerald-500">4.2 years remaining</p>
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
                  <Line type="monotone" dataKey="Housing" stroke="#ef4444" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Shopping" stroke="#f97316" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Food & Dining" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Utilities" stroke="#22c55e" strokeWidth={3} dot={false} />
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
              {topCategories.map((category) => (
                <div key={category.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{category.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{category.transactions} txns</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950 dark:text-slate-100">{formatCurrency(category.amount)}</p>
                      <p className={cn("text-xs font-medium", category.name === "Housing" ? "text-slate-500" : "text-slate-500")}>{category.value.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full" style={{ width: `${category.value}%`, backgroundColor: category.color }} />
                  </div>
                </div>
              ))}
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
                        <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400">+{formatCurrency(row.net)}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">{row.savings}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {observations.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className={cn("border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80")}> 
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
