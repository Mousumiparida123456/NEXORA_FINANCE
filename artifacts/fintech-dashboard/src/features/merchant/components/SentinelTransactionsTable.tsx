import React, { useState } from "react";
import {
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Globe,
  CreditCard,
  Bot,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSentinelState, SentinelTransaction } from "../context/SentinelContext";

export const formatAmount = (amount?: number, currency?: string) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "—";
  const curr = (currency || "INR").toUpperCase();
  if (curr === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  if (curr === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
  return `${curr} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
};

export function SentinelTransactionsTable() {
  const { transactions, approveOrder, blockAndRefund } = useSentinelState();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskType, setSelectedRiskType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  // Confirmation & Processing State
  const [confirmModalType, setConfirmModalType] = useState<"APPROVE" | "BLOCK" | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingType, setProcessingType] = useState<"APPROVE" | "BLOCK" | null>(null);

  const activeModalTxn = transactions.find((t) => t.id === activeModalId) || null;

  // Filtered transactions
  const filtered = transactions.filter((t: SentinelTransaction) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedRiskType === "ALL" || t.riskType === selectedRiskType;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse";
    }
    if (score >= 75) {
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
    return "bg-blue-500/20 text-blue-300 border-blue-500/40";
  };

  const getStatusBadge = (status: SentinelTransaction["status"]) => {
    switch (status) {
      case "Action Required":
        return "bg-red-500/15 text-red-300 border-red-500/30";
      case "Under Review":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Escalated":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Blocked":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "Approved":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "Hold":
      default:
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    }
  };

  const getTypeBadge = (type: SentinelTransaction["riskType"]) => {
    switch (type) {
      case "Fraud":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Return":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Chargeback":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Abuse":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  const handleConfirmApprove = async () => {
    if (!activeModalTxn || isProcessing) return;
    setConfirmModalType(null);
    setIsProcessing(true);
    setProcessingType("APPROVE");
    try {
      await approveOrder(activeModalTxn.id);
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  const handleConfirmBlock = async () => {
    if (!activeModalTxn || isProcessing) return;
    setConfirmModalType(null);
    setIsProcessing(true);
    setProcessingType("BLOCK");
    try {
      await blockAndRefund(activeModalTxn.id);
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">High-Risk Transactions Queue</h2>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/30 font-mono">
              {filtered.length} Flagged
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time flagged orders requiring risk triage, investigation, or merchant enforcement action
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID, customer, email..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="h-9 w-52 rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Risk Type Filter */}
          <select
            value={selectedRiskType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRiskType(e.target.value)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Risk Types</option>
            <option value="Fraud">Fraud Risk</option>
            <option value="Return">Return Risk</option>
            <option value="Chargeback">Chargeback Risk</option>
            <option value="Abuse">Abuse Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Action Required">Action Required</option>
            <option value="Under Review">Under Review</option>
            <option value="Escalated">Escalated</option>
            <option value="Blocked">Blocked</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-y border-slate-800">
            <tr>
              <th className="py-3 px-3">Transaction ID</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Risk Score</th>
              <th className="py-3 px-3">Risk Type</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Detected At</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  No high-risk transactions matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t: SentinelTransaction) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                  onClick={() => setActiveModalId(t.id)}
                >
                  {/* Transaction ID */}
                  <td className="py-3.5 px-3 font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {t.id}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-3 font-extrabold text-slate-100 font-mono">
                    {formatAmount(t.amount, t.currency)}
                  </td>

                  {/* Risk Score */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${getScoreBadge(
                        t.riskScore
                      )}`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {t.riskScore}/100
                    </span>
                  </td>

                  {/* Risk Type */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getTypeBadge(
                        t.riskType
                      )}`}
                    >
                      {t.riskType}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-200">{t.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.customerEmail}</div>
                  </td>

                  {/* Detected At */}
                  <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                    {t.detectedAt}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                      {t.refundStatus === "REFUND_INITIATED" && (
                        <span className="inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border-amber-500/30">
                          REFUND INITIATED
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-3 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveModalId(t.id)}
                        className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                      >
                        <Eye className="h-3 w-3" /> Investigate
                      </button>

                      {t.status !== "Approved" && (
                        <button
                          onClick={() => {
                            setActiveModalId(t.id);
                            setConfirmModalType("APPROVE");
                          }}
                          title="Approve Transaction"
                          className="p-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {t.status !== "Blocked" && (
                        <button
                          onClick={() => {
                            setActiveModalId(t.id);
                            setConfirmModalType("BLOCK");
                          }}
                          title="Block Transaction"
                          className="p-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Main Investigation Details Modal */}
      <Dialog open={!!activeModalTxn} onOpenChange={(open: boolean) => !open && setActiveModalId(null)}>
        {activeModalTxn && (
          <DialogContent className="max-w-2xl border-slate-800 bg-[#07131e] text-slate-100 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
                    <ShieldAlert className="h-6 w-6" />
                  </span>
                  <div>
                    <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                      Investigation: {activeModalTxn.id}
                      <span className={`text-xs px-2 py-0.5 rounded border font-mono ${getScoreBadge(activeModalTxn.riskScore)}`}>
                        Score: {activeModalTxn.riskScore}/100
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400 mt-0.5">
                      Sentinel AI Risk Analysis & Signal Forensic Telemetry
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="space-y-4 py-4 text-xs">
              {/* Order Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Amount</span>
                  <span className="font-extrabold text-white text-sm font-mono">{formatAmount(activeModalTxn.amount, activeModalTxn.currency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Risk Vector</span>
                  <span className="font-bold text-amber-400">{activeModalTxn.riskType} Risk</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Customer</span>
                  <span className="font-semibold text-slate-200 truncate block">{activeModalTxn.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Status</span>
                  <div className="flex flex-col gap-1 items-start mt-0.5">
                    <span className={`font-bold uppercase ${getStatusBadge(activeModalTxn.status)} px-1.5 py-0.5 rounded text-[9px]`}>
                      {activeModalTxn.status}
                    </span>
                    {activeModalTxn.refundStatus === "REFUND_INITIATED" && (
                      <span className="font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px]">
                        REFUND INITIATED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Signals Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="h-4 w-4" /> Detected Risk Signals
                </h4>
                <div className="space-y-2">
                  {activeModalTxn.signals.map((sig: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                      <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span className="text-xs leading-relaxed font-medium">{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forensic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-bold text-slate-200">Geolocation & IP</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">{activeModalTxn.location}</p>
                  <p className="text-[10px] font-mono text-slate-400">IP: {activeModalTxn.ipAddress}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-bold text-slate-200">Device & Payment</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">Device: {activeModalTxn.deviceId}</p>
                  <p className="text-[10px] font-mono text-slate-400">BIN: {activeModalTxn.cardBin}</p>
                </div>
              </div>

              {/* AI Agent Recommendation Box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Bot className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-emerald-300 block">AI Agent Recommendation</span>
                  <p className="text-slate-300 leading-relaxed">
                    High risk score ({activeModalTxn.riskScore}/100) indicates cross-border IP mismatch and card BIN leak. Recommend blocking order and placing customer account on 24-hour verification hold.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer - Fully Responsive for Mobile, Tablet, Desktop */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4 mt-2 w-full">
              <button
                onClick={() => setActiveModalId(null)}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {/* Approve Order Button */}
                <button
                  onClick={() => setConfirmModalType("APPROVE")}
                  disabled={isProcessing || activeModalTxn.status === "Approved"}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isProcessing && processingType === "APPROVE"
                      ? "border-emerald-500/50 bg-emerald-500/30 text-emerald-200 opacity-80 cursor-wait"
                      : activeModalTxn.status === "Approved"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 opacity-60 cursor-not-allowed"
                      : "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing && processingType === "APPROVE" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                      Approving...
                    </>
                  ) : activeModalTxn.status === "Approved" ? (
                    "✓ Approved"
                  ) : (
                    "Approve Order"
                  )}
                </button>

                {/* Block & Refund Button */}
                <button
                  onClick={() => setConfirmModalType("BLOCK")}
                  disabled={isProcessing || activeModalTxn.status === "Blocked"}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isProcessing && processingType === "BLOCK"
                      ? "border-red-500/50 bg-red-500/30 text-red-200 opacity-80 cursor-wait"
                      : activeModalTxn.status === "Blocked"
                      ? "border-slate-700 bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed"
                      : "border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:border-red-500/60 shadow-lg shadow-red-500/10"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing && processingType === "BLOCK" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-red-300" />
                      Blocking & Refunding...
                    </>
                  ) : activeModalTxn.status === "Blocked" ? (
                    "✓ Blocked & Refunded"
                  ) : (
                    "Block & Refund"
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Confirmation Dialogs */}
      {activeModalTxn && (
        <Dialog open={!!confirmModalType} onOpenChange={(open: boolean) => !open && setConfirmModalType(null)}>
          <DialogContent className="max-w-md border-slate-800 bg-[#07131e] text-slate-100 p-6 shadow-2xl">
            {confirmModalType === "APPROVE" && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    APPROVE THIS ORDER?
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Transaction ID</span>
                      <span className="font-mono font-bold text-white text-sm">{activeModalTxn.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Risk Score</span>
                      <span className="font-mono font-bold text-rose-400 text-sm">{activeModalTxn.riskScore} / 100</span>
                    </div>
                  </div>
                  <p className="leading-relaxed bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-200">
                    You are overriding the automated risk recommendation.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setConfirmModalType(null)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Confirm Approval
                  </button>
                </div>
              </>
            )}

            {confirmModalType === "BLOCK" && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-400" />
                    BLOCK & REFUND ORDER?
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Transaction:</span>
                      <span className="font-mono font-bold text-white">{activeModalTxn.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-mono font-extrabold text-emerald-400">${activeModalTxn.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Risk Score:</span>
                      <span className="font-mono font-bold text-rose-400">{activeModalTxn.riskScore} / 100</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1.5 text-red-200">
                    <span className="font-bold block text-red-300">This will:</span>
                    <ul className="space-y-1 pl-1">
                      <li>• Block the order</li>
                      <li>• Initiate refund</li>
                      <li>• Resolve the investigation</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setConfirmModalType(null)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBlock}
                    className="px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/20 text-xs font-bold text-red-300 hover:bg-red-500/30"
                  >
                    Confirm Block & Refund
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

