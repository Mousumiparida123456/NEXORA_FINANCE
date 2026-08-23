import React, { useState } from "react";
import {
  GitFork,
  Shield,
  Wallet,
  AlertTriangle,
  RotateCcw,
  UserX,
  Cpu,
  Bot,
  Lightbulb,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function SentinelArchitectureFlow() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-[#07131e]/90 p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <GitFork className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              NEXORA ARCHITECTURAL PIPELINE
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                ACTIVE DOMAIN MODEL
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              System architecture map: Personal Finance vs. Merchant Intelligence (Sentinel Risk Engine Pipeline)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" /> Collapse Architecture Map
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> Expand Architecture Map
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-6">
          {/* Top Domain Switcher Tree */}
          <div className="flex flex-col items-center">
            {/* Root Node */}
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-2 text-center shadow-lg">
              <span className="text-xs font-black tracking-widest text-emerald-300 font-mono">
                NEXORA PLATFORM CORE
              </span>
            </div>

            {/* Split Lines */}
            <div className="h-5 w-0.5 bg-slate-700" />
            <div className="h-0.5 w-64 bg-slate-700" />
            <div className="flex justify-between w-64 h-5">
              <div className="h-full w-0.5 bg-slate-700" />
              <div className="h-full w-0.5 bg-slate-700" />
            </div>

            {/* Core Domain Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              {/* Left Column: Personal Finance */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <Wallet className="h-4 w-4" /> Personal Finance
                </div>
                <div className="text-[11px] text-slate-400 font-medium">"Manage my money"</div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                  Module: <code className="text-blue-300">src/features/personal/</code>
                </div>
              </div>

              {/* Right Column: Merchant Intelligence */}
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Shield className="h-4 w-4" /> Merchant Intelligence
                </div>
                <div className="text-[11px] text-slate-300 font-medium">"Protect merchant money"</div>
                <div className="text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-900/50 font-mono">
                  Engine: <code className="text-emerald-300">NEXORA SENTINEL</code>
                </div>
              </div>
            </div>
          </div>

          {/* Sentinel Risk Pipeline */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-4">
            <div className="text-center font-bold text-xs text-slate-300 tracking-wider uppercase border-b border-slate-900 pb-2">
              NEXORA SENTINEL RISK PIPELINE ARCHITECTURE
            </div>

            {/* Pipeline Step 1: Risk Vectors */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                1. Risk Vectors
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Fraud Risk
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Returns Risk
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Chargeback Risk
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <UserX className="h-3.5 w-3.5" /> Abuse Risk
                </div>
              </div>
            </div>

            {/* Down Arrow */}
            <div className="text-center text-slate-600 text-xs font-mono font-bold">↓</div>

            {/* Pipeline Step 2: Risk Engine */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">2. Sentinel Risk Engine</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Aggregates vector signals, computes composite score (0-100)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                src/features/merchant/sentinel/engine/riskEngine.ts
              </span>
            </div>

            {/* Down Arrow */}
            <div className="text-center text-slate-600 text-xs font-mono font-bold">↓</div>

            {/* Pipeline Step 3: AI Investigation */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 font-bold">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">3. Autonomous AI Investigation</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    IP reputation checks, device fingerprinting, stolen BIN cross-reference
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                src/features/merchant/sentinel/ai/aiInvestigation.ts
              </span>
            </div>

            {/* Down Arrow */}
            <div className="text-center text-slate-600 text-xs font-mono font-bold">↓</div>

            {/* Pipeline Step 4: Recommendation Engine */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">4. Recommendation Engine</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Outputs mitigation strategies: Block & Refund | Require 3DS | Hold for Audit
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                src/features/merchant/sentinel/recommendations/recommendationEngine.ts
              </span>
            </div>

            {/* Down Arrow */}
            <div className="text-center text-slate-600 text-xs font-mono font-bold">↓</div>

            {/* Pipeline Step 5: Human Approval */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold">
                  <CheckSquare className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">5. Human Approval Workflow</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Merchant risk operator accepts AI recommendation or executes human override
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                src/features/merchant/sentinel/approval/humanApproval.ts
              </span>
            </div>

            {/* Down Arrow */}
            <div className="text-center text-slate-600 text-xs font-mono font-bold">↓</div>

            {/* Pipeline Step 6: Audit Trail */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-emerald-300">6. Unified Audit Trail</div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    Stores irreversible log of Personal Finance activities & Sentinel risk decisions
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                src/core/auditTrail.ts
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
