import { useEffect, useMemo, useState } from "react";
import { Edit3, Home, Laptop, PiggyBank, Plane, Plus, Trash2, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { isSameMonth, parseISO, subMonths } from "date-fns";
import { buildTrajectory, predictNetWorth } from "@/lib/financial-engine/goal-engine";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/lib/notification-context";

type IconKey = "PiggyBank" | "Plane" | "Laptop" | "Home";

type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  icon: IconKey;
  accent: string;
};

type GoalFormState = {
  name: string;
  target: number;
  saved: number;
  deadline: string;
};

const STORAGE_KEY = "nexora.goals";

const defaultGoals: Goal[] = [
  {
    id: "goal-1",
    name: "Emergency Fund",
    target: 150000,
    saved: 0,
    deadline: "2025-01-24",
    icon: "PiggyBank",
    accent: "#6366f1",
  },
  {
    id: "goal-2",
    name: "Europe Vacation",
    target: 80000,
    saved: 0,
    deadline: "2024-12-20",
    icon: "Plane",
    accent: "#f59e0b",
  },
  {
    id: "goal-3",
    name: "New Laptop",
    target: 90000,
    saved: 0,
    deadline: "2024-07-20",
    icon: "Laptop",
    accent: "#10b981",
  },
  {
    id: "goal-4",
    name: "Home Down Payment",
    target: 500000,
    saved: 0,
    deadline: "2025-04-30",
    icon: "Home",
    accent: "#ef4444",
  },
];

const ICONS: Record<IconKey, React.ElementType> = {
  PiggyBank,
  Plane,
  Laptop,
  Home,
};

const todayIso = new Date().toISOString().split("T")[0];

function getDaysLeft(deadline: string) {
  const now = new Date();
  const date = new Date(deadline);
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

function formatGoalAmount(value: number, formatCurrency: (valueInINR: number) => string) {
  return formatCurrency(value);
}

function monthDiffFromNow(deadline: string) {
  const now = new Date();
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return 0;
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(0, months);
}

type GoalHealth = "On Track" | "Achievable" | "Delayed" | "Risky";

function getGoalHealth(projectedMonths: number, monthsLeft: number): GoalHealth {
  if (!Number.isFinite(projectedMonths)) return "Risky";
  if (projectedMonths <= monthsLeft * 0.9) return "On Track";
  if (projectedMonths <= monthsLeft * 1.1) return "Achievable";
  if (projectedMonths <= monthsLeft * 1.5) return "Delayed";
  return "Risky";
}

export function Goals() {
  const { theme, formatCurrency } = useDashboard();
  const { transactions } = useTransactions();
  const { checkGoals } = useNotifications();
  const [autoAllocationPct, setAutoAllocationPct] = useState(20);

  const liveSummary = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const avgMonthlyNetSavings = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 3 }, (_, i) => subMonths(now, i)).map((d) => {
      const monthTx = transactions.filter((tx) => tx.date && isSameMonth(parseISO(tx.date), d));
      const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      return income - expenses;
    });
    const positive = buckets.map((v) => Math.max(0, v));
    const avg = positive.reduce((s, v) => s + v, 0) / Math.max(positive.length, 1);
    return Math.round(avg);
  }, [transactions]);

  const monthlyAutoGoalContribution = useMemo(() => {
    return Math.round((avgMonthlyNetSavings * autoAllocationPct) / 100);
  }, [avgMonthlyNetSavings, autoAllocationPct]);

  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window === "undefined") return defaultGoals;
    try {
      // One-time migration: reset saved to 0 so Goal Savings starts fresh
      const migrated = window.localStorage.getItem("nexora.goals-v2-migrated");
      if (!migrated) {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.setItem("nexora.goals-v2-migrated", "true");
        return defaultGoals;
      }
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultGoals;
    } catch {
      return defaultGoals;
    }
  });

  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addingToGoal, setAddingToGoal] = useState<Goal | null>(null);
  const [manageType, setManageType] = useState<"deposit" | "withdraw">("deposit");
  const [form, setForm] = useState<GoalFormState>({
    name: "",
    target: 0,
    saved: 0,
    deadline: todayIso,
  });
  const [depositValue, setDepositValue] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    window.dispatchEvent(new CustomEvent("nexora:goals:changed"));
    checkGoals(goals, formatCurrency);
  }, [goals, checkGoals, formatCurrency]);

  const totals = useMemo(() => {
    const saved = goals.reduce((sum, goal) => sum + goal.saved, 0);
    const target = goals.reduce((sum, goal) => sum + goal.target, 0);
    return { saved, target };
  }, [goals]);


  const activeTheme = theme === "dark";

  const trajectoryData = useMemo(() => {
    return buildTrajectory(totals.saved, monthlyAutoGoalContribution, 0.08, 3); // 3-year projection
  }, [totals.saved, monthlyAutoGoalContribution]);

  const netWorthPredictions = useMemo(() => {
    return predictNetWorth(totals.saved, monthlyAutoGoalContribution, 0.08);
  }, [totals.saved, monthlyAutoGoalContribution]);

  const cardBase = activeTheme
    ? "border-slate-800/70 bg-slate-950 text-slate-100"
    : "border-slate-200 bg-white text-slate-950";

  const handleOpenNewGoal = () => {
    setForm({ name: "", target: 0, saved: 0, deadline: todayIso });
    setEditingGoal(null);
    setNewGoalOpen(true);
  };

  const handleSubmitGoal = () => {
    if (!form.name.trim() || form.target <= 0) return;

    const nextGoal: Goal = {
      id: editingGoal ? editingGoal.id : `goal-${Date.now()}`,
      name: form.name.trim(),
      target: form.target,
      saved: form.saved,
      deadline: form.deadline,
      icon: editingGoal ? editingGoal.icon : "PiggyBank",
      accent: editingGoal ? editingGoal.accent : "#6366f1",
    };

    setGoals((current) => {
      if (editingGoal) {
        return current.map((goal) => (goal.id === editingGoal.id ? nextGoal : goal));
      }
      return [nextGoal, ...current];
    });
    setNewGoalOpen(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({ name: goal.name, target: goal.target, saved: goal.saved, deadline: goal.deadline });
    setNewGoalOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!window.confirm("Delete this goal?") ) return;
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
  };

  const handleAddSavings = () => {
    if (!addingToGoal || depositValue <= 0) return;
    setGoals((current) =>
      current.map((goal) => {
        if (goal.id === addingToGoal.id) {
          if (manageType === "deposit") {
            return { ...goal, saved: Math.min(goal.target, goal.saved + depositValue) };
          } else {
            const actualWithdraw = Math.min(depositValue, goal.saved);
            return { ...goal, saved: goal.saved - actualWithdraw };
          }
        }
        return goal;
      })
    );
    setDepositValue(0);
    setAddingToGoal(null);
    setManageType("deposit");
  };

  const progressColor = (accent: string) => ({ backgroundColor: accent });

  return (
    <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold uppercase tracking-[0.24em]", activeTheme ? "text-blue-300" : "text-blue-600")}>Goals</p>
          <h1 className={cn("mt-2 text-3xl font-bold tracking-tight", activeTheme ? "text-slate-100" : "text-slate-950")}>Goal Tracker</h1>
          <p className={cn("mt-3 max-w-2xl text-sm leading-6", activeTheme ? "text-slate-400" : "text-slate-600")}>
            {formatCurrency(totals.saved)} saved of {formatCurrency(totals.target)} total target
          </p>
        </div>

        <Button onClick={handleOpenNewGoal} className="inline-flex items-center gap-2" size="lg">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Live Financial Summary from Real Transactions */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className={cn("border shadow-sm", activeTheme ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-blue-500" />
              <p className={cn("text-xs font-semibold uppercase tracking-wider", activeTheme ? "text-slate-400" : "text-slate-500")}>Net Savings</p>
            </div>
            <p className={cn("text-2xl font-bold", (liveSummary.net - totals.saved) >= 0 ? "text-blue-500" : "text-rose-500")}>{formatCurrency(liveSummary.net - totals.saved)}</p>
            <p className={cn("text-xs mt-1.5", activeTheme ? "text-slate-500" : "text-slate-400")}>Available balance after goal allocations</p>
          </CardContent>
        </Card>
        <Card className={cn("border shadow-sm", activeTheme ? "border-emerald-900/30 bg-slate-950" : "border-emerald-100 bg-white")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-emerald-500" />
              <p className={cn("text-xs font-semibold uppercase tracking-wider", activeTheme ? "text-slate-400" : "text-slate-500")}>Goal Savings</p>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totals.saved)}</p>
            <p className={cn("text-xs mt-1.5", activeTheme ? "text-slate-500" : "text-slate-400")}>Total allocated across {goals.length} goal{goals.length !== 1 ? "s" : ""} of {formatCurrency(totals.target)} target</p>
          </CardContent>
        </Card>
      </div>

      <Card className={cn("mb-6 border shadow-sm", activeTheme ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wider", activeTheme ? "text-slate-400" : "text-slate-500")}>Auto Savings Allocation</p>
              <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-300" : "text-slate-700")}>
                {autoAllocationPct}% of your average monthly savings auto-applied for projections.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={50}
                value={autoAllocationPct}
                onChange={(e) => setAutoAllocationPct(Number(e.target.value))}
                className="w-40"
              />
              <span className={cn("text-sm font-semibold", activeTheme ? "text-slate-100" : "text-slate-900")}>{autoAllocationPct}%</span>
              <span className={cn("text-sm", activeTheme ? "text-emerald-400" : "text-emerald-600")}>{formatCurrency(monthlyAutoGoalContribution)}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Worth Forecasting */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className={cn("col-span-2 border shadow-sm", activeTheme ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg font-semibold", activeTheme ? "text-slate-100" : "text-slate-950")}>Savings Trajectory</CardTitle>
            <p className={cn("text-sm", activeTheme ? "text-slate-400" : "text-slate-600")}>3-year projection combining current savings, monthly contribution, and 8% assumed annual return.</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMattress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={activeTheme ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="date" stroke={activeTheme ? "#64748b" : "#94a3b8"} tick={{ fill: activeTheme ? "#94a3b8" : "#64748b" }} tickMargin={10} minTickGap={30} />
                <YAxis tickFormatter={(val) => formatCurrency(val)} stroke={activeTheme ? "#64748b" : "#94a3b8"} tick={{ fill: activeTheme ? "#94a3b8" : "#64748b" }} width={80} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: activeTheme ? "#0f172a" : "#fff", borderColor: activeTheme ? "#334155" : "#e2e8f0", borderRadius: 8 }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: activeTheme ? "#94a3b8" : "#64748b" }}/>
                <Area type="monotone" dataKey="projectedValue" name="With Compounding (8%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProjected)" />
                <Area type="monotone" dataKey="mattressValue" name="Without Compounding" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorMattress)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 1/3/5 Year Predictions */}
        <div className="flex flex-col gap-4">
          {[
            { label: "1-Year Forecast", value: netWorthPredictions.oneYear, delay: 0.1 },
            { label: "3-Year Forecast", value: netWorthPredictions.threeYear, delay: 0.2 },
            { label: "5-Year Forecast", value: netWorthPredictions.fiveYear, delay: 0.3 },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay, duration: 0.5 }}
              className="h-full"
            >
              <Card className={cn("border shadow-sm h-full flex flex-col justify-center", activeTheme ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white")}>
                <CardContent className="p-6">
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", activeTheme ? "text-slate-400" : "text-slate-500")}>
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(item.value)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {goals.map((goal) => {
          const autoSavedPreview = goal.saved + monthlyAutoGoalContribution;
          const effectiveSaved = Math.min(goal.target, Math.max(goal.saved, autoSavedPreview));
          const percent = Math.min(100, Math.round((effectiveSaved / Math.max(1, goal.target)) * 100));
          const daysLeft = getDaysLeft(goal.deadline);
          const monthsLeft = monthDiffFromNow(goal.deadline);
          const remaining = Math.max(0, goal.target - effectiveSaved);
          const projectedMonths = monthlyAutoGoalContribution > 0 ? remaining / monthlyAutoGoalContribution : Number.POSITIVE_INFINITY;
          const projectedMonthsLabel = Number.isFinite(projectedMonths) ? `${projectedMonths.toFixed(1)} months` : "Not enough savings rate";
          const health = getGoalHealth(projectedMonths, Math.max(1, monthsLeft));
          const Icon = ICONS[goal.icon] ?? PiggyBank;

          return (
            <Card key={goal.id} className={cn("group overflow-hidden border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", cardBase)}>
              <CardHeader className="flex flex-wrap items-start justify-between gap-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl shadow-inner" style={{ backgroundColor: `${goal.accent}20` }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", activeTheme ? "text-slate-100" : "text-slate-900")}>{goal.name}</p>
                    <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-400" : "text-slate-500")}>{daysLeft} days left</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditGoal(goal)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 py-0">
                  <div className="space-y-3 rounded-3xl border p-4" style={{ borderColor: activeTheme ? "rgba(148,163,184,0.18)" : "rgba(226,232,240,1)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={cn("text-xs uppercase tracking-[0.24em]", activeTheme ? "text-slate-500" : "text-slate-400")}>Saved</p>
                      <p className={cn("mt-1 text-lg font-semibold", activeTheme ? "text-slate-100" : "text-slate-950")}>{formatGoalAmount(goal.saved, formatCurrency)}</p>
                      <p className={cn("mt-1 text-xs", activeTheme ? "text-slate-400" : "text-slate-500")}>+ {formatCurrency(monthlyAutoGoalContribution)} projected next month</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xs uppercase tracking-[0.24em]", activeTheme ? "text-slate-500" : "text-slate-400")}>Target</p>
                      <p className={cn("mt-1 text-lg font-semibold", activeTheme ? "text-slate-100" : "text-slate-950")}>{formatGoalAmount(goal.target, formatCurrency)}</p>
                    </div>
                  </div>

                  <div className="rounded-full bg-slate-200/80 p-1" style={{ backgroundColor: activeTheme ? "rgba(148,163,184,0.12)" : "#edf2f7" }}>
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, ...progressColor(goal.accent) }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className={cn(activeTheme ? "text-slate-400" : "text-slate-500")}>Remaining: {formatGoalAmount(remaining, formatCurrency)}</span>
                    <span className={cn(activeTheme ? "text-slate-100" : "text-slate-900")}>{percent}%</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className={cn("rounded-2xl px-3 py-2 text-xs", activeTheme ? "bg-slate-900/80 text-slate-300" : "bg-slate-50 text-slate-700")}>
                      Estimated completion: <span className="font-semibold">{projectedMonthsLabel}</span>
                    </div>
                    <div className={cn("rounded-2xl px-3 py-2 text-xs font-semibold",
                      health === "On Track" ? "bg-emerald-500/10 text-emerald-500" :
                      health === "Achievable" ? "bg-blue-500/10 text-blue-500" :
                      health === "Delayed" ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      Goal Health: {health}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className={cn("rounded-2xl px-3 py-2 text-sm font-medium", activeTheme ? "bg-slate-900/80 text-slate-200" : "bg-slate-50 text-slate-700")}>Deadline: {new Date(goal.deadline).toLocaleDateString()}</div>
                  <Button size="sm" onClick={() => { setAddingToGoal(goal); setManageType("deposit"); }} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Manage Savings
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {newGoalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={cn("w-full max-w-xl rounded-3xl border p-6 shadow-2xl", activeTheme ? "border-slate-800 bg-slate-950 text-slate-100" : "border-slate-200 bg-white text-slate-950")}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{editingGoal ? "Edit Goal" : "New Goal"}</h2>
                <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-400" : "text-slate-500")}>Create or update your savings goal details.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setNewGoalOpen(false)}>
                ×
              </Button>
            </div>
            <div className="grid gap-4 py-2">
              <label className="grid gap-2 text-sm font-medium">
                Goal Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                  placeholder="Emergency Fund"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Target Amount
                <input
                  type="number"
                  min={0}
                  value={form.target}
                  onChange={(event) => setForm((current) => ({ ...current, target: Number(event.target.value) }))}
                  className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Current Saved
                <input
                  type="number"
                  min={0}
                  value={form.saved}
                  onChange={(event) => setForm((current) => ({ ...current, saved: Number(event.target.value) }))}
                  className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Deadline
                <input
                  type="date"
                  value={form.deadline}
                  min={todayIso}
                  onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                  className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setNewGoalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitGoal}>{editingGoal ? "Save Changes" : "Create Goal"}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {Boolean(addingToGoal) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={cn("w-full max-w-xl rounded-3xl border p-6 shadow-2xl", activeTheme ? "border-slate-800 bg-slate-950 text-slate-100" : "border-slate-200 bg-white text-slate-950")}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Manage Goal Savings</h2>
                <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-400" : "text-slate-500")}>Deposit or withdraw from this goal.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setAddingToGoal(null); setDepositValue(0); }}>
                ×
              </Button>
            </div>
            
            <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: activeTheme ? "rgba(148,163,184,0.12)" : "rgba(226,232,240,1)" }}>
              <p className={cn("text-sm font-medium", activeTheme ? "text-slate-100" : "text-slate-900")}>{addingToGoal?.name}</p>
              <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-400" : "text-slate-500")}>Current saved: {addingToGoal ? formatCurrency(addingToGoal.saved) : "--"}</p>
            </div>

            <Tabs value={manageType} onValueChange={(v) => setManageType(v as "deposit" | "withdraw")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit">
                <div className={cn("text-xs mb-3 font-medium flex items-center justify-between", activeTheme ? "text-slate-400" : "text-slate-500")}>
                  <span>Net Savings: <span className="text-blue-500">{formatCurrency(liveSummary.net)}</span></span>
                  <span>Remaining for goal: <span className="text-emerald-500">{addingToGoal ? formatCurrency(Math.max(0, addingToGoal.target - addingToGoal.saved)) : "--"}</span></span>
                </div>
                <label className="grid gap-2 text-sm font-medium">
                  Amount to Deposit
                  <input
                    type="number"
                    min={0}
                    max={addingToGoal ? addingToGoal.target - addingToGoal.saved : undefined}
                    value={depositValue || ""}
                    onChange={(event) => setDepositValue(Number(event.target.value))}
                    className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                    placeholder="Enter amount"
                  />
                </label>
                {addingToGoal && depositValue > (addingToGoal.target - addingToGoal.saved) && (
                  <p className="mt-2 text-xs text-amber-500">Amount exceeds remaining goal target.</p>
                )}
              </TabsContent>

              <TabsContent value="withdraw">
                <p className={cn("text-xs mb-3 font-medium", activeTheme ? "text-amber-400" : "text-amber-600")}>
                  Available to withdraw: {addingToGoal ? formatCurrency(addingToGoal.saved) : "--"}
                </p>
                <label className="grid gap-2 text-sm font-medium">
                  Amount to Withdraw
                  <input
                    type="number"
                    min={0}
                    max={addingToGoal?.saved || 0}
                    value={depositValue || ""}
                    onChange={(event) => setDepositValue(Number(event.target.value))}
                    className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                    placeholder="Enter amount"
                  />
                </label>
                {(depositValue > (addingToGoal?.saved || 0)) && (
                  <p className="mt-2 text-xs text-rose-500">Exceeds current saved amount for this goal.</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setAddingToGoal(null); setDepositValue(0); }}>Cancel</Button>
              <Button 
                onClick={handleAddSavings} 
                disabled={
                  depositValue <= 0 || 
                  (manageType === "deposit" && addingToGoal != null && depositValue > (addingToGoal.target - addingToGoal.saved)) ||
                  (manageType === "withdraw" && depositValue > (addingToGoal?.saved || 0))
                }
              >
                {manageType === "deposit" ? "Confirm Deposit" : "Confirm Withdraw"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
