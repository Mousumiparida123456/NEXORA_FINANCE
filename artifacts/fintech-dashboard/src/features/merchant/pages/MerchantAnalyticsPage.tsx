import React from "react";
import { Activity, ShieldAlert, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { SentinelRiskTrendChart } from "../components/SentinelRiskTrendChart";
import { useSentinelState } from "../context/SentinelContext";

export function MerchantAnalyticsPage() {
  const { metrics, transactions } = useSentinelState();

  const openTxns = transactions.filter((t) => t.status !== "Approved" && t.status !== "Blocked");
  const moneyAtRisk = openTxns.reduce((sum, t) => sum + t.amount, 0) || 84500;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-bold">
            <Activity className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Risk Analytics & Reporting</h1>
            <p className="text-xs text-slate-400">
              "Every action feeds back into the merchant's risk analytics."
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
          <span>REAL-TIME PIPELINE FEED ACTIVE</span>
        </div>
      </div>

      {/* STEP 11: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
          <span className="text-[10px] font-bold text-amber-300 uppercase">Money At Risk</span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{moneyAtRisk.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-amber-400/80">Includes TXN-10982 (₹25,000 Hold)</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
          <span className="text-[10px] font-bold text-emerald-300 uppercase">Payments Prevented</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">₹42,300</div>
          <span className="text-[10px] text-emerald-400/80">Pre-authorization mitigation</span>
        </div>

        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-1">
          <span className="text-[10px] font-bold text-red-300 uppercase">Critical Events</span>
          <div className="text-2xl font-black text-red-400 font-mono">17</div>
          <span className="text-[10px] text-red-400/80">90+ Risk score alerts</span>
        </div>
      </div>

      {/* STEP 11: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-8">
          <SentinelRiskTrendChart />
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#07131e]/95 p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Risk Distribution</h3>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>LOW</span>
                <span className="text-emerald-400 font-bold">68%</span>
              </div>
              <div className="h-2 rounded bg-slate-900 overflow-hidden">
                <div className="h-full bg-emerald-400 w-[68%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>MEDIUM</span>
                <span className="text-blue-400 font-bold">18%</span>
              </div>
              <div className="h-2 rounded bg-slate-900 overflow-hidden">
                <div className="h-full bg-blue-400 w-[18%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>HIGH</span>
                <span className="text-amber-400 font-bold">10%</span>
              </div>
              <div className="h-2 rounded bg-slate-900 overflow-hidden">
                <div className="h-full bg-amber-400 w-[10%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>CRITICAL</span>
                <span className="text-red-400 font-bold">4%</span>
              </div>
              <div className="h-2 rounded bg-slate-900 overflow-hidden">
                <div className="h-full bg-red-400 w-[4%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
