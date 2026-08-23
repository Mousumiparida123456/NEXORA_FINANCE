import React, { useState } from "react";
import {
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  User,
  Clock,
  DollarSign,
  Globe,
  Smartphone,
  CreditCard,
  X,
  Bot,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface HighRiskTransaction {
  id: string;
  amount: number;
  riskScore: number;
  riskType: "Fraud" | "Return" | "Chargeback" | "Abuse";
  customerName: string;
  customerEmail: string;
  detectedAt: string;
  status: "Action Required" | "Under Review" | "Escalated" | "Blocked" | "Approved";
  location: string;
  ipAddress: string;
  deviceId: string;
  cardBin: string;
  signals: string[];
}

const INITIAL_TRANSACTIONS: HighRiskTransaction[] = [
  {
    id: "TXN-904812",
    amount: 2450.0,
    riskScore: 94,
    riskType: "Fraud",
    customerName: "Alexander Wright",
    customerEmail: "alex.w@example.com",
    detectedAt: "10 mins ago",
    status: "Action Required",
    location: "Lagos, NG (IP) vs NY, US (Billing)",
    ipAddress: "194.28.112.44",
    deviceId: "DEV-MAC-8819",
    cardBin: "411111 (Visa Infinite)",
    signals: [
      "IP location mismatch (Distance > 5,000 miles)",
      "Velocity spike: 6 transactions in 3 minutes",
      "Card BIN associated with stolen batch leak #409",
    ],
  },
  {
    id: "TXN-883910",
    amount: 1890.5,
    riskScore: 88,
    riskType: "Return",
    customerName: "Sophia Chen",
    customerEmail: "sophia.c@example.com",
    detectedAt: "28 mins ago",
    status: "Under Review",
    location: "San Francisco, CA, US",
    ipAddress: "73.162.90.12",
    deviceId: "DEV-[#IOS-9021]",
    cardBin: "542418 (Mastercard Platinum)",
    signals: [
      "Customer returned 5 high-value electronics items in 7 days",
      "Serial wardrobing indicator triggered",
      "Cross-store receipt reuse pattern detected",
    ],
  },
  {
    id: "TXN-774019",
    amount: 3200.0,
    riskScore: 91,
    riskType: "Chargeback",
    customerName: "Marcus Vance",
    customerEmail: "m.vance@example.com",
    detectedAt: "1 hour ago",
    status: "Escalated",
    location: "London, UK",
    ipAddress: "82.165.19.201",
    deviceId: "DEV-WIN-3301",
    cardBin: "378282 (Amex Gold)",
    signals: [
      "Cardholder initiated 3 friendly fraud claims past 60 days",
      "Digital goods instant claim threat score: 91/100",
      "Shipping address changed 4 minutes post-purchase",
    ],
  },
  {
    id: "TXN-661048",
    amount: 780.0,
    riskScore: 78,
    riskType: "Abuse",
    customerName: "Jordan Miller",
    customerEmail: "j.miller99@example.com",
    detectedAt: "2 hours ago",
    status: "Action Required",
    location: "Chicago, IL, US",
    ipAddress: "107.180.44.11",
    deviceId: "DEV-ANDROID-110",
    cardBin: "401200 (Visa Debit)",
    signals: [
      "12 accounts created from same IP in 1 hour using promo 'WELCOME50'",
      "Synthetic identity match score: High",
      "Referral payout farming suspected",
    ],
  },
  {
    id: "TXN-559021",
    amount: 4150.0,
    riskScore: 96,
    riskType: "Fraud",
    customerName: "Elena Rostova",
    customerEmail: "elena.r@example.com",
    detectedAt: "3 hours ago",
    status: "Blocked",
    location: "Bucharest, RO",
    ipAddress: "185.220.101.5",
    deviceId: "DEV-LINUX-901",
    cardBin: "438857 (Visa Signature)",
    signals: [
      "Known Tor exit node proxy detected",
      "Auto-blocked by Sentinel velocity rule #14",
      "Mismatched device fingerprint & browser timezone",
    ],
  },
  {
    id: "TXN-442109",
    amount: 1250.0,
    riskScore: 65,
    riskType: "Return",
    customerName: "David K.",
    customerEmail: "david.k@example.com",
    detectedAt: "4 hours ago",
    status: "Approved",
    location: "Austin, TX, US",
    ipAddress: "98.209.14.88",
    deviceId: "DEV-MAC-1120",
    cardBin: "510510 (Mastercard)",
    signals: [
      "Slight return velocity flag, merchant override approved",
      "Verified customer history: 4 years, $18,000 lifetime value",
    ],
  },
];

export function SentinelTransactionsTable() {
  const [transactions, setTransactions] = useState<HighRiskTransaction[]>(INITIAL_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskType, setSelectedRiskType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [activeModalTxn, setActiveModalTxn] = useState<HighRiskTransaction | null>(null);

  // Filtered transactions
  const filtered = transactions.filter((t: HighRiskTransaction) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedRiskType === "ALL" || t.riskType === selectedRiskType;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: HighRiskTransaction["status"]) => {
    setTransactions((prev: HighRiskTransaction[]) =>
      prev.map((t: HighRiskTransaction) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    if (activeModalTxn && activeModalTxn.id === id) {
      setActiveModalTxn((prev: HighRiskTransaction | null) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse";
    }
    if (score >= 75) {
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
    return "bg-blue-500/20 text-blue-300 border-blue-500/40";
  };

  const getStatusBadge = (status: HighRiskTransaction["status"]) => {
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
    }
  };

  const getTypeBadge = (type: HighRiskTransaction["riskType"]) => {
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
              filtered.map((t: HighRiskTransaction) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                  onClick={() => setActiveModalTxn(t)}
                >
                  {/* Transaction ID */}
                  <td className="py-3.5 px-3 font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {t.id}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-3 font-extrabold text-slate-100 font-mono">
                    ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                        t.status
                      )}`}
                    >
                      {t.status}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-3 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveModalTxn(t)}
                        className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                      >
                        <Eye className="h-3 w-3" /> Investigate
                      </button>

                      {t.status !== "Approved" && (
                        <button
                          onClick={() => handleStatusChange(t.id, "Approved")}
                          title="Approve Transaction"
                          className="p-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {t.status !== "Blocked" && (
                        <button
                          onClick={() => handleStatusChange(t.id, "Blocked")}
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

      {/* Investigation Details Modal */}
      <Dialog open={!!activeModalTxn} onOpenChange={(open: boolean) => !open && setActiveModalTxn(null)}>
        {activeModalTxn && (
          <DialogContent className="max-w-2xl border-slate-800 bg-[#07131e] text-slate-100 p-6 shadow-2xl">
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
                  <span className="font-extrabold text-white text-sm font-mono">${activeModalTxn.amount.toFixed(2)}</span>
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
                  <span className={`font-bold uppercase ${getStatusBadge(activeModalTxn.status)} px-1.5 py-0.5 rounded text-[9px]`}>
                    {activeModalTxn.status}
                  </span>
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

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
              <button
                onClick={() => setActiveModalTxn(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(activeModalTxn.id, "Approved")}
                  className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
                >
                  Approve Order
                </button>
                <button
                  onClick={() => handleStatusChange(activeModalTxn.id, "Blocked")}
                  className="px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/20 text-xs font-bold text-red-300 hover:bg-red-500/30"
                >
                  Block & Refund
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
