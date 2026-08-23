import React from "react";
import { Link } from "wouter";
import { PieChart, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";

export function WorkspacesPage() {
  const { theme } = useDashboard();
  const isDark = theme === "dark";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>NEXORA PLATFORM WORKSPACES</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100">
          Select Your Workspace
        </h1>
        <p className="mt-3 text-base text-slate-400 max-w-xl mx-auto">
          Seamlessly switch between managing your personal finances and monitoring merchant risk intelligence.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Personal Finance Workspace Card */}
        <Link href="/dashboard">
          <div className="group relative cursor-pointer overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900/90 via-blue-950/40 to-slate-950 p-8 shadow-2xl transition-all duration-300 hover:border-blue-400 hover:shadow-blue-500/20 hover:-translate-y-1">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
            
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
              <PieChart className="h-7 w-7 text-white" />
            </div>

            <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
              Personal Workspace
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Personal Finance Command
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Manage your money, track income & expenses, analyze goals, credit score, and investments in one place.
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
              <span>Open Personal Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Merchant Sentinel Workspace Card */}
        <Link href="/merchant">
          <div className="group relative cursor-pointer overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-emerald-950/40 to-slate-950 p-8 shadow-2xl transition-all duration-300 hover:border-emerald-400 hover:shadow-emerald-500/20 hover:-translate-y-1">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
            
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="h-7 w-7 text-slate-950" />
            </div>

            <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Merchant Protection
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              NEXORA SENTINEL
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Protect merchant money with real-time AI risk intelligence, fraud vectors, chargeback defense & automated investigation.
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Open Merchant Sentinel</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default WorkspacesPage;
