import React from "react";
import { FileWarning, ShieldAlert, DollarSign, ArrowRight, RefreshCcw, AlertTriangle } from "lucide-react";

export function MerchantReturnsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-amber-700 text-white font-bold">
            <FileWarning className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Returns & Chargebacks Intelligence</h1>
            <p className="text-xs text-slate-400">
              Dispute exposure tracking, friendly fraud detection, and mitigation metrics (Razorpay Risk Manager alignment)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
          <span>Active Protection Shield</span>
        </div>
      </div>

      {/* STEP 9: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Returns</span>
          <div className="text-2xl font-black text-white font-mono">42</div>
          <span className="text-[10px] text-slate-400">Past 30 days</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Chargebacks</span>
          <div className="text-2xl font-black text-red-400 font-mono">13</div>
          <span className="text-[10px] text-red-400">Includes 3 linked to CUS-182</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Money Lost</span>
          <div className="text-2xl font-black text-amber-400 font-mono">₹62,400</div>
          <span className="text-[10px] text-amber-400">Finalized disputes</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Money At Risk</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">₹31,200</div>
          <span className="text-[10px] text-emerald-400">Under review / representment</span>
        </div>
      </div>

      {/* Related Disputes Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/95 p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Dispute & Chargeback Cases</h3>

        <div className="space-y-2 font-mono text-xs">
          <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-300">CB-9402</span>
                <span className="text-white font-semibold">Customer CUS-182 (Alex Rivera)</span>
              </div>
              <p className="text-[11px] text-slate-400">Reason: Unauthorized transaction claim (₹25,000 hold mitigation pending)</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-red-400">₹25,000</span>
              <span className="text-[10px] text-red-300 block font-bold uppercase">Representment Draft Ready</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">CB-9110</span>
                <span className="text-white font-semibold">Customer CUS-140 (Sophia Chen)</span>
              </div>
              <p className="text-[11px] text-slate-400">Reason: Empty box wardrobing return claim</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-slate-200">₹12,850</span>
              <span className="text-[10px] text-emerald-400 block font-bold uppercase">Evidence Submitted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
