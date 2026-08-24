import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  Globe,
  Smartphone,
  CheckCircle2,
  FileText,
  History,
  TrendingUp,
  Search,
  ChevronRight,
  Zap,
  Lock,
  ArrowRight,
  Info,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  sentinelInvestigationAiService,
  sentinelAuditLogger,
  InvestigationEvidencePayload,
  MerchantDecision,
  AuditLogEntry,
} from "../sentinel/services/investigationAiService";
import { deterministicRiskEngine } from "../sentinel/engine/transactionRiskEngine";
import { AbuseNetworkGraph } from "../sentinel/components/AbuseNetworkGraph";

// Comprehensive Investigation Cases Dataset
const DEMO_CASES: InvestigationEvidencePayload[] = [
  {
    caseId: "INV-00291",
    transaction: {
      id: "TXN-10982",
      amount: 25000.00,
      currency: "INR",
      timestamp: "13:42:18",
      date: "2026-08-24",
      paymentMethod: "UPI (demo-risk-recipient@upi)",
      cardNumber: "UPI VPA Direct",
      ipAddress: "185.220.101.4 (Synthetic Proxy)",
      country: "India (High-Risk Recipient Wallet)",
      deviceType: "Mobile / UPI Gateway App",
    },
    riskEvaluation: {
      riskScore: 94,
      riskLevel: "CRITICAL",
      factors: [
        { name: "Recipient Risk", contribution: 35, description: "Recipient account is 4 days old with synthetic pattern" },
        { name: "Previous Suspicious Activity", contribution: 25, description: "12 previous suspicious transactions detected across network" },
        { name: "Chargeback History", contribution: 15, description: "3 chargeback associations linked to recipient wallet" },
        { name: "Unusual Transaction Amount", contribution: 12, description: "₹25,000 amount is significantly above normal" },
        { name: "High Transaction Velocity", contribution: 7, description: "Multiple transactions detected in short period" },
      ],
      recommendedAction: "HOLD PAYMENT & BLOCK RECIPIENT",
    },
    customerHistory: {
      customerName: "Customer CUS-182 (Alex Rivera)",
      customerEmail: "cus182.alex@techglobal.io",
      accountAgeDays: 45,
      totalOrders: 42,
      totalSpent: 184500.00,
      priorDisputes: 3,
      priorReturns: 6,
    },
    relatedTransactions: [
      { id: "TXN-10981", date: "2026-08-24 13:40", amount: 2900.00, status: "Completed", riskScore: 18 },
      { id: "TXN-10978", date: "2026-08-24 13:10", amount: 1850.00, status: "Completed", riskScore: 12 },
      { id: "TXN-10950", date: "2026-08-23 18:22", amount: 3400.00, status: "Completed", riskScore: 15 },
      { id: "TXN-10901", date: "2026-08-22 11:05", amount: 2100.00, status: "Completed", riskScore: 10 },
    ],
    timeline: [
      { timestamp: "13:42:21", event: "Investigation INV-00291 created automatically", type: "info" },
      { timestamp: "13:42:20", event: "Payment placed on HOLD by SafePay Pre-Auth Engine", type: "danger" },
      { timestamp: "13:42:20", event: "Critical risk score calculated (94 / 100)", type: "danger" },
      { timestamp: "13:42:19", event: "Risk analysis started across 7 policy rules", type: "info" },
      { timestamp: "13:42:18", event: "Payment received ₹25,000 to demo-risk-recipient@upi", type: "warning" },
    ],
  },

  {
    caseId: "CASE-948201",
    transaction: {
      id: "TX-948201",
      amount: 4850.00,
      currency: "USD",
      timestamp: "10:14:22 AM",
      date: "2026-08-24",
      paymentMethod: "Visa ending in 4921",
      cardNumber: "**** **** **** 4921",
      ipAddress: "185.220.101.4 (TOR Exit Node)",
      country: "Romania (Card: USA)",
      deviceType: "Linux / Firefox (Incognito)",
    },
    riskEvaluation: (() => {
      const evalRes = deterministicRiskEngine.evaluateTransaction({
        transactionId: "TX-948201",
        amount: 4850.00,
        velocityPerHour: 7,
        failedAttempts: 3,
        customerHistoryCount: 0,
        isNewCustomer: true,
        isNewDevice: true,
        isUnusualAmount: true,
        isUnusualTime: true,
        returnHistoryCount: 1,
        chargebackHistoryCount: 2,
        transactionVelocity24h: 12,
      });
      return {
        riskScore: evalRes.riskScore,
        riskLevel: evalRes.level,
        factors: evalRes.factors,
        recommendedAction: evalRes.recommendedAction,
      };
    })(),
    customerHistory: {
      customerName: "Alex Rivera",
      customerEmail: "alex.rivera@techglobal.io",
      accountAgeDays: 2,
      totalOrders: 1,
      totalSpent: 4850.00,
      priorDisputes: 2,
      priorReturns: 1,
    },
    relatedTransactions: [
      { id: "TX-948011", date: "2026-08-24 09:40 AM", amount: 1200.00, status: "Failed", riskScore: 88 },
      { id: "TX-947990", date: "2026-08-24 09:22 AM", amount: 4850.00, status: "Failed", riskScore: 92 },
      { id: "TX-947910", date: "2026-08-23 11:10 PM", amount: 350.00, status: "Completed", riskScore: 74 },
    ],
    timeline: [
      { timestamp: "10:14:22 AM", event: "Payment attempt $4,850.00 initiated via TOR Exit Node", type: "danger" },
      { timestamp: "10:12:05 AM", event: "Failed authorization (Incorrect CVV code)", type: "warning" },
      { timestamp: "10:08:44 AM", event: "Failed authorization (Exceeded card limit)", type: "warning" },
      { timestamp: "09:55:00 AM", event: "New device fingerprint registered (Linux / Firefox)", type: "info" },
      { timestamp: "Aug 22, 2026", event: "Account registered with email alex.rivera@techglobal.io", type: "info" },
    ],
  },
  {
    caseId: "CASE-948195",
    transaction: {
      id: "TX-948195",
      amount: 12500.00,
      currency: "USD",
      timestamp: "09:48:10 AM",
      date: "2026-08-24",
      paymentMethod: "Mastercard ending in 8812",
      cardNumber: "**** **** **** 8812",
      ipAddress: "198.51.100.42",
      country: "United States",
      deviceType: "Macintosh / Chrome",
    },
    riskEvaluation: (() => {
      const evalRes = deterministicRiskEngine.evaluateTransaction({
        transactionId: "TX-948195",
        amount: 12500.00,
        velocityPerHour: 3,
        failedAttempts: 1,
        customerHistoryCount: 1,
        isNewCustomer: true,
        isNewDevice: true,
        isUnusualAmount: true,
        isUnusualTime: false,
        returnHistoryCount: 0,
        chargebackHistoryCount: 1,
        transactionVelocity24h: 4,
      });
      return {
        riskScore: evalRes.riskScore,
        riskLevel: evalRes.level,
        factors: evalRes.factors,
        recommendedAction: evalRes.recommendedAction,
      };
    })(),
    customerHistory: {
      customerName: "Marcus Vance",
      customerEmail: "m.vance@solardynamics.net",
      accountAgeDays: 5,
      totalOrders: 2,
      totalSpent: 14200.00,
      priorDisputes: 1,
      priorReturns: 0,
    },
    relatedTransactions: [
      { id: "TX-947110", date: "2026-08-20", amount: 1700.00, status: "Disputed", riskScore: 82 },
    ],
    timeline: [
      { timestamp: "09:48:10 AM", event: "High exposure purchase $12,500.00 initiated", type: "danger" },
      { timestamp: "09:45:00 AM", event: "Billing address changed to remote forwarding service", type: "warning" },
      { timestamp: "Aug 19, 2026", event: "Account registered", type: "info" },
    ],
  },
  {
    caseId: "CASE-948188",
    transaction: {
      id: "TX-948188",
      amount: 3200.00,
      currency: "USD",
      timestamp: "09:12:05 AM",
      date: "2026-08-24",
      paymentMethod: "Amex ending in 1004",
      cardNumber: "**** **** **** 1004",
      ipAddress: "84.115.22.18",
      country: "Germany",
      deviceType: "iPhone / Safari",
    },
    riskEvaluation: (() => {
      const evalRes = deterministicRiskEngine.evaluateTransaction({
        transactionId: "TX-948188",
        amount: 3200.00,
        velocityPerHour: 4,
        failedAttempts: 2,
        customerHistoryCount: 0,
        isNewCustomer: true,
        isNewDevice: true,
        isUnusualAmount: true,
        isUnusualTime: false,
        returnHistoryCount: 0,
        chargebackHistoryCount: 0,
        transactionVelocity24h: 5,
      });
      return {
        riskScore: evalRes.riskScore,
        riskLevel: evalRes.level,
        factors: evalRes.factors,
        recommendedAction: evalRes.recommendedAction,
      };
    })(),
    customerHistory: {
      customerName: "Elena Rostova",
      customerEmail: "elena.r@fintechgroup.de",
      accountAgeDays: 1,
      totalOrders: 1,
      totalSpent: 3200.00,
      priorDisputes: 0,
      priorReturns: 0,
    },
    relatedTransactions: [
      { id: "TX-948180", date: "2026-08-24 08:50 AM", amount: 3200.00, status: "Failed", riskScore: 76 },
    ],
    timeline: [
      { timestamp: "09:12:05 AM", event: "Promo discount code applied on first order", type: "info" },
      { timestamp: "09:05:00 AM", event: "Device matches 4 other promo account registrations", type: "danger" },
    ],
  },
];

export function InvestigationsPage() {
  const [activeView, setActiveView] = useState<"dossier" | "network">("dossier");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("CASE-948201");
  const [merchantNote, setMerchantNote] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => sentinelAuditLogger.getLogs());

  // Current active case payload
  const currentCase = useMemo(() => {
    return DEMO_CASES.find((c) => c.caseId === selectedCaseId) || DEMO_CASES[0];
  }, [selectedCaseId]);

  // AI Investigation Dossier generated grounded in evidence
  const aiDossier = useMemo(() => {
    return sentinelInvestigationAiService.generateInvestigationDossier(currentCase);
  }, [currentCase]);

  // Handle Explicit Human Decision Execution
  const handleExecuteDecision = (decision: MerchantDecision) => {
    let newStatus = "Pending Review";
    switch (decision) {
      case "APPROVE":
        newStatus = "Approved & Cleared";
        break;
      case "BLOCK":
        newStatus = "Blocked & Refunded";
        break;
      case "HOLD_FOR_REVIEW":
        newStatus = "Escalated for Level-2 Review";
        break;
      case "REQUEST_VERIFICATION":
        newStatus = "3DS Challenge Sent";
        break;
      case "MONITOR":
        newStatus = "Placed under Watchlist";
        break;
    }

    const logEntry = sentinelAuditLogger.recordDecision({
      caseId: currentCase.caseId,
      transactionId: currentCase.transaction.id,
      merchantId: "M-MERCHANT-ADMIN",
      decision,
      reasonNote: merchantNote.trim() !== "" ? merchantNote : `Merchant executed ${decision} decision.`,
      previousStatus: "Pending Review",
      newStatus,
      aiRecommendation: aiDossier.aiRecommendation,
      evidenceSnapshotCount: aiDossier.evidenceCitations.length,
    });

    setAuditLogs(sentinelAuditLogger.getLogs());
    setMerchantNote("");
    alert(`Decision Recorded Successfully!\n\nAction: ${decision}\nStatus Updated to: ${newStatus}\nLogged to immutable audit trail (ID: ${logEntry.id}).`);
  };

  const getRiskLevelBadge = (level: string, score: number) => {
    switch (level) {
      case "CRITICAL":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold">{score} · CRITICAL</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-semibold">{score} · HIGH</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold">{score} · MEDIUM</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold">{score} · LOW</Badge>;
    }
  };

  const getDecisionBadge = (decision: MerchantDecision) => {
    switch (decision) {
      case "BLOCK":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">BLOCK</Badge>;
      case "HOLD_FOR_REVIEW":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">HOLD FOR REVIEW</Badge>;
      case "REQUEST_VERIFICATION":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">REQUEST 3DS</Badge>;
      case "MONITOR":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">MONITOR</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">APPROVE</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Sentinel AI Risk Investigation Workspace</h1>
              <p className="text-sm text-slate-400">
                Evidence-grounded risk dossier, structured signals breakdown & human-gated decision controls
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Case Switcher Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main View Mode Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveView("dossier")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === "dossier"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Investigation Dossier
            </button>
            <button
              onClick={() => setActiveView("network")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === "network"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Abuse Network Graph
            </button>
          </div>

          {/* Case Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {DEMO_CASES.map((c) => (
              <button
                key={c.caseId}
                onClick={() => setSelectedCaseId(c.caseId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedCaseId === c.caseId
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {c.caseId}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditionally Render Active View */}
      {activeView === "network" ? (
        <AbuseNetworkGraph />
      ) : (
        <>
          {/* Safety Gating Banner */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-amber-300 text-xs leading-relaxed">
            <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Merchant Approval Safety Gate Active</p>
              <p>{aiDossier.safetyGatingNotice}</p>
            </div>
          </div>

      {/* Grid Section: 1. Overview + 2. Score + 3. Factors */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Section 1: Transaction Overview & Metadata */}
        <div className="md:col-span-7 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">1. Transaction Overview</h2>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold">{currentCase.transaction.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Transaction Amount</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">${currentCase.transaction.amount.toFixed(2)} {currentCase.transaction.currency}</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Payment Method</span>
              <span className="font-semibold text-slate-200">{currentCase.transaction.paymentMethod}</span>
              <span className="text-[10px] text-slate-500 block">{currentCase.transaction.cardNumber}</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">IP Address & Geo</span>
              <span className="font-semibold text-slate-200">{currentCase.transaction.ipAddress}</span>
              <span className="text-[10px] text-slate-400 block">{currentCase.transaction.country}</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Device Environment</span>
              <span className="font-semibold text-slate-200">{currentCase.transaction.deviceType}</span>
              <span className="text-[10px] text-slate-500 block">{currentCase.transaction.timestamp} ({currentCase.transaction.date})</span>
            </div>
          </div>
        </div>

        {/* Section 2: Deterministic Risk Score & Level */}
        <div className="md:col-span-5 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">2. Deterministic Risk Score</h2>
            </div>
            {getRiskLevelBadge(currentCase.riskEvaluation.riskLevel, currentCase.riskEvaluation.riskScore)}
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <div className="text-5xl font-extrabold font-mono text-rose-400 tracking-tight">
                {currentCase.riskEvaluation.riskScore} <span className="text-lg text-slate-500 font-normal">/ 100</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Classification: <span className="text-rose-300 font-bold uppercase">{currentCase.riskEvaluation.riskLevel} RISK</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            Engine Recommendation: <span className="font-bold text-amber-400">{currentCase.riskEvaluation.recommendedAction}</span>
          </div>
        </div>
      </div>

      {/* Section 3: Risk Factors Breakdown */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">3. Risk Factors & Contributions</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {currentCase.riskEvaluation.factors.map((factor) => (
            <div key={factor.name} className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-200">{factor.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{factor.description}</p>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 shrink-0 ml-3">
                +{factor.contribution} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 & 5: Customer History + Related Transactions */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Section 4: Customer History */}
        <div className="md:col-span-5 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">4. Customer History Profile</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Customer Name & Email</span>
              <span className="font-bold text-slate-100">{currentCase.customerHistory.customerName}</span>
              <span className="text-slate-400 block text-[11px]">{currentCase.customerHistory.customerEmail}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Account Longevity</span>
                <span className="font-bold text-slate-200">{currentCase.customerHistory.accountAgeDays} days old</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Total Lifetime Orders</span>
                <span className="font-bold text-slate-200">{currentCase.customerHistory.totalOrders} order(s)</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Prior Disputes</span>
                <span className="font-bold text-rose-400">{currentCase.customerHistory.priorDisputes} dispute(s)</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Prior Returns</span>
                <span className="font-bold text-amber-400">{currentCase.customerHistory.priorReturns} return(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Related Transactions */}
        <div className="md:col-span-7 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <History className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">5. Related Transactions Queue</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Tx ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Risk Score</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {currentCase.relatedTransactions.map((rt) => (
                  <tr key={rt.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-emerald-400">{rt.id}</td>
                    <td className="py-2 px-3 text-slate-400">{rt.date}</td>
                    <td className="py-2 px-3">${rt.amount.toFixed(2)}</td>
                    <td className="py-2 px-3 font-bold text-rose-400">{rt.riskScore} / 100</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {rt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 6: Chronological Activity Timeline */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">6. Chronological Activity Timeline</h2>
        </div>

        <div className="relative border-l border-slate-800 pl-4 space-y-3 text-xs ml-2">
          {currentCase.timeline.map((item, idx) => (
            <div key={idx} className="relative">
              <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${
                item.type === "danger" ? "bg-rose-500" : item.type === "warning" ? "bg-amber-500" : "bg-emerald-500"
              }`} />
              <p className="font-semibold text-slate-200">{item.event}</p>
              <p className="text-[10px] text-slate-500 font-mono">{item.timestamp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7 & 8: AI Investigation Summary + AI Recommendation */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Section 7: Evidence-Grounded AI Investigation Summary */}
        <div className="md:col-span-7 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">7. AI Investigation Summary</h2>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
              {aiDossier.confidenceScore}% AI Confidence
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            {aiDossier.investigationSummary}
          </p>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Structured Evidence Findings:</span>
            <div className="space-y-1.5">
              {aiDossier.keyFindings.map((finding, idx) => (
                <div key={idx} className="p-2.5 bg-slate-950/40 rounded-md border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] text-slate-500 font-semibold block mb-1">Citations & Evidence Payload:</span>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 font-mono">
              {aiDossier.evidenceCitations.map((cite, idx) => (
                <li key={idx}>{cite}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 8: Recommended Action Card */}
        <div className="md:col-span-5 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">8. Recommended Action</h2>
            </div>
            {getDecisionBadge(aiDossier.aiRecommendation)}
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">AI Safety System Recommendation</p>
            <p className="text-2xl font-black text-slate-100 tracking-tight font-mono uppercase">
              {aiDossier.aiRecommendation}
            </p>
            <p className="text-[11px] text-amber-400 italic">
              "Gated by Merchant Approval"
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">Action Rules Matrix:</p>
            <p>• <span className="text-rose-400 font-semibold">BLOCK</span>: Auto-refuses transaction & blocks card BIN.</p>
            <p>• <span className="text-amber-400 font-semibold">HOLD</span>: Escalates to senior fraud analyst queue.</p>
            <p>• <span className="text-blue-400 font-semibold">REQUEST_3DS</span>: Triggers biometric 3DS verification.</p>
          </div>
        </div>
      </div>

      {/* Section 9: Human Decision Controls (Gated Merchant Buttons) */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">9. Human Decision Controls (Gated Execution)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Explicit Authorization Required</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Merchant Audit Note / Reason (Optional):</label>
          <input
            type="text"
            placeholder="Provide reason for decision (e.g. Identity verified via phone check)..."
            value={merchantNote}
            onChange={(e) => setMerchantNote(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleExecuteDecision("APPROVE")}
            className="px-4 py-2.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Check className="h-4 w-4" /> Approve Transaction
          </button>

          <button
            onClick={() => handleExecuteDecision("HOLD_FOR_REVIEW")}
            className="px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <AlertTriangle className="h-4 w-4" /> Hold for Review
          </button>

          <button
            onClick={() => handleExecuteDecision("REQUEST_VERIFICATION")}
            className="px-4 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <ShieldCheck className="h-4 w-4" /> Request 3DS Verification
          </button>

          <button
            onClick={() => handleExecuteDecision("BLOCK")}
            className="px-4 py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
          >
            <Ban className="h-4 w-4" /> Block Transaction & Refund
          </button>

          <button
            onClick={() => handleExecuteDecision("MONITOR")}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Info className="h-4 w-4 text-purple-400" /> Place under Watchlist
          </button>
        </div>
      </div>

      {/* Section 10: Immutable Audit Trail Log */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">10. Immutable Decision Audit Trail</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">{auditLogs.length} Records Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Case / Tx ID</th>
                <th className="py-2.5 px-3">Merchant ID</th>
                <th className="py-2.5 px-3">Human Decision</th>
                <th className="py-2.5 px-3">Reason Note</th>
                <th className="py-2.5 px-3">Status Updated To</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-bold text-slate-200">{log.id}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">{log.caseId} / {log.transactionId}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.merchantId}</td>
                  <td className="py-2.5 px-3">{getDecisionBadge(log.decision)}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">{log.reasonNote}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-semibold">{log.newStatus}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>
  );
}
