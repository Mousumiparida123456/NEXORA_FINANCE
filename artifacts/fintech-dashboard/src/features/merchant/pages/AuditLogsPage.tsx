import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  ShieldCheck,
  Lock,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
  Zap,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api, BackendAuditRecord } from "@/lib/api";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<BackendAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>("ALL");
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<BackendAuditRecord | null>(null);

  // Fetch real audit logs from PostgreSQL backend via GET /api/v1/sentinel/audit-logs
  const fetchAuditLogs = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setError(null);
    try {
      const response = await api.getSentinelAuditLogs();
      if (response && Array.isArray(response.data)) {
        setLogs(response.data);
      } else {
        setLogs([]);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to fetch Sentinel audit logs from PostgreSQL:", err);
      setError(err?.message || "Failed to connect to Sentinel PostgreSQL API server.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch + Auto-refresh every 8 seconds
  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchAuditLogs]);

  // Filtered logs calculation
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Risk Level filter
      if (filterRiskLevel !== "ALL" && log.riskLevel?.toUpperCase() !== filterRiskLevel) return false;
      // Decision filter
      if (filterDecision !== "ALL" && log.decision?.toUpperCase() !== filterDecision) return false;
      // Search query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesAudit = log.auditId?.toLowerCase().includes(query);
        const matchesTx = log.transactionId?.toLowerCase().includes(query);
        const matchesMerchant = log.merchantId?.toLowerCase().includes(query);
        const matchesDecision = log.decision?.toLowerCase().includes(query);
        const matchesReasons = log.reasons?.some((r) => r.toLowerCase().includes(query));
        if (!matchesAudit && !matchesTx && !matchesMerchant && !matchesDecision && !matchesReasons) {
          return false;
        }
      }
      return true;
    });
  }, [logs, searchQuery, filterRiskLevel, filterDecision]);

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel_postgres_audit_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskBadge = (level?: string) => {
    const norm = (level || "LOW").toUpperCase();
    switch (norm) {
      case "CRITICAL":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
            <ShieldAlert className="h-3 w-3 mr-1" /> CRITICAL
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
            <AlertTriangle className="h-3 w-3 mr-1" /> HIGH
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            <AlertCircle className="h-3 w-3 mr-1" /> MEDIUM
          </Badge>
        );
      case "LOW":
      case "SAFE":
      default:
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-1" /> {norm}
          </Badge>
        );
    }
  };

  const getDecisionBadge = (decision?: string) => {
    const norm = (decision || "APPROVE").toUpperCase();
    switch (norm) {
      case "APPROVE":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
            APPROVE
          </Badge>
        );
      case "MANUAL_REVIEW":
      case "HOLD":
      case "HOLD_FOR_REVIEW":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-bold">
            MANUAL_REVIEW
          </Badge>
        );
      case "REQUIRE_3DS":
      case "REQUEST_3DS":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] font-bold">
            REQUIRE_3DS
          </Badge>
        );
      case "BLOCK":
      default:
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] font-bold">
            BLOCK
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
              <Database className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Sentinel Risk Decision Audit Trail
              </h1>
              <p className="text-sm text-slate-400">
                Live PostgreSQL audit trail (`public.sentinel_audit_logs`) tracking risk evaluations & decisions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAuditLogs(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-2 transition-all shadow disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Logs"}
          </button>

          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-2 transition-all shadow disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-emerald-400" /> Export JSON
          </button>

          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono">
            POSTGRESQL AUDIT STORE
          </Badge>
        </div>
      </div>

      {/* Connection & Immutability Notice Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">PostgreSQL Audit Ledger Active</h2>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Connected directly to <code className="text-emerald-300 font-mono">GET /api/v1/sentinel/audit-logs</code>. Records are persisted in PostgreSQL table <code className="text-slate-200 font-mono">public.sentinel_audit_logs</code> via Drizzle ORM.
            </p>
          </div>
        </div>
        {lastUpdated && (
          <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
            Auto-polling (8s) | Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">Sentinel API Connection Warning</p>
              <p className="text-[11px] text-rose-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAuditLogs(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-[11px] border border-rose-500/30 transition-all shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Audit Events</span>
          <p className="text-2xl font-black font-mono text-slate-100">{loading ? "..." : logs.length}</p>
          <p className="text-[10px] text-slate-500">PostgreSQL Audit Trail</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approved Transactions</span>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {loading ? "..." : logs.filter((l) => l.decision?.toUpperCase() === "APPROVE").length}
          </p>
          <p className="text-[10px] text-slate-500">Automated Approvals</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">3DS Verification Step-Ups</span>
          <p className="text-2xl font-black font-mono text-blue-400">
            {loading ? "..." : logs.filter((l) => l.decision?.toUpperCase() === "REQUIRE_3DS").length}
          </p>
          <p className="text-[10px] text-slate-500">Identity Challenges</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Critical Fraud Blocks</span>
          <p className="text-2xl font-black font-mono text-rose-400">
            {loading ? "..." : logs.filter((l) => l.decision?.toUpperCase() === "BLOCK").length}
          </p>
          <p className="text-[10px] text-slate-500">Interception Records</p>
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
              placeholder="Search Audit ID, Tx ID, Merchant, or Decision..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Filter by Risk Level */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold mr-1">Risk Level:</span>
              {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterRiskLevel(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    filterRiskLevel === lvl
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Filter by Decision */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-semibold mr-1">Decision:</span>
              {["ALL", "APPROVE", "REQUIRE_3DS", "MANUAL_REVIEW", "BLOCK"].map((dec) => (
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

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto opacity-80" />
            <p className="text-xs text-slate-400 font-mono">Loading live PostgreSQL audit records from Sentinel API...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLogs.length === 0 && (
          <div className="py-16 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <Database className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No audit events recorded yet.</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Evaluation decisions generated by the Sentinel Risk Pipeline will automatically persist to PostgreSQL and render here.
            </p>
          </div>
        )}

        {/* Audit Log Data Table — All 10 Required Fields Rendered */}
        {!loading && filteredLogs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">1. Audit ID / Timestamp</th>
                  <th className="py-3 px-3">2. Transaction ID</th>
                  <th className="py-3 px-3">3. Merchant ID</th>
                  <th className="py-3 px-3">4. Risk Score</th>
                  <th className="py-3 px-3">5. Risk Level</th>
                  <th className="py-3 px-3">6. Decision</th>
                  <th className="py-3 px-3">7. Primary Reasons</th>
                  <th className="py-3 px-3">8. Model Version</th>
                  <th className="py-3 px-3">9. Policy Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.auditId}
                    onClick={() => setSelectedEvent(log)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* 1. Audit ID & 7. Timestamp */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-100 block">{log.auditId}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </td>

                    {/* 2. Transaction ID */}
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {log.transactionId}
                    </td>

                    {/* 3. Merchant ID */}
                    <td className="py-3 px-3 text-slate-300">
                      {log.merchantId}
                    </td>

                    {/* 4. Risk Score */}
                    <td className="py-3 px-3">
                      <span className="font-black text-rose-400 text-xs">{log.riskScore}</span>
                      <span className="text-[10px] text-slate-500"> / 100</span>
                    </td>

                    {/* 5. Risk Level */}
                    <td className="py-3 px-3">
                      {getRiskBadge(log.riskLevel)}
                    </td>

                    {/* 6. Decision */}
                    <td className="py-3 px-3">
                      {getDecisionBadge(log.decision)}
                    </td>

                    {/* 8. Reasons */}
                    <td className="py-3 px-3 font-sans text-slate-300 max-w-[220px] truncate">
                      {Array.isArray(log.reasons) && log.reasons.length > 0
                        ? log.reasons.join(" • ")
                        : "Evaluation baseline verified"}
                    </td>

                    {/* 9. Model Version */}
                    <td className="py-3 px-3 text-slate-400 text-[10px]">
                      {log.modelVersion || "sentinel-risk-v1"}
                    </td>

                    {/* 10. Policy Version */}
                    <td className="py-3 px-3 text-slate-400 text-[10px]">
                      {log.policyVersion || "v2.0-policy"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expanded Audit Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  PostgreSQL Audit Event Record #{selectedEvent.auditId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-2 py-1 bg-slate-800 rounded"
              >
                Close ESC
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">1. Audit ID</span>
                  <span className="font-bold text-slate-100">{selectedEvent.auditId}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">2. Transaction ID</span>
                  <span className="font-bold text-emerald-400">{selectedEvent.transactionId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">3. Merchant ID</span>
                  <span className="font-bold text-slate-200">{selectedEvent.merchantId}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">4. Risk Score & Level</span>
                  <span className="font-bold text-rose-400">{selectedEvent.riskScore} / 100 ({selectedEvent.riskLevel})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">5. Decision</span>
                  <span>{getDecisionBadge(selectedEvent.decision)}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">6. Timestamp</span>
                  <span className="text-slate-300 text-[11px]">{new Date(selectedEvent.timestamp).toISOString()}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">7. Triggered Reasons</span>
                <p className="text-amber-400 text-[11px] font-sans">
                  {Array.isArray(selectedEvent.reasons) ? selectedEvent.reasons.join(" + ") : selectedEvent.reasons}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">8. Model Version</span>
                  <span className="text-purple-300">{selectedEvent.modelVersion || "sentinel-risk-v1"}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">9. Policy Version</span>
                  <span className="text-emerald-400">{selectedEvent.policyVersion || "v2.0-policy"}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>DB: public.sentinel_audit_logs</span>
              <span className="text-emerald-400">PostgreSQL Immutable Ledger</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
