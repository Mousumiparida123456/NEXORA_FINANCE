import React from "react";
import { SafePaySimulator } from "../components/SafePaySimulator";
import { ShieldCheck, Info } from "lucide-react";

export function SafePayPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Nexora SafePay · Payment Protection Sandbox</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time pre-authorization payment screening engine. Evaluates risk signals before funds leave the account.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE PRE-PAYMENT SCREENING ACTIVE</span>
        </div>
      </div>

      {/* Simulator Component */}
      <SafePaySimulator />

      {/* Info card */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-300 flex items-start gap-3">
        <Info className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Hackathon Demo Note:</span>
          <p className="leading-relaxed text-slate-400">
            Simulating a payment to <span className="font-mono text-emerald-300">demo-risk-recipient@upi</span> for ₹25,000 will trigger a 94/100 Critical Risk score, hold enforcement, score signal breakdown (+35 recipient risk, +25 suspicious activity), automatic creation of investigation <span className="font-mono text-red-300">INV-00291</span>, and sequential audit logging.
          </p>
        </div>
      </div>
    </div>
  );
}
