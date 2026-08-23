import React from "react";
import { Bot, Sparkles, AlertOctagon, CheckCircle2, ArrowRight, ShieldCheck, Cpu, Terminal } from "lucide-react";

export function SentinelAIAgentSummary() {
  const activeInvestigations = [
    {
      caseId: "INV-409",
      title: "Cross-Border Bot Velocity Ring",
      severity: "CRITICAL",
      affectedOrders: 12,
      totalRiskValue: "$29,400",
      description: "Automated agent flagged 12 rapid checkout attempts using stolen card BIN 411111 from Lagos IP pool.",
    },
    {
      caseId: "INV-402",
      title: "Electronics Wardrobing Ring",
      severity: "HIGH",
      affectedOrders: 5,
      totalRiskValue: "$12,850",
      description: "5 high-end laptops purchased and claimed empty box returns within 48 hours.",
    },
  ];

  const recommendations = [
    {
      id: "REC-1",
      title: "Enforce 3D-Secure 2.0 on High-Risk BIN Ranges",
      impact: "Prevents ~$45,000 potential chargebacks",
      effort: "Immediate (Rule #82)",
      badge: "High Impact",
      badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "REC-2",
      title: "Rate Limit Accounts Creating >3 Returns in 14 Days",
      impact: "Mitigates return fraud by estimated 34%",
      effort: "Automated Policy",
      badge: "Recommended",
      badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    {
      id: "REC-3",
      title: "Auto-Block Tor Proxy Exit Nodes for Orders >$500",
      impact: "Zero legitimate friction impact (<0.1%)",
      effort: "Active Rule",
      badge: "Security Baseline",
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    },
  ];

  const automatedAnalysisLogs = [
    { time: "21:08:14", log: "Agent scanned 1,420 orders in last 60m • 3 risk alerts created." },
    { time: "20:45:02", log: "Correlated 4 return claims with same serial number DB registry." },
    { time: "20:12:39", log: "Updated IP reputation table: Added 44 proxy nodes to watchlist." },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Agent Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md font-bold">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">AI Risk Agent Summary</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 font-mono">
                <Cpu className="h-3 w-3" /> Autonomous Sentinel AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Continuous threat monitoring, automated investigation triage, and proactive mitigation actions
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Investigations & Recommendations */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: Investigations Requiring Attention */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertOctagon className="h-4 w-4" /> Investigations Requiring Attention
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">2 Priority Cases</span>
          </h3>

          <div className="space-y-3">
            {activeInvestigations.map((inv) => (
              <div
                key={inv.caseId}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-400">{inv.caseId}</span>
                    <span className="text-xs font-bold text-white">{inv.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      inv.severity === "CRITICAL"
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {inv.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300/90 leading-relaxed">{inv.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono">{inv.affectedOrders} Orders • <span className="text-white font-bold">{inv.totalRiskValue}</span></span>
                  <button className="flex items-center gap-1 text-emerald-400 font-bold hover:underline">
                    Review Case <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: High-Priority Recommendations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Sparkles className="h-4 w-4" /> Agent Recommendations
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">Auto-Generated</span>
          </h3>

          <div className="space-y-2.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 flex items-start gap-3 hover:border-slate-700 transition-all"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-100">{rec.title}</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${rec.badgeBg}`}>
                      {rec.badge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{rec.impact}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{rec.effort}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Automated Analysis Feed */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-300 flex items-center gap-1.5 font-mono text-[11px]">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Recent Automated Analysis Stream
          </span>
          <span className="text-[10px] font-mono text-emerald-400">● Live Feed</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5 font-mono text-[11px]">
          {automatedAnalysisLogs.map((log, idx) => (
            <div key={idx} className="flex items-center gap-3 text-slate-300">
              <span className="text-slate-500">{log.time}</span>
              <span className="text-emerald-500 font-bold">[SENTINEL-AGENT]</span>
              <span className="text-slate-300">{log.log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
