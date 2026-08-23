import React from "react";
import { AlertCircle, RefreshCw, CreditCard, Gift, ShieldAlert, ChevronRight, Info } from "lucide-react";

interface RiskCategory {
  id: string;
  name: string;
  amount: string;
  percentage: number;
  riskScore: number;
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  color: string;
  barColor: string;
  badgeBg: string;
  icon: any;
  primaryDrivers: string[];
  casesFlagged: number;
  description: string;
}

export function SentinelRiskBreakdown() {
  const categories: RiskCategory[] = [
    {
      id: "fraud",
      name: "Fraud Risk",
      amount: "$62,400",
      percentage: 43.7,
      riskScore: 88,
      level: "CRITICAL",
      color: "text-red-400",
      barColor: "bg-gradient-to-r from-red-600 to-red-400",
      badgeBg: "bg-red-500/15 text-red-300 border-red-500/30",
      icon: ShieldAlert,
      primaryDrivers: ["Stolen Card Testing", "High Velocity IP Clusters", "Device Fingerprint Mismatch"],
      casesFlagged: 11,
      description: "Unauthorized transactions originating from compromised credentials or bot scripts.",
    },
    {
      id: "return",
      name: "Return Risk",
      amount: "$38,250",
      percentage: 26.8,
      riskScore: 76,
      level: "HIGH",
      color: "text-amber-400",
      barColor: "bg-gradient-to-r from-amber-600 to-amber-400",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: RefreshCw,
      primaryDrivers: ["Serial Wardrobing", "Empty Box Claims", "Cross-Merchant Receipt Reuse"],
      casesFlagged: 6,
      description: "Abuse of merchandise return policies, wardrobing, or counterfeit item returns.",
    },
    {
      id: "chargeback",
      name: "Chargeback Risk",
      amount: "$28,100",
      percentage: 19.7,
      riskScore: 68,
      level: "MEDIUM",
      color: "text-blue-400",
      barColor: "bg-gradient-to-r from-blue-600 to-blue-400",
      badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      icon: CreditCard,
      primaryDrivers: ["Friendly Fraud Claims", "Unrecognized Descriptor", "Friendly Buyer Remorse"],
      casesFlagged: 4,
      description: "Pending dispute threats and payment reversals initiated through issuing banks.",
    },
    {
      id: "abuse",
      name: "Abuse Risk",
      amount: "$14,100",
      percentage: 9.8,
      riskScore: 54,
      level: "LOW",
      color: "text-purple-400",
      barColor: "bg-gradient-to-r from-purple-600 to-purple-400",
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      icon: Gift,
      primaryDrivers: ["Promo Stacking", "Fake Account Creation", "Referral Ring Exploitation"],
      casesFlagged: 3,
      description: "Policy exploitation including promo code multi-accounting and incentive abuse.",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Risk Exposure Breakdown</h2>
            <span className="text-xs text-slate-400 font-mono">($142,850 Total Exposure)</span>
          </div>
          <p className="text-xs text-slate-400">
            Categorized risk vectors causing potential loss across merchant operations
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Info className="h-3.5 w-3.5 text-emerald-400" />
          <span>Real-time Risk Vectors</span>
        </div>
      </div>

      {/* Exposure Visual Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>Exposure Distribution</span>
          <span>100% Risk Allocation</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800">
          {categories.map((c) => (
            <div
              key={c.id}
              style={{ width: `${c.percentage}%` }}
              className={`h-full ${c.barColor} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
              title={`${c.name}: ${c.amount} (${c.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/70"
            >
              <div>
                {/* Category Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${c.color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{c.casesFlagged} Flagged Cases</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-white tracking-tight">{c.amount}</span>
                    <span className="block text-[10px] text-slate-400">{c.percentage}% of total</span>
                  </div>
                </div>

                {/* Progress bar per item */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Category Risk Index</span>
                    <span className={`font-bold ${c.color}`}>{c.riskScore}/100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      style={{ width: `${c.riskScore}%` }}
                      className={`h-full ${c.barColor} rounded-full`}
                    />
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-slate-300/90 leading-relaxed">{c.description}</p>
              </div>

              {/* Drivers Tags */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                  Top Risk Signals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.primaryDrivers.map((driver, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                    >
                      • {driver}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
