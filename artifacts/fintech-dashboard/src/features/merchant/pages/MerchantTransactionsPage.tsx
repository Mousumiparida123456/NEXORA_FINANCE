import React, { useState } from "react";
import {
  ArrowLeftRight,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { useSentinelState } from "../context/SentinelContext";
import { SentinelTransaction } from "../context/SentinelContext";

export function MerchantTransactionsPage() {
  const { transactions, approveOrder, blockAndRefund, resetDemoData, refreshTransactions, isFetching } = useSentinelState();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedTxn, setSelectedTxn] = useState<SentinelTransaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    if (filterRisk !== "ALL" && t.riskLevel.toUpperCase() !== filterRisk) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchCust = t.customerName.toLowerCase().includes(q);
      const matchMethod = (t.paymentMethod || "Card").toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchMethod) return false;
    }
    return true;
  });

  const handleApprove = (txnId: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      approveOrder(txnId);
      setIsProcessing(false);
      setSelectedTxn(null);
    }, 600);
  };

  const handleBlockRefund = (txnId: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      blockAndRefund(txnId);
      setIsProcessing(false);
      setSelectedTxn(null);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-bold">
            <ArrowLeftRight className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Merchant Transactions Intelligence</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live PostgreSQL transaction stream with deterministic risk scoring, hold flags, and action triggers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshTransactions()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isFetching ? "animate-spin" : ""}`} /> REFRESH STREAM
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/95 p-4 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, customer, payment method..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Under Review">Under Review</option>
            <option value="Hold">Hold</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Desktop & Tablet Table (md+) */}
      <div className="hidden md:block rounded-2xl border border-slate-800 bg-[#07131e]/95 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs text-slate-200">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-emerald-400">{t.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-white">{t.customerName}</td>
                  <td className="py-3 px-4 font-bold text-white">₹{t.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-300">{t.paymentMethod || "Card"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold text-[10px] ${
                        t.riskLevel.toLowerCase() === "critical"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : t.riskLevel.toLowerCase() === "high"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : t.riskLevel.toLowerCase() === "medium"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {t.riskScore} / {t.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "Approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : t.status === "Blocked"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{t.timestamp || t.detectedAt}</td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => setSelectedTxn(t)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredTransactions.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-slate-800 bg-[#07131e]/95 p-4 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400 text-sm">{t.id}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] font-mono ${
                  t.riskLevel.toLowerCase() === "critical"
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : t.riskLevel.toLowerCase() === "high"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {t.riskScore}/100 • {t.riskLevel}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white text-sm">{t.customerName}</span>
              <span className="font-mono font-black text-white text-base">₹{t.amount.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
              <span>{t.paymentMethod || "Card"}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.status === "Approved"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : t.status === "Blocked"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {t.status}
              </span>
            </div>

            <button
              onClick={() => setSelectedTxn(t)}
              className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="h-4 w-4" /> View Investigation Details
            </button>
          </div>
        ))}
      </div>

      {/* Transaction Detail Modal (Mobile Responsive) */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-[#07131e] p-4 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <span className="text-xs font-bold text-emerald-400 font-mono">{selectedTxn.id}</span>
                <h3 className="text-base sm:text-lg font-black text-white">Transaction Risk Details</h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount</span>
                  <span className="text-xs sm:text-sm font-black text-white font-mono">₹{selectedTxn.amount.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Score</span>
                  <span className="text-xs sm:text-sm font-black text-red-400 font-mono">{selectedTxn.riskScore} / 100</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                  <span className="text-xs font-bold text-slate-200 truncate block">{selectedTxn.customerName}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-xs font-extrabold text-amber-400 font-mono">{selectedTxn.status}</span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <h4 className="font-bold text-slate-300 font-sans uppercase text-xs">Detected Risk Signals</h4>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-1.5 text-slate-300">
                  {(selectedTxn.riskFactors || selectedTxn.signals).map((rf, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-red-400 mt-0.5">●</span>
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-emerald-400 font-mono block">AI Recommendation:</span>
                <p className="leading-relaxed">
                  {selectedTxn.riskScore >= 70
                    ? "Hold transaction pending verification. Multiple independent threat signals detected."
                    : "Transaction exhibits normal purchasing pattern."}
                </p>
              </div>
            </div>

            {/* Modal Actions (Responsive Full Width on Mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                disabled={isProcessing || selectedTxn.status === "Approved"}
                onClick={() => handleApprove(selectedTxn.id)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs font-black uppercase text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 min-h-[44px]"
              >
                {isProcessing ? "Processing..." : "Approve Order"}
              </button>
              <button
                disabled={isProcessing || selectedTxn.status === "Blocked"}
                onClick={() => handleBlockRefund(selectedTxn.id)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-500/20 text-xs font-black uppercase text-red-300 hover:bg-red-500/30 disabled:opacity-50 min-h-[44px]"
              >
                {isProcessing ? "Processing..." : "Block & Refund"}
              </button>
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
