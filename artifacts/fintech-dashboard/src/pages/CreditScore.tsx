import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Car,
  Home,
  SlidersHorizontal,
  Save,
  TrendingDown,
  TrendingUp,
  Info,
  Lightbulb,
  ChevronRight,
  Minus,
  Target,
  Clock,
  Shield,
  ArrowRight,
  Trash2,
  Zap,
  Sparkles,
  Eye,
  BarChart3,
  RefreshCw,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MIN_SCORE = 300;
const MAX_SCORE = 900;
const INITIAL_SCORE = 750;

type ActionType = "miss_payment" | "pay_on_time" | "take_loan" | "adjust_utilization";
type LoanType = "credit_card" | "personal" | "auto" | "home";

type ScoreFactors = {
  paymentHistory: number; // 0-100 (higher is better)
  utilization: number; // 0-100 (lower is better)
  length: number; // 0-100 (higher is better)
  mix: number; // 0-100 (higher is better)
  newCredit: number; // 0-100 (higher is better)
};

interface ActionResult {
  action: ActionType;
  label: string;
  delta: number;
  prevScore: number;
  newScore: number;
  reason: string;
  tip: string;
  prevFactors: ScoreFactors;
  nextFactors: ScoreFactors;
  meta?: {
    loanType?: LoanType;
    utilizationPct?: number;
  };
}

interface HistoryEntry {
  index: number;
  score: number;
  label: string;
  short: string;
}

type SavedSimulation = {
  id: string;
  name: string;
  createdAt: number;
  score: number;
  factors: ScoreFactors;
  lastLabel?: string;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function rand(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const FACTOR_WEIGHTS = {
  paymentHistory: 0.35,
  utilization: 0.3,
  length: 0.15,
  mix: 0.1,
  newCredit: 0.1,
} as const;

const INITIAL_FACTORS: ScoreFactors = {
  paymentHistory: 90,
  utilization: 30,
  length: 65,
  mix: 60,
  newCredit: 67,
};

function norm01(v: number) {
  return clamp(v, 0, 100) / 100;
}

function scoreFromFactors(f: ScoreFactors) {
  const payment = norm01(f.paymentHistory);
  const utilInv = 1 - norm01(f.utilization);
  const length = norm01(f.length);
  const mix = norm01(f.mix);
  const newCredit = norm01(f.newCredit);

  const sum =
    FACTOR_WEIGHTS.paymentHistory * payment +
    FACTOR_WEIGHTS.utilization * utilInv +
    FACTOR_WEIGHTS.length * length +
    FACTOR_WEIGHTS.mix * mix +
    FACTOR_WEIGHTS.newCredit * newCredit;

  return clamp(Math.round(MIN_SCORE + sum * (MAX_SCORE - MIN_SCORE)), MIN_SCORE, MAX_SCORE);
}

function getScoreInfo(score: number) {
  if (score >= 850) return { label: "Exceptional", color: "#22c55e", ring: "rgba(34,197,94,0.2)", text: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" };
  if (score >= 750) return { label: "Very Good",  color: "#10b981", ring: "rgba(16,185,129,0.2)", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
  if (score >= 650) return { label: "Good",        color: "#f59e0b", ring: "rgba(245,158,11,0.2)",  text: "text-amber-400",   border: "border-amber-500/30",   bg: "bg-amber-500/10" };
  if (score >= 550) return { label: "Fair",        color: "#f97316", ring: "rgba(249,115,22,0.2)",  text: "text-orange-400",  border: "border-orange-500/30",  bg: "bg-orange-500/10" };
  return                   { label: "Poor",        color: "#f43f5e", ring: "rgba(244,63,94,0.2)",   text: "text-rose-400",    border: "border-rose-500/30",    bg: "bg-rose-500/10" };
}

function riskLabelFromScore(score: number) {
  if (score >= 750) return { label: "Low", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (score >= 650) return { label: "Medium", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  return { label: "High", color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/20" };
}

function projectScores(factors: ScoreFactors, months: number) {
  const data: { month: number; score: number }[] = [];
  let f = { ...factors };
  for (let i = 1; i <= months; i += 1) {
    // optimistic-but-realistic drift: on-time payments + inquiry fade
    f = {
      ...f,
      paymentHistory: clamp(f.paymentHistory + 0.6, 0, 100),
      newCredit: clamp(f.newCredit + 0.9, 0, 100),
      utilization: clamp(f.utilization - 0.2, 0, 100),
      length: clamp(f.length + 0.2, 0, 100),
    };
    data.push({ month: i, score: scoreFromFactors(f) });
  }
  return data;
}

// ─── Gauge ──────────────────────────────────────────────────────────────────

const CX = 150;
const CY = 145;
const R = 120;
const SW = 22;  // stroke width
const C = Math.PI * R; // half-circumference (semicircle arc length)

// Gauge zone definitions
const ZONES = [
  { min: 300, max: 549, color: "#f43f5e", label: "Poor" },
  { min: 550, max: 649, color: "#f97316", label: "Fair" },
  { min: 650, max: 749, color: "#f59e0b", label: "Good" },
  { min: 750, max: 849, color: "#10b981", label: "Very Good" },
  { min: 850, max: 900, color: "#22c55e", label: "Exceptional" },
];

function scoreToArcLen(score: number) {
  return C * (clamp(score, MIN_SCORE, MAX_SCORE) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
}

// Convert score to SVG angle/position (9 o'clock = 300, 3 o'clock = 900)
function scoreToPt(score: number, radius: number) {
  const α = ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * Math.PI; // 0 to π
  const stdAngle = Math.PI - α;
  return {
    x: CX + radius * Math.cos(stdAngle),
    y: CY - radius * Math.sin(stdAngle),
  };
}

function Gauge({ score, scoreInfo }: { score: number; scoreInfo: ReturnType<typeof getScoreInfo> }) {
  const valueLen = scoreToArcLen(score);

  // Build zone arcs
  const zoneArcs = ZONES.map((z) => {
    const startLen = scoreToArcLen(z.min);
    const endLen   = scoreToArcLen(Math.min(z.max + 1, MAX_SCORE));
    const len = endLen - startLen;
    return { ...z, startLen, len };
  });

  // Tick marks at major scores
  const ticks = [300, 500, 700, 900];

  return (
    <svg viewBox="0 0 300 165" className="w-full max-w-sm mx-auto overflow-visible">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#1e293b"
        strokeWidth={SW}
        strokeDasharray={`${C} ${C}`}
        strokeDashoffset={-C}
        strokeLinecap="butt"
      />

      {/* Zone color arcs */}
      {zoneArcs.map((z) => (
        <circle
          key={z.label}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={z.color}
          strokeOpacity={0.25}
          strokeWidth={SW}
          strokeDasharray={`${z.len} ${2 * C}`}
          strokeDashoffset={-(C + z.startLen)}
          strokeLinecap="butt"
        />
      ))}

      {/* Value arc (filled up to current score) */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={scoreInfo.color}
        strokeWidth={SW}
        strokeDasharray={`${Math.max(0, valueLen - 0.5)} ${2 * C}`}
        strokeDashoffset={-C}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease" }}
        filter="url(#glow)"
      />

      {/* Tick marks */}
      {ticks.map((s) => {
        const outer = scoreToPt(s, R + SW / 2 + 6);
        const inner = scoreToPt(s, R - SW / 2 - 6);
        const label = scoreToPt(s, R + SW / 2 + 18);
        return (
          <g key={s}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
              fill="#475569" fontSize="9" fontWeight="500">
              {s}
            </text>
          </g>
        );
      })}

      {/* Zone labels on outer ring */}
      {ZONES.map((z) => {
        const midScore = (z.min + Math.min(z.max, MAX_SCORE)) / 2;
        const pt = scoreToPt(midScore, R - SW / 2 - 14);
        return (
          <text key={z.label} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fill={z.color} fillOpacity={0.7} fontSize="7.5" fontWeight="600">
            {z.label}
          </text>
        );
      })}

      {/* Needle dot on the arc */}
      {(() => {
        const pt = scoreToPt(score, R);
        return (
          <circle
            cx={pt.x} cy={pt.y} r={7}
            fill={scoreInfo.color}
            stroke="#0f172a"
            strokeWidth={3}
            style={{ transition: "cx 0.6s cubic-bezier(0.34,1.56,0.64,1), cy 0.6s cubic-bezier(0.34,1.56,0.64,1), fill 0.4s ease" }}
          />
        );
      })()}

      {/* Center score display */}
      <text x={CX} y={CY - 14} textAnchor="middle" fill={scoreInfo.color}
        fontSize="46" fontWeight="800" style={{ transition: "fill 0.4s ease" }}>
        {score}
      </text>
      <text x={CX} y={CY + 22} textAnchor="middle" fill={scoreInfo.color}
        fillOpacity={0.9} fontSize="13" fontWeight="700"
        style={{ transition: "fill 0.4s ease" }}>
        {scoreInfo.label}
      </text>
      <text x={CX} y={CY + 38} textAnchor="middle" fill="#475569"
        fontSize="10">
        out of 900
      </text>
    </svg>
  );
}

// ─── Score Range Bar ─────────────────────────────────────────────────────────

function RangeBar({ score }: { score: number }) {
  const pct = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
        <span>300</span>
        <span>500</span>
        <span>700</span>
        <span>900</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden bg-slate-800">
        {/* Gradient track */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(to right, #f43f5e 0%, #f97316 25%, #f59e0b 50%, #10b981 70%, #22c55e 100%)", opacity: 0.3 }} />
        {/* Filled portion */}
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct * 100}%`,
            background: "linear-gradient(to right, #f43f5e 0%, #f97316 25%, #f59e0b 50%, #10b981 70%, #22c55e 100%)",
          }} />
        {/* Thumb */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-2 rounded-full bg-white shadow-lg transition-all duration-700 border border-slate-300/20"
          style={{ left: `${pct * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs mt-1.5" style={{ color: "transparent" }}>
        {ZONES.map((z) => (
          <span key={z.label} style={{ color: z.color }} className="font-medium text-[10px]">
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const s = payload[0].value;
  const info = getScoreInfo(s);
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-bold" style={{ color: info.color }}>{s} <span className="text-xs font-medium text-slate-400">— {info.label}</span></p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreditScore() {
  const [factors, setFactors] = useState<ScoreFactors>(INITIAL_FACTORS);
  const [score, setScore] = useState(() => scoreFromFactors(INITIAL_FACTORS));
  const [history, setHistory] = useState<HistoryEntry[]>([
    { index: 0, score: scoreFromFactors(INITIAL_FACTORS), label: "Starting Score", short: "Start" },
  ]);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const [loanType, setLoanType] = useState<LoanType>("personal");
  const [utilizationDraft, setUtilizationDraft] = useState<number>(INITIAL_FACTORS.utilization);

  const [targetScore, setTargetScore] = useState<number>(800);
  const [projectionHorizon, setProjectionHorizon] = useState<3 | 6 | 12>(6);

  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState<SavedSimulation[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const scoreInfo = getScoreInfo(score);
  const risk = riskLabelFromScore(score);

  useEffect(() => {
    setUtilizationDraft(factors.utilization);
  }, [factors.utilization]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexora.creditSimulations.v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedSimulation[];
      if (Array.isArray(parsed)) setSaved(parsed);
    } catch {
      // ignore storage parse issues
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("nexora.creditSimulations.v1", JSON.stringify(saved));
    } catch {
      // ignore storage write issues
    }
  }, [saved]);

  const doAction = useCallback((action: ActionType, meta?: { loanType?: LoanType; utilizationPct?: number }) => {
    if (isAnimating) return;
    setIsAnimating(true);

    let label = "";
    let reason = "";
    let tip = "";

    const prevScore = score;
    const prevFactors = factors;
    let nextFactors: ScoreFactors = { ...prevFactors };

    if (action === "miss_payment") {
      label = "Missed Payment";
      nextFactors = {
        ...nextFactors,
        paymentHistory: clamp(nextFactors.paymentHistory - rand(12, 28), 0, 100),
        utilization: clamp(nextFactors.utilization + rand(0, 5), 0, 100),
      };
      reason = `Missing a payment is the single most damaging action for your credit score — it accounts for 35% of your total score (payment history). Even one missed payment can stay on your report for up to 7 years. Lenders view this as a sign of financial instability and high risk.`;
      tip = `Set up automatic payments or phone reminders at least 5 days before each due date to prevent this in the future.`;
    } else if (action === "pay_on_time") {
      label = "On-Time Payment";
      nextFactors = {
        ...nextFactors,
        paymentHistory: clamp(nextFactors.paymentHistory + (prevScore < 600 ? rand(3, 6) : rand(1, 3)), 0, 100),
        newCredit: clamp(nextFactors.newCredit + rand(0, 2), 0, 100),
        utilization: clamp(nextFactors.utilization - (nextFactors.utilization > 35 ? rand(1, 3) : 0), 0, 100),
      };
      reason = `Paying on time is the most powerful thing you can do for your credit. Payment history makes up 35% of your score. Each on-time payment adds a positive mark to your report. The lower your score, the more impact each payment has — recovery accelerates with consistent behavior.`;
      tip = `Keep a streak going! 12 consecutive on-time payments can significantly accelerate your score recovery, especially after a miss.`;
    } else if (action === "take_loan") {
      const lt = meta?.loanType ?? loanType;
      const inquiryDrop =
        lt === "home" ? rand(6, 12) :
        lt === "auto" ? rand(7, 13) :
        lt === "credit_card" ? rand(8, 16) :
        rand(10, 18); // personal

      const utilBump =
        lt === "credit_card" ? rand(4, 12) :
        lt === "personal" ? rand(2, 8) :
        rand(1, 6);

      label =
        lt === "home" ? "New Home Loan" :
        lt === "auto" ? "New Auto Loan" :
        lt === "credit_card" ? "New Credit Card" :
        "New Personal Loan";

      nextFactors = {
        ...nextFactors,
        newCredit: clamp(nextFactors.newCredit - inquiryDrop, 0, 100),
        mix: clamp(nextFactors.mix + rand(2, 6), 0, 100),
        length: clamp(nextFactors.length - rand(1, 3), 0, 100),
        utilization: clamp(nextFactors.utilization + utilBump, 0, 100),
      };

      reason = `Taking a new loan triggers a "hard inquiry" on your credit report, which temporarily dips your score. New accounts also lower your average account age — a factor worth 15% of your score. Don't worry though: the impact fades in 12 months, and responsible repayment will more than recover the lost points.`;
      tip = `Avoid applying for multiple loans in a short period. Each hard inquiry adds up. Space applications out and only borrow what you can comfortably repay.`;
    } else if (action === "adjust_utilization") {
      const u = clamp(meta?.utilizationPct ?? utilizationDraft, 0, 100);
      label = `Utilization set to ${u}%`;
      nextFactors = { ...nextFactors, utilization: u };
      reason = `Credit utilization (how much of your available credit you use) is a major scoring factor — about 30% of your score. Lower utilization generally signals better risk management.`;
      tip = `Aim for under 30% (and under 10% for best results). If you need to spend more, pay before statement date so lower utilization is reported.`;
    }

    const newScore = scoreFromFactors(nextFactors);
    const actualDelta = newScore - prevScore;

    const result: ActionResult = {
      action,
      label,
      delta: actualDelta,
      prevScore,
      newScore,
      reason,
      tip,
      prevFactors,
      nextFactors,
      meta: {
        loanType: meta?.loanType ?? (action === "take_loan" ? loanType : undefined),
        utilizationPct: action === "adjust_utilization" ? (meta?.utilizationPct ?? utilizationDraft) : undefined,
      },
    };

    setScore(newScore);
    setFactors(nextFactors);
    setHistory((prev) => [
      ...prev,
      {
        index: prev.length,
        score: newScore,
        label,
        short: label.split(" ").map(w => w[0]).join(""),
      },
    ]);
    setLastAction(result);

    setTimeout(() => setIsAnimating(false), 700);
  }, [factors, isAnimating, loanType, score, utilizationDraft]);

  const resetScore = () => {
    const s = scoreFromFactors(INITIAL_FACTORS);
    setFactors(INITIAL_FACTORS);
    setScore(s);
    setHistory([{ index: 0, score: s, label: "Starting Score", short: "Start" }]);
    setLastAction(null);
  };

  const factorCards = useMemo(() => {
    return [
      {
        key: "paymentHistory" as const,
        label: "Payment History",
        weight: 35,
        value: factors.paymentHistory,
        scoreHint: "Biggest factor. Late payments hurt for a long time.",
        better: "higher" as const,
        color: "#10b981",
      },
      {
        key: "utilization" as const,
        label: "Utilization",
        weight: 30,
        value: factors.utilization,
        scoreHint: "Keep under 30% (under 10% is best).",
        better: "lower" as const,
        color: "#3b82f6",
      },
      {
        key: "length" as const,
        label: "Credit Age",
        weight: 15,
        value: factors.length,
        scoreHint: "Older accounts help. Avoid closing your oldest line.",
        better: "higher" as const,
        color: "#8b5cf6",
      },
      {
        key: "mix" as const,
        label: "Credit Mix",
        weight: 10,
        value: factors.mix,
        scoreHint: "A healthy mix of loan types can help over time.",
        better: "higher" as const,
        color: "#f59e0b",
      },
      {
        key: "newCredit" as const,
        label: "New Credit",
        weight: 10,
        value: factors.newCredit,
        scoreHint: "Too many inquiries/new accounts can dip scores short-term.",
        better: "higher" as const,
        color: "#f97316",
      },
    ];
  }, [factors.length, factors.mix, factors.newCredit, factors.paymentHistory, factors.utilization]);

  const projection = useMemo(() => projectScores(factors, 12), [factors]);
  const projectionView = useMemo(
    () => projection.slice(0, projectionHorizon),
    [projection, projectionHorizon],
  );

  const goal = useMemo(() => {
    const steps: { title: string; detail: string }[] = [];

    if (targetScore > score) {
      if (factors.utilization > 30) {
        steps.push({
          title: "Lower utilization",
          detail: `Bring utilization from ${Math.round(factors.utilization)}% to ~25% by paying before statement date or requesting a limit increase.`,
        });
      }
      if (factors.paymentHistory < 95) {
        steps.push({
          title: "Protect payment history",
          detail: "Set autopay for minimum due + reminders. One missed payment can outweigh many good actions.",
        });
      }
      if (factors.newCredit < 70) {
        steps.push({
          title: "Pause new applications",
          detail: "Avoid new credit inquiries for 3–6 months so inquiry impact can fade.",
        });
      }
      steps.push({
        title: "Keep a steady routine",
        detail: "Make on-time payments monthly and review utilization weekly. Consistency beats optimization.",
      });
    } else {
      steps.push({
        title: "Maintain",
        detail: "You're at or above the target. Keep utilization low and avoid unnecessary new credit.",
      });
    }

    const estimatedMonths = Math.min(
      12,
      projection.findIndex((p) => p.score >= targetScore) + 1 || 12,
    );

    return { steps, estimatedMonths };
  }, [factors.newCredit, factors.paymentHistory, factors.utilization, projection, score, targetScore]);

  const presets = useMemo(() => {
    const carLoan: { label: string; icon: typeof Car; factors: ScoreFactors; utilization: number; note: string } = {
      label: "Buying a Car",
      icon: Car,
      factors: { ...factors, newCredit: clamp(factors.newCredit - 10, 0, 100), mix: clamp(factors.mix + 4, 0, 100), utilization: clamp(factors.utilization + 6, 0, 100) },
      utilization: clamp(factors.utilization + 6, 0, 100),
      note: "Simulates an auto-loan inquiry + new account. Expect a short-term dip, then gradual recovery.",
    };
    const cardApp: { label: string; icon: typeof CreditCard; factors: ScoreFactors; utilization: number; note: string } = {
      label: "Apply Credit Card",
      icon: CreditCard,
      factors: { ...factors, newCredit: clamp(factors.newCredit - 8, 0, 100), utilization: clamp(factors.utilization + 10, 0, 100) },
      utilization: clamp(factors.utilization + 10, 0, 100),
      note: "Simulates a credit card inquiry and a temporary utilization increase while you ramp up usage.",
    };
    const homeLoan: { label: string; icon: typeof Home; factors: ScoreFactors; utilization: number; note: string } = {
      label: "Taking a Loan",
      icon: Home,
      factors: { ...factors, newCredit: clamp(factors.newCredit - 12, 0, 100), mix: clamp(factors.mix + 5, 0, 100), utilization: clamp(factors.utilization + 4, 0, 100) },
      utilization: clamp(factors.utilization + 4, 0, 100),
      note: "Simulates a loan inquiry + new account. Keep EMIs on time to convert this into a positive long-term signal.",
    };
    return [carLoan, cardApp, homeLoan];
  }, [factors]);

  function applyPreset(p: { label: string; factors: ScoreFactors }) {
    const s = scoreFromFactors(p.factors);
    setFactors(p.factors);
    setScore(s);
    setHistory([{ index: 0, score: s, label: `Preset: ${p.label}`, short: "PRE" }]);
    setLastAction(null);
  }

  function saveSimulation() {
    const name = saveName.trim() || `Simulation ${saved.length + 1}`;
    const next: SavedSimulation = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      createdAt: Date.now(),
      score,
      factors,
      lastLabel: lastAction?.label,
    };
    setSaved((prev) => [next, ...prev].slice(0, 20));
    setSaveName("");
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function loadSimulation(sim: SavedSimulation) {
    setFactors(sim.factors);
    setScore(sim.score);
    setHistory([{ index: 0, score: sim.score, label: `Loaded: ${sim.name}`, short: "LOAD" }]);
    setLastAction(null);
  }

  function deleteSimulation(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    setCompareIds((prev) => prev.filter((x) => x !== id));
  }

  const comparedSims = useMemo(() => {
    return saved.filter((s) => compareIds.includes(s.id));
  }, [saved, compareIds]);

  const creditHealthScore = useMemo(() => {
    const payH = norm01(factors.paymentHistory);
    const utilH = 1 - norm01(factors.utilization);
    const lenH = norm01(factors.length);
    const mixH = norm01(factors.mix);
    const newH = norm01(factors.newCredit);
    return Math.round((payH * 0.35 + utilH * 0.3 + lenH * 0.15 + mixH * 0.1 + newH * 0.1) * 100);
  }, [factors]);

  const healthTips = useMemo(() => {
    const tips: { icon: typeof Zap; text: string; priority: "high" | "medium" | "low" }[] = [];
    if (factors.utilization > 50) tips.push({ icon: Zap, text: "Credit utilization is critically high. Pay down balances immediately.", priority: "high" });
    else if (factors.utilization > 30) tips.push({ icon: Zap, text: "Utilization is above 30%. Consider paying before statement date.", priority: "medium" });
    if (factors.paymentHistory < 70) tips.push({ icon: Zap, text: "Payment history needs repair. Never miss another due date.", priority: "high" });
    if (factors.newCredit < 50) tips.push({ icon: Zap, text: "Too many recent inquiries. Pause new applications for 6 months.", priority: "medium" });
    if (factors.mix < 40) tips.push({ icon: Zap, text: "Limited credit mix. Consider diversifying with a different loan type.", priority: "low" });
    if (factors.length < 40) tips.push({ icon: Zap, text: "Short credit history. Keep old accounts open and active.", priority: "low" });
    if (tips.length === 0) tips.push({ icon: Zap, text: "Your credit profile looks healthy! Keep up the good habits.", priority: "low" });
    return tips;
  }, [factors]);

  return (
    <main className="container mx-auto px-4 py-8 pb-20 max-w-5xl">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Credit Score Simulator</h1>
            <p className="text-slate-400 mt-1.5 font-medium">Take actions and see how they affect your credit score in real time.</p>
          </div>
          <button
            onClick={resetScore}
            className="text-xs text-slate-500 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 rounded-lg px-3 py-1.5 transition-all"
          >
            Reset to {INITIAL_SCORE}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — Gauge + Range Bar + Action Buttons */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Score gauge card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl"
            >
              <Gauge score={score} scoreInfo={scoreInfo} />

              <div className="mt-4 px-2">
                <RangeBar score={score} />
              </div>

              {/* Score delta badge */}
              <AnimatePresence mode="popLayout">
                {lastAction && (
                  <motion.div
                    key={lastAction.newScore}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mt-4 flex items-center justify-center gap-2"
                  >
                    {lastAction.delta > 0 ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">+{lastAction.delta} points</span>
                      </div>
                    ) : lastAction.delta < 0 ? (
                      <div className="flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/25 px-3 py-1">
                        <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                        <span className="text-sm font-bold text-rose-400">{lastAction.delta} points</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full bg-slate-700/50 border border-slate-600/40 px-3 py-1">
                        <Minus className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-400">No change (at limit)</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-5 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-slate-500" />
                Simulate an Action
              </h3>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                      Advanced Controls
                    </div>
                    <Badge variant="outline" className="border-slate-600/40 text-slate-300">
                      Utilization: {Math.round(factors.utilization)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Loan type</span>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button className="text-slate-500 hover:text-slate-300 transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border border-slate-700/60 text-slate-200">
                            Different loans have slightly different inquiry impact. Keep applications spaced out.
                          </TooltipContent>
                        </UiTooltip>
                      </div>
                      <Select value={loanType} onValueChange={(v) => setLoanType(v as LoanType)}>
                        <SelectTrigger className="bg-slate-950/20 border-slate-700/60 text-slate-200">
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700/60 text-slate-200">
                          <SelectItem value="personal">Personal loan</SelectItem>
                          <SelectItem value="credit_card">Credit card</SelectItem>
                          <SelectItem value="auto">Auto loan</SelectItem>
                          <SelectItem value="home">Home loan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Credit utilization</span>
                        <span className="text-xs font-bold text-slate-300">{Math.round(utilizationDraft)}%</span>
                      </div>
                      <Slider
                        value={[utilizationDraft]}
                        onValueChange={([v]) => setUtilizationDraft(v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[10px] text-slate-600">0%</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8"
                          onClick={() => doAction("adjust_utilization", { utilizationPct: utilizationDraft })}
                          disabled={isAnimating}
                        >
                          Apply
                        </Button>
                        <span className="text-[10px] text-slate-600">100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <ActionButton
                  onClick={() => doAction("miss_payment")}
                  disabled={isAnimating}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Miss Payment"
                  sublabel="Skips a bill due date"
                  variant="danger"
                  data-testid="button-miss-payment"
                />

                <ActionButton
                  onClick={() => doAction("pay_on_time")}
                  disabled={isAnimating}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Pay On Time"
                  sublabel="Makes a full, on-time payment"
                  variant="success"
                  data-testid="button-pay-on-time"
                />

                <ActionButton
                  onClick={() => doAction("take_loan")}
                  disabled={isAnimating}
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Take a Loan"
                  sublabel={`Opens a new ${loanType.replace("_", " ")} account`}
                  variant="neutral"
                  data-testid="button-take-loan"
                />
              </div>
            </motion.div>

            {/* Factor breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-5 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500" />
                What Makes Up Your Score
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Payment History", pct: 35, color: "#10b981" },
                  { label: "Credit Utilization", pct: 30, color: "#3b82f6" },
                  { label: "Length of Credit History", pct: 15, color: "#8b5cf6" },
                  { label: "Credit Mix", pct: 10, color: "#f59e0b" },
                  { label: "New Credit / Inquiries", pct: 10, color: "#f97316" },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">{f.label}</span>
                      <span className="font-bold" style={{ color: f.color }}>{f.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* RIGHT — Chart + Explanation */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Score history chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl"
            >
              <h3 className="text-base font-semibold text-slate-200 mb-1">Score History</h3>
              <p className="text-xs text-slate-500 mb-5">Track how each action changes your score over time</p>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={scoreInfo.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={scoreInfo.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#334155" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b" }}
                      interval={0}
                      tickFormatter={(v) => v.split(" ").map((w: string) => w[0]).join("").toUpperCase()}
                    />
                    <YAxis
                      domain={[Math.max(MIN_SCORE, Math.min(...history.map(h => h.score)) - 30), Math.min(MAX_SCORE, Math.max(...history.map(h => h.score)) + 30)]}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b" }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    {/* Reference lines for zones */}
                    <ReferenceLine y={850} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Exceptional", fill: "#22c55e", fontSize: 9, dx: 4 }} />
                    <ReferenceLine y={750} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Very Good", fill: "#10b981", fontSize: 9, dx: 4 }} />
                    <ReferenceLine y={650} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Good", fill: "#f59e0b", fontSize: 9, dx: 4 }} />
                    <ReferenceLine y={550} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Fair", fill: "#f97316", fontSize: 9, dx: 4 }} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={scoreInfo.color}
                      strokeWidth={2.5}
                      fill="url(#scoreGrad)"
                      activeDot={{ r: 6, fill: scoreInfo.color, stroke: "#0f172a", strokeWidth: 2 }}
                      dot={{ r: 4, fill: scoreInfo.color, stroke: "#0f172a", strokeWidth: 2 }}
                      style={{ transition: "stroke 0.4s ease" }}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* History pills */}
              {history.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {history.slice(1).map((h, i) => {
                    const prev = history[i].score;
                    const delta = h.score - prev;
                    return (
                      <div key={h.index} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border ${
                        delta > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : delta < 0 ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-slate-700/40 border-slate-600/40 text-slate-400"
                      }`}>
                        {delta > 0 ? "+" : ""}{delta} {h.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Explanation section */}
            <AnimatePresence mode="popLayout">
              {lastAction ? (
                <motion.div
                  key={lastAction.newScore + lastAction.action}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      lastAction.delta > 0 ? "bg-emerald-500/15" : lastAction.delta < 0 ? "bg-rose-500/15" : "bg-slate-700/50"
                    }`}>
                      {lastAction.delta > 0
                        ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                        : lastAction.delta < 0
                        ? <TrendingDown className="h-5 w-5 text-rose-400" />
                        : <Minus className="h-5 w-5 text-slate-400" />}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">
                        {lastAction.delta > 0
                          ? `Your score improved by ${lastAction.delta} points`
                          : lastAction.delta < 0
                          ? `Your score dropped by ${Math.abs(lastAction.delta)} points`
                          : "Score is at its limit"}
                      </h3>
                      <p className={`text-xs font-semibold mt-0.5 ${
                        lastAction.delta > 0 ? "text-emerald-400" : lastAction.delta < 0 ? "text-rose-400" : "text-slate-500"
                      }`}>
                        After: {lastAction.label}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900/50 border border-slate-800/60 p-4 mb-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-100">Why this happened: </span>
                      {lastAction.reason}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
                    <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-300 leading-relaxed">
                      <span className="font-semibold text-blue-200">Pro tip: </span>
                      {lastAction.tip}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-slate-700/50 p-8 flex flex-col items-center justify-center text-center"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                    <Info className="h-6 w-6 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No action taken yet</p>
                  <p className="text-xs text-slate-600 mt-1">Use the action buttons to simulate credit events and learn what drives your score</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ENHANCED ANALYSIS & TOOLS
            ═══════════════════════════════════════════════════════════ */}

        <div className="mt-10 mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Advanced Analysis</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />
        </div>

        {/* ── 1. Before vs After Comparison ── */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              key={"bva-" + lastAction.newScore + lastAction.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Before vs After
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Before card */}
                <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Before</span>
                  </div>
                  <div className="text-4xl font-extrabold tracking-tight" style={{ color: getScoreInfo(lastAction.prevScore).color }}>
                    {lastAction.prevScore}
                  </div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: getScoreInfo(lastAction.prevScore).color }}>
                    {getScoreInfo(lastAction.prevScore).label}
                  </div>
                  <div className="mt-4 space-y-2">
                    {(["paymentHistory", "utilization", "length", "mix", "newCredit"] as const).map((key) => {
                      const val = lastAction.prevFactors[key];
                      const labels = { paymentHistory: "Payment", utilization: "Utilization", length: "Credit Age", mix: "Credit Mix", newCredit: "New Credit" };
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-16 truncate font-medium">{labels[key]}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-slate-500/70 transition-all duration-500" style={{ width: `${val}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-7 text-right font-mono">{Math.round(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* After card */}
                <div className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: lastAction.delta > 0
                      ? "linear-gradient(135deg, rgba(16,185,129,0.06), transparent 60%)"
                      : lastAction.delta < 0
                      ? "linear-gradient(135deg, rgba(244,63,94,0.06), transparent 60%)"
                      : "none"
                  }} />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-2 w-2 rounded-full ${lastAction.delta > 0 ? "bg-emerald-400" : lastAction.delta < 0 ? "bg-rose-400" : "bg-slate-500"}`} />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">After</span>
                      <div className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        lastAction.delta > 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : lastAction.delta < 0 ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                      }`}>
                        {lastAction.delta > 0 ? <TrendingUp className="h-3 w-3" /> : lastAction.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {lastAction.delta > 0 ? "+" : ""}{lastAction.delta} pts
                      </div>
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight" style={{ color: scoreInfo.color }}>
                      {lastAction.newScore}
                    </div>
                    <div className="text-sm font-semibold mt-0.5" style={{ color: scoreInfo.color }}>
                      {scoreInfo.label}
                    </div>
                    <div className="mt-4 space-y-2">
                      {(["paymentHistory", "utilization", "length", "mix", "newCredit"] as const).map((key) => {
                        const val = lastAction.nextFactors[key];
                        const prev = lastAction.prevFactors[key];
                        const diff = Math.round(val - prev);
                        const labels = { paymentHistory: "Payment", utilization: "Utilization", length: "Credit Age", mix: "Credit Mix", newCredit: "New Credit" };
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 w-16 truncate font-medium">{labels[key]}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${diff > 0 ? "bg-emerald-400" : diff < 0 ? "bg-rose-400" : "bg-slate-500/70"}`} style={{ width: `${val}%` }} />
                            </div>
                            <span className={`text-[10px] w-7 text-right font-mono font-semibold ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-slate-500"}`}>
                              {diff !== 0 ? (diff > 0 ? "+" : "") + diff : Math.round(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2. Factor Health Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            Factor Health Dashboard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {factorCards.map((fc) => {
              const health = fc.better === "lower" ? (fc.value <= 30 ? "Excellent" : fc.value <= 50 ? "Good" : fc.value <= 70 ? "Fair" : "Poor") : (fc.value >= 80 ? "Excellent" : fc.value >= 60 ? "Good" : fc.value >= 40 ? "Fair" : "Poor");
              const healthColor = health === "Excellent" ? "text-emerald-400" : health === "Good" ? "text-blue-400" : health === "Fair" ? "text-amber-400" : "text-rose-400";
              const healthBg = health === "Excellent" ? "bg-emerald-500/10 border-emerald-500/20" : health === "Good" ? "bg-blue-500/10 border-blue-500/20" : health === "Fair" ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20";
              return (
                <div key={fc.key} className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-4 shadow-xl group hover:border-slate-600/80 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300">{fc.label}</span>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <button className="text-slate-600 hover:text-slate-400 transition-colors">
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border border-slate-700/60 text-slate-200 max-w-[200px]">
                        {fc.scoreHint}
                      </TooltipContent>
                    </UiTooltip>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-extrabold" style={{ color: fc.color }}>{Math.round(fc.value)}</span>
                    <span className="text-[10px] text-slate-500 mb-1 font-medium">/ 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: fc.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${fc.value}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthBg} ${healthColor}`}>{health}</span>
                    <span className="text-[10px] text-slate-600 font-medium">{fc.weight}% weight</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-600">
                    <ArrowRight className="h-2.5 w-2.5" />
                    <span>Better = {fc.better}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 3. Projection + 4. Goal Tracker Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

          {/* Timeline Projection Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-cyan-400" />
                Score Projection
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-slate-700/50 p-0.5 bg-slate-800/40">
                {([3, 6, 12] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setProjectionHorizon(h)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      projectionHorizon === h
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {h}mo
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-5">Projected score assuming on-time payments &amp; steady behavior</p>

            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionView} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#334155" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b" }}
                    tickFormatter={(v) => `Mo ${v}`}
                  />
                  <YAxis
                    domain={[
                      Math.max(MIN_SCORE, Math.min(score, ...(projectionView.map(p => p.score))) - 20),
                      Math.min(MAX_SCORE, Math.max(score, ...(projectionView.map(p => p.score))) + 20),
                    ]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={targetScore} stroke="#f59e0b" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: `Goal: ${targetScore}`, fill: "#f59e0b", fontSize: 10 }} />
                  <ReferenceLine y={score} stroke={scoreInfo.color} strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "Now", fill: scoreInfo.color, fontSize: 9 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fill="url(#projGrad)"
                    activeDot={{ r: 6, fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 2 }}
                    dot={{ r: 3, fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Projected score badge */}
            {projectionView.length > 0 && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1">
                  <TrendingUp className="h-3 w-3 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400">
                    Projected: {projectionView[projectionView.length - 1].score} in {projectionHorizon} months
                  </span>
                </div>
                <span className="text-[10px] text-slate-600">({projectionView[projectionView.length - 1].score - score > 0 ? "+" : ""}{projectionView[projectionView.length - 1].score - score} from current)</span>
              </div>
            )}
          </motion.div>

          {/* Goal Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl flex flex-col"
          >
            <h2 className="text-base font-semibold text-slate-200 mb-1 flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-amber-400" />
              Goal Tracker
            </h2>
            <p className="text-xs text-slate-500 mb-4">Set a target and get personalized steps</p>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs font-semibold text-slate-400">Target</label>
              <Input
                type="number"
                value={targetScore}
                onChange={(e) => setTargetScore(clamp(Number(e.target.value), MIN_SCORE, MAX_SCORE))}
                className="w-24 bg-slate-950/20 border-slate-700/60 text-slate-200 text-center font-bold"
                min={MIN_SCORE}
                max={MAX_SCORE}
              />
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold" style={{ color: scoreInfo.color }}>{score}</span>
                <span className="font-semibold text-amber-400">{targetScore}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((score - MIN_SCORE) / (targetScore - MIN_SCORE)) * 100)}%`,
                    background: `linear-gradient(to right, ${scoreInfo.color}, #f59e0b)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-600">Current</span>
                <span className="text-[10px] text-slate-600">
                  {score >= targetScore ? "✓ Achieved!" : `${targetScore - score} pts to go`}
                </span>
              </div>
            </div>

            {/* ETA badge */}
            {score < targetScore && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 mb-4 w-fit">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">
                  ~{goal.estimatedMonths} month{goal.estimatedMonths !== 1 ? "s" : ""} estimated
                </span>
              </div>
            )}

            {/* Steps */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {goal.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50 p-3">
                  <div className="h-5 w-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-400">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{step.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── 5. Real-Life Scenario Presets ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Scenario Lab
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {presets.map((preset, idx) => {
              const Icon = preset.icon;
              const presetScore = scoreFromFactors(preset.factors);
              const presetDelta = presetScore - score;
              const presetInfo = getScoreInfo(presetScore);
              return (
                <div key={idx} className="rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-5 shadow-xl hover:border-slate-600/80 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center group-hover:border-slate-600/60 transition-all">
                      <Icon className="h-5 w-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{preset.label}</p>
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${
                        presetDelta > 0 ? "text-emerald-400" : presetDelta < 0 ? "text-rose-400" : "text-slate-500"
                      }`}>
                        {presetDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : presetDelta < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                        {presetDelta > 0 ? "+" : ""}{presetDelta} pts → {presetScore} ({presetInfo.label})
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{preset.note}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => applyPreset(preset)}
                  >
                    Apply Scenario
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 6. Save & Compare + 7. Risk Assessment Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

          {/* Save & Compare Simulations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Save className="h-4.5 w-4.5 text-indigo-400" />
              Simulation Vault
            </h2>

            {/* Save form */}
            <div className="flex items-center gap-3 mb-5">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Simulation name…"
                className="flex-1 bg-slate-950/20 border-slate-700/60 text-slate-200"
              />
              <Button
                size="sm"
                onClick={saveSimulation}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>

            {/* Saved list */}
            {saved.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-10 w-10 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
                  <Save className="h-5 w-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-600">No saved simulations yet. Save your current state to compare later.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {saved.map((sim) => {
                  const simInfo = getScoreInfo(sim.score);
                  const isComparing = compareIds.includes(sim.id);
                  return (
                    <div key={sim.id} className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${
                      isComparing ? "bg-indigo-500/10 border-indigo-500/25" : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700/60"
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">{sim.name}</p>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color: simInfo.color, backgroundColor: simInfo.ring }}>
                            {sim.score}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {sim.lastLabel && <span className="text-[10px] text-slate-600">{sim.lastLabel}</span>}
                          <span className="text-[10px] text-slate-700">{new Date(sim.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => loadSimulation(sim)}
                              className="h-7 w-7 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border border-slate-700/60 text-slate-200">Load</TooltipContent>
                        </UiTooltip>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => toggleCompare(sim.id)}
                              className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
                                isComparing
                                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                                  : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                              }`}
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border border-slate-700/60 text-slate-200">{isComparing ? "Remove from compare" : "Compare"}</TooltipContent>
                        </UiTooltip>
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => deleteSimulation(sim.id)}
                              className="h-7 w-7 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border border-slate-700/60 text-slate-200">Delete</TooltipContent>
                        </UiTooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comparison view */}
            <AnimatePresence>
              {comparedSims.length === 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Comparison
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {comparedSims.map((sim) => {
                        const cInfo = getScoreInfo(sim.score);
                        return (
                          <div key={sim.id} className="rounded-lg bg-slate-900/50 border border-slate-800/50 p-3">
                            <p className="text-xs font-semibold text-slate-300 truncate mb-1">{sim.name}</p>
                            <p className="text-2xl font-extrabold" style={{ color: cInfo.color }}>{sim.score}</p>
                            <p className="text-[10px] font-semibold mt-0.5" style={{ color: cInfo.color }}>{cInfo.label}</p>
                            <div className="mt-2 space-y-1">
                              {(["paymentHistory", "utilization", "length", "mix", "newCredit"] as const).map((key) => (
                                <div key={key} className="flex items-center gap-1">
                                  <span className="text-[9px] text-slate-600 w-12 truncate">{key.replace(/([A-Z])/g, " $1").trim().split(" ")[0]}</span>
                                  <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${sim.factors[key]}%`, backgroundColor: cInfo.color }} />
                                  </div>
                                  <span className="text-[9px] text-slate-600 w-5 text-right">{Math.round(sim.factors[key])}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-center">
                      <span className={`text-xs font-bold ${
                        comparedSims[0].score > comparedSims[1].score ? "text-emerald-400" : comparedSims[0].score < comparedSims[1].score ? "text-rose-400" : "text-slate-400"
                      }`}>
                        Δ {Math.abs(comparedSims[0].score - comparedSims[1].score)} points difference
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Risk Assessment Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 rounded-2xl border border-slate-700/60 bg-[#1e293b]/90 p-6 shadow-xl flex flex-col"
          >
            <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-rose-400" />
              Risk Assessment
            </h2>

            {/* Risk level badge */}
            <div className={`rounded-xl p-4 mb-4 border ${risk.bg} ${risk.border} flex items-center gap-3`}>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${risk.bg}`}>
                <Shield className={`h-6 w-6 ${risk.color}`} />
              </div>
              <div>
                <p className={`text-lg font-extrabold ${risk.color}`}>{risk.label} Risk</p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {risk.label === "Low" ? "Lenders see you as reliable" : risk.label === "Medium" ? "Some room for improvement" : "Take immediate action"}
                </p>
              </div>
            </div>

            {/* Credit Health Score */}
            <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Credit Health</span>
                <span className="text-lg font-extrabold text-slate-100">{creditHealthScore}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: creditHealthScore >= 80 ? "linear-gradient(to right, #10b981, #22c55e)" : creditHealthScore >= 60 ? "linear-gradient(to right, #f59e0b, #10b981)" : "linear-gradient(to right, #f43f5e, #f59e0b)"
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${creditHealthScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Health tips */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {healthTips.map((tip, i) => (
                <div key={i} className={`flex items-start gap-2.5 rounded-xl p-3 border ${
                  tip.priority === "high" ? "bg-rose-500/5 border-rose-500/15" : tip.priority === "medium" ? "bg-amber-500/5 border-amber-500/15" : "bg-slate-900/40 border-slate-800/50"
                }`}>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    tip.priority === "high" ? "bg-rose-500/15" : tip.priority === "medium" ? "bg-amber-500/15" : "bg-emerald-500/15"
                  }`}>
                    <Zap className={`h-2.5 w-2.5 ${
                      tip.priority === "high" ? "text-rose-400" : tip.priority === "medium" ? "text-amber-400" : "text-emerald-400"
                    }`} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
    </main>
  );
}

// ─── Action Button Component ─────────────────────────────────────────────────

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  variant: "danger" | "success" | "neutral";
  "data-testid"?: string;
}

function ActionButton({ onClick, disabled, icon, label, sublabel, variant, ...rest }: ActionButtonProps) {
  const styles = {
    danger: {
      base: "border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50",
      icon: "bg-rose-500/20 text-rose-400",
      label: "text-rose-300",
      sub: "text-rose-500/70",
    },
    success: {
      base: "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50",
      icon: "bg-emerald-500/20 text-emerald-400",
      label: "text-emerald-300",
      sub: "text-emerald-500/70",
    },
    neutral: {
      base: "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50",
      icon: "bg-blue-500/20 text-blue-400",
      label: "text-blue-300",
      sub: "text-blue-500/70",
    },
  };

  const s = styles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={rest["data-testid"]}
      className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-left ${s.base}`}
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${s.label}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${s.sub}`}>{sublabel}</p>
      </div>
    </button>
  );
}
