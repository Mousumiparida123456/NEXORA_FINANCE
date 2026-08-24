import React from "react";
import { SentinelHeader } from "./SentinelHeader";
import { SentinelArchitectureFlow } from "./SentinelArchitectureFlow";
import { SentinelMetrics } from "./SentinelMetrics";
import { SentinelRiskBreakdown } from "./SentinelRiskBreakdown";
import { SentinelRiskTrendChart } from "./SentinelRiskTrendChart";
import { SentinelTransactionsTable } from "./SentinelTransactionsTable";
import { SentinelAIAgentSummary } from "./SentinelAIAgentSummary";
import { SentinelRiskEventsTimeline } from "./SentinelRiskEventsTimeline";

export function SentinelDashboard() {
  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header (NEXORA SENTINEL branding, merchant selector, time, status, demo banner) */}
      <SentinelHeader />

      {/* Demo Story Quick Access & Risk Distribution Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-lg font-black text-white tracking-tight">NEXORA SENTINEL · Merchant Protection</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              "Nexora Sentinel is the merchant protection layer of Nexora. It continuously monitors payment activity and identifies transactions that may result in fraud, chargebacks or other losses."
            </p>
          </div>

          <a
            href="/merchant/safepay"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/10 transition-all"
          >
            ⚡ Launch SafePay Simulator (Demo Story) →
          </a>
        </div>

        {/* STEP 1: Key Overview Cards & Risk Distribution Visualizer */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Transactions</span>
            <div className="text-2xl font-black text-white font-mono">1,248</div>
            <span className="text-[10px] text-emerald-400">99.2% Clean Velocity</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Money at Risk</span>
            <div className="text-2xl font-black text-amber-400 font-mono">₹84,500</div>
            <span className="text-[10px] text-amber-400/80">Across 12 Flagged Payments</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Investigations</span>
            <div className="text-2xl font-black text-red-400 font-mono">12</div>
            <span className="text-[10px] text-red-400/80">Including INV-00291 (Hold)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Risk Distribution</span>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-14 text-slate-400">LOW</span>
                <div className="flex-1 h-2 rounded bg-emerald-500/30 overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[70%]" />
                </div>
                <span className="text-emerald-400 font-bold">68%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 text-slate-400">MEDIUM</span>
                <div className="flex-1 h-2 rounded bg-blue-500/30 overflow-hidden">
                  <div className="h-full bg-blue-400 w-[18%]" />
                </div>
                <span className="text-blue-400 font-bold">18%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 text-slate-400">HIGH</span>
                <div className="flex-1 h-2 rounded bg-amber-500/30 overflow-hidden">
                  <div className="h-full bg-amber-400 w-[10%]" />
                </div>
                <span className="text-amber-400 font-bold">10%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 text-slate-400">CRITICAL</span>
                <div className="flex-1 h-2 rounded bg-red-500/30 overflow-hidden">
                  <div className="h-full bg-red-400 w-[4%]" />
                </div>
                <span className="text-red-400 font-bold">4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Diagram Pipeline Flow */}
      <SentinelArchitectureFlow />

      {/* 2. Top Metrics (Money at Risk, High-Risk Txns, Open Investigations, Preventable Loss) */}
      <SentinelMetrics />

      {/* 3. Risk Exposure Breakdown (Fraud, Return, Chargeback, Abuse categories) */}
      <SentinelRiskBreakdown />

      {/* 4. Risk Trend Chart (Recharts visualization over time) */}
      <SentinelRiskTrendChart />

      {/* 5. High-Risk Transactions Table (8 columns, search, filters, investigate modal) */}
      <SentinelTransactionsTable />

      {/* 6 & 7. Grid for AI Risk Agent Summary and Recent Risk Events Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SentinelAIAgentSummary />
        </div>
        <div className="lg:col-span-1">
          <SentinelRiskEventsTimeline />
        </div>
      </div>
    </div>
  );
}
