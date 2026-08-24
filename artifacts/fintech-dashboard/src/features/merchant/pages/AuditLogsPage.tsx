import React, { useState, useMemo } from "react";
import {
  FileText,
  ShieldCheck,
  Lock,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Info,
  User,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  auditLoggerService,
  SentinelAuditEvent,
  AuditActionSource,
  SentinelHumanDecision,
} from "../sentinel/services/auditLoggerService";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<SentinelAuditEvent[]>(() => auditLoggerService.getAuditEvents());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<SentinelAuditEvent | null>(null);

  // Filtered logs calculation
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Source filter
      if (filterSource !== "ALL" && log.actionSource !== filterSource) return false;
      // Decision filter
      if (filterDecision !== "ALL" && log.humanDecision !== filterDecision) return false;
      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTx = log.transactionId.toLowerCase().includes(query);
        const matchesCase = log.investigationId.toLowerCase().includes(query);
        const matchesUser = log.approvedBy.toLowerCase().includes(query);
        const matchesReason = log.reason.toLowerCase().includes(query);
        const matchesFactors = log.riskFactors.some((f) => f.toLowerCase().includes(query));
        if (!matchesTx && !matchesCase && !matchesUser && !matchesReason && !matchesFactors) {
          return false;
        }
      }
      return true;
    });
  }, [logs, searchQuery, filterSource, filterDecision]);

  const handleExportJson = () => {
    const jsonStr = auditLoggerService.exportLogsJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexora_sentinel_audit_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceBadge = (source: AuditActionSource) => {
    switch (source) {
      case "HUMAN":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            <User className="h-3 w-3 mr-1" /> HUMAN
          </Badge>
        );
      case "AI":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
            <Sparkles className="h-3 w-3 mr-1" /> AI ADVISORY
          </Badge>
        );
      case "SYSTEM":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
            <Zap className="h-3 w-3 mr-1" /> SYSTEM
          </Badge>
        );
    }
  };

  const getDecisionBadge = (decision: SentinelHumanDecision) => {
    switch (decision) {
      case "APPROVE":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            APPROVE
          </Badge>
        );
      case "HOLD":
      case "HOLD_FOR_REVIEW":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            HOLD
          </Badge>
        );
      case "REQUEST_3DS":
      case "REQUEST_VERIFICATION":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
            REQUEST 3DS
          </Badge>
        );
      case "BLOCK":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
            BLOCK
          </Badge>
        );
      case "MONITOR":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
            WATCHLIST
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Sentinel Risk Decision Audit Trail
              </h1>
              <p className="text-sm text-slate-400">
                Immutable, append-only ledger tracking all risk evaluations, AI recommendations & merchant actions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-2 transition-all shadow"
          >
            <Download className="h-4 w-4 text-emerald-400" /> Export JSON Ledger
          </button>

          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono">
            IMMUTABLE LEDGER
          </Badge>
        </div>
      </div>

      {/* Safety & Immutability Notice Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Human-in-the-Loop Approval Gating Active</h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Every financial decision requires explicit merchant admin authorization. AI outputs are advisory only and cannot directly mutate balances. Audit records are cryptographically structured and read-only from the UI.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Logged Events</span>
          <p className="text-2xl font-black font-mono text-slate-100">{logs.length}</p>
          <p className="text-[10px] text-slate-500">Immutable Audit Trail</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Human-Authorized Actions</span>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {logs.filter((l) => l.actionSource === "HUMAN").length}
          </p>
          <p className="text-[10px] text-slate-500">Gated Merchant Decisions</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Advisory Recommendations</span>
          <p className="text-2xl font-black font-mono text-purple-400">
            {logs.filter((l) => l.aiRecommendation).length}
          </p>
          <p className="text-[10px] text-slate-500">Evidence Dossiers Derived</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Critical Fraud Blocks</span>
          <p className="text-2xl font-black font-mono text-rose-400">
            {logs.filter((l) => l.humanDecision === "BLOCK").length}
          </p>
          <p className="text-[10px] text-slate-500">Prevented Fraud Losses</p>
        </div>
      </div>

      {/* Main Audit Log Table Workspace */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Tx ID, Case ID, User, or Reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Filter by Action Source */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold mr-1">Source:</span>
              {["ALL", "HUMAN", "SYSTEM"].map((src) => (
                <button
                  key={src}
                  onClick={() => setFilterSource(src)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    filterSource === src
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>

            {/* Filter by Decision */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold mr-1">Decision:</span>
              {["ALL", "HOLD", "BLOCK", "APPROVE"].map((dec) => (
                <button
                  key={dec}
                  onClick={() => setFilterDecision(dec)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    filterDecision === dec
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {dec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Timestamp / Log ID</th>
                <th className="py-3 px-3">Transaction / Case</th>
                <th className="py-3 px-3">Risk Score & Signals</th>
                <th className="py-3 px-3">AI Rec → Human Decision</th>
                <th className="py-3 px-3">Approved By</th>
                <th className="py-3 px-3">Status Transition</th>
                <th className="py-3 px-3">Action Source</th>
                <th className="py-3 px-3">Reason Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedEvent(log)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-200 block">{log.formattedTime}</span>
                    <span className="text-[10px] text-slate-500">{log.id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-400 block">{log.transactionId}</span>
                    <span className="text-[10px] text-slate-400">{log.investigationId}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-rose-400">{log.riskScore} / 100</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans line-clamp-1">
                      {log.riskFactors.join(" + ")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">{log.aiRecommendation}</span>
                      <span className="text-slate-600">→</span>
                      {getDecisionBadge(log.humanDecision)}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-300">{log.approvedBy}</td>
                  <td className="py-3 px-3 font-sans">
                    <span className="text-[10px] text-slate-500 block">{log.previousStatus}</span>
                    <span className="text-emerald-400 font-semibold">{log.newStatus}</span>
                  </td>
                  <td className="py-3 px-3">{getSourceBadge(log.actionSource)}</td>
                  <td className="py-3 px-3 font-sans text-slate-300 max-w-[200px] truncate">
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Audit Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Audit Event Record #{selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 bg-slate-800 rounded"
              >
                Close ESC
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Transaction ID</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedEvent.transactionId}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Investigation Case ID</span>
                  <span className="font-mono font-bold text-slate-200">{selectedEvent.investigationId}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Triggered Risk Factors</span>
                <p className="font-mono text-amber-400 text-[11px]">{selectedEvent.riskFactors.join(" + ")}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">AI Recommendation</span>
                  <span className="font-bold text-purple-300">{selectedEvent.aiRecommendation}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Human Authorized Decision</span>
                  <span className="font-bold text-emerald-400">{selectedEvent.humanDecision}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Merchant Approver</span>
                <span className="font-semibold text-slate-200">{selectedEvent.approvedBy}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Audit Reason Note</span>
                <p className="text-slate-300 text-[11px]">{selectedEvent.reason}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Timestamp: {selectedEvent.timestamp}</span>
              <span className="text-emerald-400">Append-Only Immutable Event</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
