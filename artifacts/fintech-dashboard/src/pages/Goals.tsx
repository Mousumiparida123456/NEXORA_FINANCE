import { useEffect, useMemo, useState } from "react";
import { Edit3, Home, Laptop, PiggyBank, Plane, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

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
    saved: 62000,
    deadline: "2025-01-24",
    icon: "PiggyBank",
    accent: "#6366f1",
  },
  {
    id: "goal-2",
    name: "Europe Vacation",
    target: 80000,
    saved: 22000,
    deadline: "2024-12-20",
    icon: "Plane",
    accent: "#f59e0b",
  },
  {
    id: "goal-3",
    name: "New Laptop",
    target: 90000,
    saved: 45000,
    deadline: "2024-07-20",
    icon: "Laptop",
    accent: "#10b981",
  },
  {
    id: "goal-4",
    name: "Home Down Payment",
    target: 500000,
    saved: 120000,
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

export function Goals() {
  const { theme, formatCurrency } = useDashboard();
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window === "undefined") return defaultGoals;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultGoals;
    } catch {
      return defaultGoals;
    }
  });

  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addingToGoal, setAddingToGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalFormState>({
    name: "",
    target: 0,
    saved: 0,
    deadline: todayIso,
  });
  const [depositValue, setDepositValue] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const totals = useMemo(() => {
    const saved = goals.reduce((sum, goal) => sum + goal.saved, 0);
    const target = goals.reduce((sum, goal) => sum + goal.target, 0);
    return { saved, target };
  }, [goals]);

  const activeTheme = theme === "dark";

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
      current.map((goal) =>
        goal.id === addingToGoal.id
          ? { ...goal, saved: Math.min(goal.target, goal.saved + depositValue) }
          : goal,
      ),
    );
    setDepositValue(0);
    setAddingToGoal(null);
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

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.saved / Math.max(1, goal.target)) * 100));
          const daysLeft = getDaysLeft(goal.deadline);
          const remaining = Math.max(0, goal.target - goal.saved);
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
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className={cn("rounded-2xl px-3 py-2 text-sm font-medium", activeTheme ? "bg-slate-900/80 text-slate-200" : "bg-slate-50 text-slate-700")}>Deadline: {new Date(goal.deadline).toLocaleDateString()}</div>
                  <Button size="sm" onClick={() => setAddingToGoal(goal)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add Savings
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
                <h2 className="text-xl font-semibold">Add Savings</h2>
                <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-400" : "text-slate-500")}>Apply a new deposit to your goal.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAddingToGoal(null)}>
                ×
              </Button>
            </div>
            <div className="grid gap-4 py-2">
              <div className="rounded-2xl border p-4" style={{ borderColor: activeTheme ? "rgba(148,163,184,0.12)" : "rgba(226,232,240,1)" }}>
                <p className={cn("text-sm font-medium", activeTheme ? "text-slate-100" : "text-slate-900")}>{addingToGoal?.name}</p>
                <p className={cn("mt-1 text-sm", activeTheme ? "text-slate-400" : "text-slate-500")}>Current saved: {addingToGoal ? formatCurrency(addingToGoal.saved) : "--"}</p>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Amount
                <input
                  type="number"
                  min={0}
                  value={depositValue}
                  onChange={(event) => setDepositValue(Number(event.target.value))}
                  className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none transition", activeTheme ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-950")}
                  placeholder="Enter amount"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAddingToGoal(null)}>Cancel</Button>
              <Button onClick={handleAddSavings}>Save deposit</Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
