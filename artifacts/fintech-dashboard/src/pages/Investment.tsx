import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  CalendarDays,
  CircleAlert,
  Clock,
  IndianRupee,
  Info,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type PlanId = "conservative" | "balanced" | "aggressive";

type Allocation = {
  key: "equity" | "debt" | "gold" | "cash";
  label: string;
  pct: number;
  color: string;
};

type Plan = {
  id: PlanId;
  title: string;
  subtitle: string;
  riskLabel: "Low Risk" | "Medium Risk" | "High Risk";
  expectedReturnsLabel: string;
  expectedAnnualReturn: number;
  allocations: Allocation[];
  worstCaseDrawdownPct: number;
  volatilityPct: number;
  accent: {
    from: string;
    to: string;
    border: string;
    badge: string;
  };
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function futureValueSip(monthly: number, years: number, annualRate: number) {
  if (monthly <= 0 || years <= 0) return 0;
  const n = years * 12;
  const r = annualRate / 12;
  if (r === 0) return monthly * n;
  return monthly * (((1 + r) ** n - 1) / r) * (1 + r);
}

function simulateStepUpSip({
  monthlyStart,
  years,
  annualRate,
  annualStepUpRate,
}: {
  monthlyStart: number;
  years: number;
  annualRate: number;
  annualStepUpRate: number;
}) {
  const months = Math.max(0, Math.floor(years * 12));
  const r = annualRate / 12;

  let totalInvested = 0;
  let value = 0;

  for (let m = 0; m < months; m += 1) {
    const yearIndex = Math.floor(m / 12);
    const monthlyContribution = monthlyStart * (1 + annualStepUpRate) ** yearIndex;
    totalInvested += monthlyContribution;
    value = value * (1 + r) + monthlyContribution;
  }

  return { value, totalInvested };
}

function requiredMonthlyForGoal({
  goal,
  years,
  annualRate,
  annualStepUpRate,
}: {
  goal: number;
  years: number;
  annualRate: number;
  annualStepUpRate: number;
}) {
  if (goal <= 0 || years <= 0) {
    return { monthlyStart: 0, totalInvested: 0, estimatedGains: 0, finalValue: 0 };
  }

  let lo = 0;
  let hi = Math.max(50, goal / (years * 12));

  for (let guard = 0; guard < 40; guard += 1) {
    const sim = simulateStepUpSip({
      monthlyStart: hi,
      years,
      annualRate,
      annualStepUpRate,
    });
    if (sim.value >= goal || hi >= 10_000_000) break;
    hi *= 2;
  }

  for (let i = 0; i < 45; i += 1) {
    const mid = (lo + hi) / 2;
    const sim = simulateStepUpSip({
      monthlyStart: mid,
      years,
      annualRate,
      annualStepUpRate,
    });
    if (sim.value >= goal) hi = mid;
    else lo = mid;
  }

  const rounded = Math.ceil(hi / 10) * 10;
  const finalSim = simulateStepUpSip({
    monthlyStart: rounded,
    years,
    annualRate,
    annualStepUpRate,
  });

  return {
    monthlyStart: rounded,
    totalInvested: finalSim.totalInvested,
    estimatedGains: Math.max(0, finalSim.value - finalSim.totalInvested),
    finalValue: finalSim.value,
  };
}

function percent(n: number) {
  return `${Math.round(n)}%`;
}

const PLANS: Plan[] = [
  {
    id: "conservative",
    title: "Conservative",
    subtitle: "Capital protection first",
    riskLabel: "Low Risk",
    expectedReturnsLabel: "6–8% expected returns",
    expectedAnnualReturn: 0.07,
    allocations: [
      { key: "equity", label: "Equity Index Funds", pct: 30, color: "#34d399" },
      { key: "debt", label: "Debt / Bonds", pct: 50, color: "#60a5fa" },
      { key: "gold", label: "Gold", pct: 10, color: "#fbbf24" },
      { key: "cash", label: "Cash / Liquid Fund", pct: 10, color: "#a78bfa" },
    ],
    worstCaseDrawdownPct: 12,
    volatilityPct: 10,
    accent: {
      from: "from-emerald-500/12",
      to: "to-cyan-400/10",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    },
  },
  {
    id: "balanced",
    title: "Balanced",
    subtitle: "Growth with stability",
    riskLabel: "Medium Risk",
    expectedReturnsLabel: "10–12% expected returns",
    expectedAnnualReturn: 0.11,
    allocations: [
      { key: "equity", label: "Equity (Large + Mid)", pct: 60, color: "#22c55e" },
      { key: "debt", label: "Debt / Bonds", pct: 30, color: "#60a5fa" },
      { key: "gold", label: "Gold", pct: 5, color: "#fbbf24" },
      { key: "cash", label: "Cash / Liquid Fund", pct: 5, color: "#a78bfa" },
    ],
    worstCaseDrawdownPct: 24,
    volatilityPct: 18,
    accent: {
      from: "from-sky-500/12",
      to: "to-emerald-500/10",
      border: "border-sky-500/20",
      badge: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    },
  },
  {
    id: "aggressive",
    title: "Aggressive",
    subtitle: "Maximize long-term returns",
    riskLabel: "High Risk",
    expectedReturnsLabel: "12–18% expected returns",
    expectedAnnualReturn: 0.15,
    allocations: [
      { key: "equity", label: "Equity (Growth + Global)", pct: 80, color: "#22c55e" },
      { key: "debt", label: "Debt / Bonds", pct: 15, color: "#60a5fa" },
      { key: "gold", label: "Gold", pct: 5, color: "#fbbf24" },
      { key: "cash", label: "Cash / Liquid Fund", pct: 0, color: "#a78bfa" },
    ],
    worstCaseDrawdownPct: 40,
    volatilityPct: 28,
    accent: {
      from: "from-fuchsia-500/12",
      to: "to-indigo-500/12",
      border: "border-fuchsia-500/20",
      badge: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25",
    },
  },
];

function AllocationRows({
  allocations,
  amountMonthly,
}: {
  allocations: Allocation[];
  amountMonthly: number;
}) {
  return (
    <div className="space-y-3">
      {allocations.map((a) => {
        const amt = (amountMonthly * a.pct) / 100;
        return (
          <div
            key={a.key}
            className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: a.color }}
                  />
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {a.label}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {percent(a.pct)} · {formatCurrency(amt)}/mo
                </p>
              </div>
              <div className="w-28">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${a.pct}%`, backgroundColor: a.color }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  monthly,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  monthly: number;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-slate-900/60 shadow-lg shadow-black/20",
        plan.accent.border,
        selected ? "ring-1 ring-emerald-400/40" : "hover:border-white/15"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          plan.accent.from,
          "via-transparent",
          plan.accent.to
        )}
      />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-50 tracking-tight">
              {plan.title}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {plan.subtitle}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn("border text-xs font-semibold", plan.accent.badge)}
          >
            {plan.riskLabel}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-400">
              Expected returns
            </p>
            <p className="mt-1 text-sm font-bold text-slate-100">
              {plan.expectedReturnsLabel}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-400">
              Suggested SIP
            </p>
            <p className="mt-1 text-sm font-bold text-slate-100">
              {formatCurrency(monthly)}/mo
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Asset allocation
          </p>
          <AllocationRows allocations={plan.allocations} amountMonthly={monthly} />
        </div>

        <Button
          onClick={onSelect}
          variant={selected ? "secondary" : "default"}
          className={cn(
            "w-full justify-center",
            !selected && "bg-emerald-500/90 text-emerald-950 border border-emerald-500/30"
          )}
        >
          {selected ? "Selected" : "Select Plan"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function Investment() {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("balanced");

  const [income, setIncome] = useState(5200);
  const [expenses, setExpenses] = useState(3100);

  const investable = Math.max(0, income - expenses);

  const [monthlyInvestment, setMonthlyInvestment] = useState(() =>
    clamp(Math.round(investable * 0.75), 0, investable)
  );
  const [horizonYears, setHorizonYears] = useState<5 | 10 | 20>(10);

  const [sipGoal, setSipGoal] = useState(50_000);
  const [sipYears, setSipYears] = useState(10);
  const [sipReturnPct, setSipReturnPct] = useState(11);
  const [sipStepUpEnabled, setSipStepUpEnabled] = useState(true);
  const [sipStepUpPct, setSipStepUpPct] = useState(10);
  const [sipInflationEnabled, setSipInflationEnabled] = useState(true);
  const [sipInflationPct, setSipInflationPct] = useState(6);

  useEffect(() => {
    setMonthlyInvestment((cur) => clamp(cur, 0, investable));
  }, [investable]);

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0],
    [selectedPlanId]
  );

  useEffect(() => {
    const returnPct = Math.round(selectedPlan.expectedAnnualReturn * 100 * 2) / 2;
    setSipReturnPct(returnPct);

    const stepUpByPlan: Record<PlanId, number> = {
      conservative: 6,
      balanced: 10,
      aggressive: 12,
    };
    setSipStepUpPct(stepUpByPlan[selectedPlanId]);
  }, [selectedPlan.expectedAnnualReturn, selectedPlanId]);

  const projection = useMemo(() => {
    const years = horizonYears;
    const points = Array.from({ length: years + 1 }, (_, year) => {
      const value = futureValueSip(monthlyInvestment, year, selectedPlan.expectedAnnualReturn);
      return { year, value };
    });
    const values = {
      y5: futureValueSip(monthlyInvestment, 5, selectedPlan.expectedAnnualReturn),
      y10: futureValueSip(monthlyInvestment, 10, selectedPlan.expectedAnnualReturn),
      y20: futureValueSip(monthlyInvestment, 20, selectedPlan.expectedAnnualReturn),
    };
    return { points, values };
  }, [horizonYears, monthlyInvestment, selectedPlan.expectedAnnualReturn]);

  const risk = useMemo(() => {
    const oneYearInvested = monthlyInvestment * 12;
    const worstCaseLoss = (oneYearInvested * selectedPlan.worstCaseDrawdownPct) / 100;
    return {
      oneYearInvested,
      worstCaseLoss,
      volatility: selectedPlan.volatilityPct,
      drawdown: selectedPlan.worstCaseDrawdownPct,
    };
  }, [monthlyInvestment, selectedPlan.volatilityPct, selectedPlan.worstCaseDrawdownPct]);

  const sip = useMemo(() => {
    const years = clamp(sipYears, 1, 40);
    const annualReturn = clamp(sipReturnPct, 0, 25) / 100;
    const annualStepUpRate = sipStepUpEnabled ? clamp(sipStepUpPct, 0, 25) / 100 : 0;
    const inflation = sipInflationEnabled ? clamp(sipInflationPct, 0, 12) / 100 : 0;

    const inflationAdjustedGoal = sipGoal * (1 + inflation) ** years;
    const effectiveGoal = sipInflationEnabled ? inflationAdjustedGoal : sipGoal;

    const req = requiredMonthlyForGoal({
      goal: effectiveGoal,
      years,
      annualRate: annualReturn,
      annualStepUpRate,
    });

    const withCurrent = simulateStepUpSip({
      monthlyStart: monthlyInvestment,
      years,
      annualRate: annualReturn,
      annualStepUpRate,
    });

    const affordabilityPct = investable > 0 ? (req.monthlyStart / investable) * 100 : Number.POSITIVE_INFINITY;

    return {
      years,
      annualReturn,
      annualStepUpRate,
      inflation,
      inflationAdjustedGoal,
      effectiveGoal,
      required: req,
      withCurrent,
      affordabilityPct,
    };
  }, [
    investable,
    monthlyInvestment,
    sipGoal,
    sipInflationEnabled,
    sipInflationPct,
    sipReturnPct,
    sipStepUpEnabled,
    sipStepUpPct,
    sipYears,
  ]);

  const aiRecommendation = useMemo(() => {
    if (income <= 0) {
      return {
        title: "Add your income to personalize",
        body: "Enter monthly income/expenses to get a tailored plan and a realistic SIP target.",
        tone: "neutral" as const,
      };
    }

    const savingsRate = investable / income;
    const suggested = clamp(Math.round(investable * 0.7), 0, investable);
    const planNudge =
      savingsRate < 0.15
        ? "Conservative"
        : savingsRate < 0.3
          ? "Balanced"
          : "Aggressive";

    if (investable <= 0) {
      return {
        title: "Expenses exceed income",
        body: "Reduce fixed expenses first (rent, EMIs, subscriptions). Once you free up cashflow, start a small SIP and increase quarterly.",
        tone: "warning" as const,
      };
    }

    return {
      title: "AI suggestion for your cashflow",
      body: `With ${formatCurrency(income)} income and ${formatCurrency(expenses)} expenses, your investable amount is ${formatCurrency(investable)}. Start with a ${formatCurrency(suggested)}/mo SIP and pick a ${planNudge}-leaning plan. Re-evaluate after 90 days.`,
      tone: "good" as const,
    };
  }, [income, expenses, investable]);

  return (
    <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">
            Investment Planner
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium">
            Pick a plan, set your SIP, and visualize wealth creation—Groww/Zerodha style.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-2">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          <span className="text-xs font-semibold text-slate-200">
            Dark · Minimal · Projection-first
          </span>
        </div>
      </div>

      <Card className="border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20 mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-300" />
            <CardTitle className="text-slate-50">Interactive Controls</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Tune income/expenses, SIP amount, and time horizon.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">
              Income & expenses
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Income (monthly)
                </p>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value || 0))}
                    inputMode="numeric"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Expenses (monthly)
                </p>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={expenses}
                    onChange={(e) => setExpenses(Number(e.target.value || 0))}
                    inputMode="numeric"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
              <span className="text-xs text-slate-400">Investable</span>
              <span className="text-sm font-bold text-slate-100">
                {formatCurrency(investable)}/mo
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-2">
              Monthly investment (SIP)
            </p>
            <p className="text-2xl font-black tracking-tight text-slate-50">
              {formatCurrency(monthlyInvestment)}
              <span className="text-sm text-slate-400 font-semibold"> / month</span>
            </p>
            <div className="mt-3">
              <Slider
                value={[monthlyInvestment]}
                onValueChange={([v]) => setMonthlyInvestment(v)}
                min={0}
                max={investable}
                step={50}
                disabled={investable <= 0}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{formatCurrency(0)}</span>
                <span>{formatCurrency(investable)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-2">
              Time horizon
            </p>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <Select
                value={String(horizonYears)}
                onValueChange={(v) => setHorizonYears(Number(v) as 5 | 10 | 20)}
              >
                <SelectTrigger className="bg-transparent border-white/10">
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10">
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="10">10 years</SelectItem>
                  <SelectItem value="20">20 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { label: "5Y", value: projection.values.y5 },
                { label: "10Y", value: projection.values.y10 },
                { label: "20Y", value: projection.values.y20 },
              ] as const).map((x) => (
                <div
                  key={x.label}
                  className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2"
                >
                  <p className="text-[11px] font-semibold text-slate-400">
                    {x.label}
                  </p>
                  <p className="text-sm font-bold text-slate-100">
                    {formatCurrency(x.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-50 tracking-tight">
          Choose Investment Plan
        </h2>
        <p className="text-slate-400 mt-1 font-medium">
          Simple portfolios with clear risk bands and allocation rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            monthly={monthlyInvestment}
            selected={plan.id === selectedPlanId}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              <CardTitle className="text-slate-50">Future Wealth Projection</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Compounded SIP projection using {selectedPlan.title} expected return.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full rounded-xl border border-white/10 bg-slate-950/30 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projection.points}>
                  <defs>
                    <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    stroke="rgba(148,163,184,0.6)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    stroke="rgba(148,163,184,0.6)"
                    tickFormatter={(v) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                      return String(v);
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(2,6,23,0.95)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      color: "white",
                    }}
                    labelFormatter={(label) => `${label} year${Number(label) === 1 ? "" : "s"}`}
                    formatter={(value) => [formatCurrency(Number(value)), "Projected value"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#valueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                { label: "5 years", value: projection.values.y5, icon: BarChart3 },
                { label: "10 years", value: projection.values.y10, icon: Target },
                { label: "20 years", value: projection.values.y20, icon: TrendingUp },
              ] as const).map((x) => (
                <div
                  key={x.label}
                  className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/12 border border-emerald-500/18 flex items-center justify-center">
                    <x.icon className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-400">{x.label}</p>
                    <p className="text-sm font-bold text-slate-100 truncate">
                      {formatCurrency(x.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-300" />
                <CardTitle className="text-slate-50">
                  Monthly Investment Breakdown
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Allocation of your SIP into categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllocationRows allocations={selectedPlan.allocations} amountMonthly={monthlyInvestment} />
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-amber-300" />
                <CardTitle className="text-slate-50">Risk Analysis</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Stress test metrics for the selected plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-400">
                  Worst-case 1Y loss (drawdown)
                </p>
                <p className="mt-1 text-lg font-black text-slate-100">
                  {formatCurrency(risk.worstCaseLoss)}
                  <span className="ml-2 text-xs text-slate-400 font-semibold">
                    ({risk.drawdown}%)
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">
                  Volatility indicator
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Low</span>
                  <span className="text-xs font-semibold text-slate-200">
                    {risk.volatility}%
                  </span>
                  <span className="text-xs text-slate-400">High</span>
                </div>
                <Progress value={clamp((risk.volatility / 35) * 100, 0, 100)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
              <CardTitle className="text-slate-50">Step-by-Step Action Plan</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              A simple execution checklist to stay consistent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              {
                title: "Open account",
                body: "Choose a broker, complete KYC, and link your bank account.",
              },
              {
                title: "Start SIP",
                body: "Start with a comfortable SIP and increase it every quarter.",
              },
              {
                title: "Automate investments",
                body: "Enable autopay, set calendar reminders, and avoid emotional trades.",
              },
              {
                title: "Rebalance portfolio",
                body: "Rebalance every 6–12 months to your target allocation.",
              },
            ] as const).map((step, idx) => (
              <div
                key={step.title}
                className="rounded-xl border border-white/10 bg-slate-950/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/12 border border-emerald-500/18 flex items-center justify-center">
                    <span className="text-sm font-black text-emerald-300">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-indigo-500/15" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-300" />
                <CardTitle className="text-slate-50">AI Recommendation</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Personalized from income/expenses.
              </CardDescription>
            </CardHeader>
          </div>
          <CardContent className="space-y-3">
            <div
              className={cn(
                "rounded-xl border bg-slate-950/30 px-4 py-3",
                aiRecommendation.tone === "warning"
                  ? "border-amber-500/20"
                  : "border-emerald-500/20"
              )}
            >
              <p className="text-sm font-bold text-slate-100">{aiRecommendation.title}</p>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                {aiRecommendation.body}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">Selected plan</p>
                <Badge variant="outline" className={cn("border text-xs", selectedPlan.accent.badge)}>
                  {selectedPlan.title}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-400">Expected annual return</p>
                <p className="text-xs font-semibold text-slate-100">
                  {Math.round(selectedPlan.expectedAnnualReturn * 100)}%
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-400">SIP</p>
                <p className="text-xs font-semibold text-slate-100">
                  {formatCurrency(monthlyInvestment)}/mo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="border border-white/10 bg-slate-900/60 shadow-lg shadow-black/20 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                <CardTitle className="text-slate-50">SIP Calculator</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Set a goal, time period, and expected returns to get a realistic SIP target.
              </CardDescription>
            </CardHeader>
          </div>

          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 tracking-widest uppercase">
                  Investment goal
                </p>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={sipGoal}
                    onChange={(e) => setSipGoal(Number(e.target.value || 0))}
                    inputMode="numeric"
                    className="pl-9 text-slate-100"
                  />
                </div>
                <div className="mt-3">
                  <Slider
                    value={[sipGoal]}
                    onValueChange={([v]) => setSipGoal(v)}
                    min={5_000}
                    max={1_000_000}
                    step={1_000}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatCurrency(5_000)}</span>
                    <span>{formatCurrency(1_000_000)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 tracking-widest uppercase">
                  Time period
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-100">
                    {sipYears} <span className="text-xs text-slate-400 font-semibold">yrs</span>
                  </p>
                  <Badge variant="outline" className="border-white/10 text-slate-300">
                    {sipYears <= 5 ? "Short" : sipYears <= 12 ? "Medium" : "Long"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <Slider
                    value={[sipYears]}
                    onValueChange={([v]) => setSipYears(v)}
                    min={1}
                    max={40}
                    step={1}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>1 yr</span>
                    <span>40 yrs</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
                    Expected annual return
                  </p>
                  <Badge variant="outline" className={cn("border text-xs", selectedPlan.accent.badge)}>
                    {selectedPlan.expectedReturnsLabel}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-100">{sipReturnPct}%</p>
                  <p className="text-xs text-slate-500">range: 4% (FD) → 20% (Aggressive)</p>
                </div>
                <div className="mt-3">
                  <Slider
                    value={[sipReturnPct]}
                    onValueChange={([v]) => setSipReturnPct(v)}
                    min={4}
                    max={20}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
                      Annual step-up
                    </p>
                    <Switch
                      checked={sipStepUpEnabled}
                      onCheckedChange={setSipStepUpEnabled}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-100">
                    {sipStepUpEnabled ? `${sipStepUpPct}% / year` : "Off"}
                  </p>
                  <div className="mt-3">
                    <Slider
                      value={[sipStepUpPct]}
                      onValueChange={([v]) => setSipStepUpPct(v)}
                      min={0}
                      max={20}
                      step={1}
                      disabled={!sipStepUpEnabled}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>0%</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
                      Inflation adjust
                    </p>
                    <Switch
                      checked={sipInflationEnabled}
                      onCheckedChange={setSipInflationEnabled}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-100">
                    {sipInflationEnabled ? `${sipInflationPct}% / year` : "Off"}
                  </p>
                  <div className="mt-3">
                    <Slider
                      value={[sipInflationPct]}
                      onValueChange={([v]) => setSipInflationPct(v)}
                      min={0}
                      max={10}
                      step={0.5}
                      disabled={!sipInflationEnabled}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>0%</span>
                      <span>10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 to-slate-950/30 p-6 shadow-xl shadow-black/25">
                <p className="text-[11px] font-bold tracking-widest uppercase text-sky-300/80 text-center">
                  Monthly SIP amount
                </p>
                <p className="mt-3 text-center text-5xl font-black tracking-tight text-sky-200">
                  {formatCurrency(sip.required.monthlyStart)}
                </p>
                <p className="mt-2 text-center text-sm text-slate-400">
                  invest every month for{" "}
                  <span className="font-semibold text-slate-200">{sip.years} years</span>{" "}
                  at{" "}
                  <span className="font-semibold text-slate-200">{sipReturnPct}% p.a.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400">Your goal</p>
                  <p className="mt-1 text-sm font-bold text-slate-100">
                    {formatCurrency(sip.effectiveGoal)}
                  </p>
                  {sipInflationEnabled && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      inflation-adjusted from {formatCurrency(sipGoal)}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400">Total you invest</p>
                  <p className="mt-1 text-sm font-bold text-slate-100">
                    {formatCurrency(sip.required.totalInvested)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-200/80">Estimated gains</p>
                  <p className="mt-1 text-sm font-bold text-emerald-200">
                    {formatCurrency(sip.required.estimatedGains)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-100">With your current SIP</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border text-xs",
                      sip.affordabilityPct <= 100 ? "border-emerald-500/25 text-emerald-300" : "border-amber-500/25 text-amber-300"
                    )}
                  >
                    {sip.affordabilityPct <= 100 ? "Affordable" : "Over budget"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  At {formatCurrency(monthlyInvestment)}/mo, you may reach{" "}
                  <span className="font-semibold text-slate-200">{formatCurrency(sip.withCurrent.value)}</span>{" "}
                  in {sip.years} years.
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Progress to goal</span>
                    <span>
                      {clamp((sip.withCurrent.value / Math.max(1, sip.effectiveGoal)) * 100, 0, 999).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={clamp((sip.withCurrent.value / Math.max(1, sip.effectiveGoal)) * 100, 0, 100)} />
                </div>
                {investable > 0 && (
                  <p className="mt-2 text-[10px] text-slate-500">
                    Required SIP is{" "}
                    <span className="font-semibold text-slate-300">{sip.affordabilityPct.toFixed(0)}%</span>{" "}
                    of your investable {formatCurrency(investable)}/mo.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 flex gap-2">
                <Info className="h-4 w-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Returns are estimated at{" "}
                  <span className="font-semibold">{sipReturnPct}% p.a.</span> and may vary with
                  market conditions. Consider keeping 3–6 months of expenses as emergency cash.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
