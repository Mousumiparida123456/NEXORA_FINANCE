import React, { useState } from "react";
import { SlidersHorizontal, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ChevronRight, Info } from "lucide-react";

export function MerchantRulesPage() {
  const [selectedRule, setSelectedRule] = useState("RULE-01");

  const rules = [
    {
      id: "RULE-01",
      name: "Unusual Transaction Amount",
      enabled: true,
      threshold: "5 × user's average transaction",
      triggeredCount: 28,
      lastTriggered: "2 minutes ago",
      description: "Flags payment attempts exceeding 500% of the customer's trailing 30-day baseline average.",
      signalContribution: "+12 to +20 points",
    },
    {
      id: "RULE-02",
      name: "High Transaction Velocity",
      enabled: true,
      threshold: "> 3 attempts per hour",
      triggeredCount: 42,
      lastTriggered: "14 minutes ago",
      description: "Detects rapid authorization frequency across short time windows.",
      signalContribution: "+7 to +25 points",
    },
    {
      id: "RULE-03",
      name: "New Recipient Account",
      enabled: true,
      threshold: "Recipient account < 7 days old",
      triggeredCount: 19,
      lastTriggered: "10 minutes ago",
      description: "Screen recipient VPA / wallet creation age and cross-network threat telemetry.",
      signalContribution: "+35 points",
    },
    {
      id: "RULE-04",
      name: "Multiple Failed Payments",
      enabled: true,
      threshold: "> 2 failed authorizations",
      triggeredCount: 31,
      lastTriggered: "1 hour ago",
      description: "Identifies BIN card testing patterns and repeated CVV failure spikes.",
      signalContribution: "+15 to +30 points",
    },
    {
      id: "RULE-05",
      name: "Previous Chargeback Association",
      enabled: true,
      threshold: "1+ chargeback on record",
      triggeredCount: 14,
      lastTriggered: "3 hours ago",
      description: "Correlates cardholder or recipient wallet with prior dispute filings.",
      signalContribution: "+15 to +60 points",
    },
    {
      id: "RULE-06",
      name: "Shared Device Fingerprint",
      enabled: true,
      threshold: "> 4 accounts on single hardware ID",
      triggeredCount: 8,
      lastTriggered: "5 hours ago",
      description: "Flags hardware reuse across multiple distinct user profiles.",
      signalContribution: "+18 points",
    },
    {
      id: "RULE-07",
      name: "Unusual Location Mismatch",
      enabled: true,
      threshold: "Distance > 5,000 km from billing",
      triggeredCount: 22,
      lastTriggered: "45 minutes ago",
      description: "Calculates geographical distance between IP egress node and card billing country.",
      signalContribution: "+15 points",
    },
  ];

  const activeRule = rules.find((r) => r.id === selectedRule) || rules[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-bold">
            <SlidersHorizontal className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Active Risk Rules Engine</h1>
            <p className="text-xs text-slate-400">
              Configurable policy controls that drive the explainable signal scoring pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>7 Active Policy Rules Enforced</span>
        </div>
      </div>

      {/* Quote Banner */}
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-3">
        <Info className="h-5 w-5 flex-shrink-0 text-emerald-400" />
        <p className="leading-relaxed font-mono">
          "These rules provide the signals used by the risk engine. They also make the system explainable and configurable."
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: STEP 10 ACTIVE RISK RULES */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">ACTIVE RISK RULES</h3>

          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRule(r.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  r.id === selectedRule
                    ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Triggered {r.triggeredCount} times</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{r.lastTriggered}</span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: STEP 10 RULE DETAIL VIEW */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#07131e]/95 p-6 shadow-xl space-y-5">
            <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">{activeRule.id}</span>
                <h2 className="text-lg font-black text-white">{activeRule.name}</h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold font-mono">
                ACTIVE POLICY
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeRule.description}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Threshold</span>
                <div className="text-xs font-bold text-amber-400 font-mono">{activeRule.threshold}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Signal Weight</span>
                <div className="text-xs font-bold text-emerald-400 font-mono">{activeRule.signalContribution}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Triggered Count</span>
                <div className="text-lg font-black text-white font-mono">{activeRule.triggeredCount} times</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Last Triggered</span>
                <div className="text-xs font-bold text-slate-300 font-mono">{activeRule.lastTriggered}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
