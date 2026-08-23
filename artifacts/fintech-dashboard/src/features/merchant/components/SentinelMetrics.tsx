import React from "react";
import { DollarSign, ShieldAlert, FileText, ShieldCheck, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export function SentinelMetrics() {
  const metrics = [
    {
      title: "Money at Risk",
      value: "$142,850",
      subtext: "Across 24 flagged transactions",
      change: "+12.4% vs last week",
      isNegative: true,
      icon: DollarSign,
      iconBg: "bg-red-500/15 text-red-400 border-red-500/30",
      accentBorder: "hover:border-red-500/40",
      badge: "High Exposure",
      badgeColor: "bg-red-500/15 text-red-300 border-red-500/30",
    },
    {
      title: "High-Risk Transactions",
      value: "24",
      subtext: "14 Critical (90+), 10 High (75-89)",
      change: "+4 today",
      isNegative: true,
      icon: ShieldAlert,
      iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      accentBorder: "hover:border-amber-500/40",
      badge: "Requires Review",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    {
      title: "Open Investigations",
      value: "7",
      subtext: "3 High Priority • 4 Under Analysis",
      change: "-2 resolved today",
      isNegative: false,
      icon: FileText,
      iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      accentBorder: "hover:border-blue-500/40",
      badge: "Active Cases",
      badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    {
      title: "Potentially Preventable Loss",
      value: "$98,400",
      subtext: "68.9% estimated mitigation rate",
      change: "+$18,200 saved this month",
      isNegative: false,
      icon: ShieldCheck,
      iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      accentBorder: "hover:border-emerald-500/40",
      badge: "Protected Capital",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div
            key={idx}
            className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 ${m.accentBorder}`}
          >
            {/* Top Row: Icon & Badge */}
            <div className="flex items-center justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${m.iconBg} shadow-inner`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.badgeColor}`}>
                {m.badge}
              </span>
            </div>

            {/* Metric Body */}
            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{m.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white tracking-tight sm:text-3xl">{m.value}</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 truncate">{m.subtext}</span>
              <span
                className={`flex items-center gap-1 font-medium text-[11px] ${
                  m.isNegative ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {m.isNegative ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
