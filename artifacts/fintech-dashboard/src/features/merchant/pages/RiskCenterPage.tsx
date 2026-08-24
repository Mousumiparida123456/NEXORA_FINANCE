import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  X,
  CheckCircle2,
  Ban,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  Globe,
  Smartphone,
  ChevronRight,
  Download,
  SlidersHorizontal,
  FileCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  deterministicRiskEngine,
  TransactionFeatureInput,
  RiskFactorContribution,
} from "../sentinel/engine/transactionRiskEngine";

export interface RiskTransaction {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  amount: number;
  currency: string;
  riskScore: number; // 0-100 derived from engine
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskType: "Fraud" | "Return" | "Chargeback" | "Abuse";
  riskFactors: RiskFactorContribution[];
  status: "Pending Review" | "Flagged" | "Auto-Blocked" | "Resolved" | "Whitelisted";
  recommendedAction: string;
  date: string;
  timestamp: string;
  paymentMethod: string;
  cardNumber: string;
  ipAddress: string;
  country: string;
  deviceType: string;
  aiExplanation: string;
  rawFeatures: TransactionFeatureInput;
}

const RAW_DEMO_TRANSACTIONS: (Omit<RiskTransaction, "riskScore" | "riskLevel" | "riskFactors" | "recommendedAction" | "aiExplanation"> & { rawFeatures: TransactionFeatureInput })[] = [
  {
    id: "TX-948201",
    customerName: "Alex Rivera",
    customerEmail: "alex.rivera@techglobal.io",
    customerAvatar: "AR",
    amount: 4850.00,
    currency: "USD",
    riskType: "Fraud",
    status: "Auto-Blocked",
    date: "2026-08-24",
    timestamp: "10:14:22 AM",
    paymentMethod: "Visa ending in 4921",
    cardNumber: "**** **** **** 4921",
    ipAddress: "185.220.101.4 (TOR Exit Node)",
    country: "Romania (Card: USA)",
    deviceType: "Linux / Firefox (Incognito)",
    rawFeatures: {
      transactionId: "TX-948201",
      amount: 4850.00,
      velocityPerHour: 7, // 40 pts
      failedAttempts: 3, // 30 pts
      customerHistoryCount: 0,
      isNewCustomer: true, // 8 pts
      isNewDevice: true, // 10 pts
      isUnusualAmount: true, // 20 pts
      isUnusualTime: true, // 10 pts
      returnHistoryCount: 1,
      chargebackHistoryCount: 2, // 60 pts
      transactionVelocity24h: 12,
    },
  },
  {
    id: "TX-948195",
    customerName: "Marcus Vance",
    customerEmail: "m.vance@solardynamics.net",
    customerAvatar: "MV",
    amount: 12500.00,
    currency: "USD",
    riskType: "Chargeback",
    status: "Flagged",
    date: "2026-08-24",
    timestamp: "09:48:10 AM",
    paymentMethod: "Mastercard ending in 8812",
    cardNumber: "**** **** **** 8812",
    ipAddress: "198.51.100.42",
    country: "United States",
    deviceType: "Macintosh / Chrome",
    rawFeatures: {
      transactionId: "TX-948195",
      amount: 12500.00, // 15 pts high dollar
      velocityPerHour: 3, // 8 pts
      failedAttempts: 1, // 12 pts
      customerHistoryCount: 1,
      isNewCustomer: true, // 8 pts
      isNewDevice: true, // 10 pts
      isUnusualAmount: true, // 20 pts
      isUnusualTime: false,
      returnHistoryCount: 0,
      chargebackHistoryCount: 1, // 30 pts
      transactionVelocity24h: 4,
    },
  },
  {
    id: "TX-948188",
    customerName: "Elena Rostova",
    customerEmail: "elena.r@fintechgroup.de",
    customerAvatar: "ER",
    amount: 3200.00,
    currency: "USD",
    riskType: "Abuse",
    status: "Pending Review",
    date: "2026-08-24",
    timestamp: "09:12:05 AM",
    paymentMethod: "Amex ending in 1004",
    cardNumber: "**** **** **** 1004",
    ipAddress: "84.115.22.18",
    country: "Germany",
    deviceType: "iPhone / Safari",
    rawFeatures: {
      transactionId: "TX-948188",
      amount: 3200.00,
      velocityPerHour: 4, // 16 pts
      failedAttempts: 2, // 24 pts
      customerHistoryCount: 0,
      isNewCustomer: true, // 8 pts
      isNewDevice: true, // 10 pts
      isUnusualAmount: true, // 20 pts
      isUnusualTime: false,
      returnHistoryCount: 0,
      chargebackHistoryCount: 0,
      transactionVelocity24h: 5,
    },
  },
  {
    id: "TX-948172",
    customerName: "David Chen",
    customerEmail: "dchen@apexlogistics.com",
    customerAvatar: "DC",
    amount: 1450.00,
    currency: "USD",
    riskType: "Return",
    status: "Pending Review",
    date: "2026-08-23",
    timestamp: "11:55:40 PM",
    paymentMethod: "Visa ending in 7120",
    cardNumber: "**** **** **** 7120",
    ipAddress: "172.56.21.90",
    country: "United States",
    deviceType: "Windows / Chrome",
    rawFeatures: {
      transactionId: "TX-948172",
      amount: 1450.00,
      velocityPerHour: 1,
      failedAttempts: 1, // 12 pts
      customerHistoryCount: 15,
      isNewCustomer: false,
      isNewDevice: false,
      isUnusualAmount: true, // 20 pts
      isUnusualTime: true, // 10 pts
      returnHistoryCount: 4, // 24 pts
      chargebackHistoryCount: 0,
      transactionVelocity24h: 2,
    },
  },
  {
    id: "TX-948160",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@biohealth.co.uk",
    customerAvatar: "SJ",
    amount: 890.00,
    currency: "USD",
    riskType: "Fraud",
    status: "Pending Review",
    date: "2026-08-23",
    timestamp: "10:30:15 PM",
    paymentMethod: "Visa ending in 3391",
    cardNumber: "**** **** **** 3391",
    ipAddress: "31.205.88.12",
    country: "United Kingdom",
    deviceType: "iPad / Mobile Safari",
    rawFeatures: {
      transactionId: "TX-948160",
      amount: 890.00,
      velocityPerHour: 2,
      failedAttempts: 1, // 12 pts
      customerHistoryCount: 0,
      isNewCustomer: true, // 8 pts
      isNewDevice: true, // 10 pts
      isUnusualAmount: true, // 20 pts
      isUnusualTime: false,
      returnHistoryCount: 0,
      chargebackHistoryCount: 0,
      transactionVelocity24h: 2,
    },
  },
  {
    id: "TX-948151",
    customerName: "Liam O'Connor",
    customerEmail: "liam@dublindesign.ie",
    customerAvatar: "LO",
    amount: 620.00,
    currency: "USD",
    riskType: "Return",
    status: "Resolved",
    date: "2026-08-23",
    timestamp: "08:14:02 PM",
    paymentMethod: "Mastercard ending in 5012",
    cardNumber: "**** **** **** 5012",
    ipAddress: "89.101.44.12",
    country: "Ireland",
    deviceType: "Macintosh / Safari",
    rawFeatures: {
      transactionId: "TX-948151",
      amount: 620.00,
      velocityPerHour: 1,
      failedAttempts: 0,
      customerHistoryCount: 12,
      isNewCustomer: false,
      isNewDevice: false,
      isUnusualAmount: false,
      isUnusualTime: false,
      returnHistoryCount: 3, // 24 pts
      chargebackHistoryCount: 0,
      transactionVelocity24h: 1,
    },
  },
  {
    id: "TX-948144",
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@cloudtech.in",
    customerAvatar: "PS",
    amount: 340.00,
    currency: "USD",
    riskType: "Fraud",
    status: "Whitelisted",
    date: "2026-08-23",
    timestamp: "06:45:30 PM",
    paymentMethod: "Visa ending in 9081",
    cardNumber: "**** **** **** 9081",
    ipAddress: "103.211.52.19",
    country: "India",
    deviceType: "Android / Chrome",
    rawFeatures: {
      transactionId: "TX-948144",
      amount: 340.00,
      velocityPerHour: 1,
      failedAttempts: 0,
      customerHistoryCount: 18,
      isNewCustomer: false,
      isNewDevice: false,
      isUnusualAmount: false,
      isUnusualTime: false,
      returnHistoryCount: 0,
      chargebackHistoryCount: 0,
      transactionVelocity24h: 1,
    },
  },
  {
    id: "TX-948130",
    customerName: "Thomas Wright",
    customerEmail: "twright@globalventures.com",
    customerAvatar: "TW",
    amount: 1980.00,
    currency: "USD",
    riskType: "Fraud",
    status: "Resolved",
    date: "2026-08-23",
    timestamp: "04:20:11 PM",
    paymentMethod: "Amex ending in 4001",
    cardNumber: "**** **** **** 4001",
    ipAddress: "192.241.180.5",
    country: "United States",
    deviceType: "Macintosh / Chrome",
    rawFeatures: {
      transactionId: "TX-948130",
      amount: 1980.00,
      velocityPerHour: 1,
      failedAttempts: 0,
      customerHistoryCount: 45,
      isNewCustomer: false,
      isNewDevice: false,
      isUnusualAmount: false,
      isUnusualTime: false,
      returnHistoryCount: 0,
      chargebackHistoryCount: 0,
      transactionVelocity24h: 1,
    },
  },
];

export function RiskCenterPage() {
  const [selectedRiskType, setSelectedRiskType] = useState<string>("All");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<RiskTransaction | null>(null);

  // Dynamically evaluate demo transactions through DeterministicRiskEngine
  const evaluatedTransactions: RiskTransaction[] = useMemo(() => {
    return RAW_DEMO_TRANSACTIONS.map((raw) => {
      const evalResult = deterministicRiskEngine.evaluateTransaction(raw.rawFeatures);
      
      // Map engine level string format
      let mappedLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
      if (evalResult.level === "CRITICAL") mappedLevel = "Critical";
      else if (evalResult.level === "HIGH") mappedLevel = "High";
      else if (evalResult.level === "MEDIUM") mappedLevel = "Medium";

      let readableAction = "Auto-Approve";
      if (evalResult.recommendedAction === "BLOCK_AND_REFUND") readableAction = "Block Card & Refund";
      else if (evalResult.recommendedAction === "MANUAL_REVIEW") readableAction = "Manual Review";
      else if (evalResult.recommendedAction === "REQUIRE_3DS") readableAction = "Request 3DS Verification";

      return {
        ...raw,
        riskScore: evalResult.riskScore,
        riskLevel: mappedLevel,
        riskFactors: evalResult.factors,
        recommendedAction: readableAction,
        aiExplanation: evalResult.explanationSummary,
      };
    });
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return evaluatedTransactions.filter((tx) => {
      if (selectedRiskType !== "All" && tx.riskType !== selectedRiskType) return false;
      if (selectedRiskLevel !== "All" && tx.riskLevel !== selectedRiskLevel) return false;
      if (selectedStatus !== "All" && tx.status !== selectedStatus) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesId = tx.id.toLowerCase().includes(q);
        const matchesName = tx.customerName.toLowerCase().includes(q);
        const matchesEmail = tx.customerEmail.toLowerCase().includes(q);
        const matchesIp = tx.ipAddress.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesEmail && !matchesIp) return false;
      }
      return true;
    });
  }, [evaluatedTransactions, selectedRiskType, selectedRiskLevel, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = 14280;
    const lowCount = 11840;
    const mediumCount = 1850;
    const highCount = 470;
    const criticalCount = 120;
    const totalMoneyAtRisk = 148920.00;
    const preventableExposure = 94500.00;
    const recoveredAmount = 38200.00;
    const unresolvedAmount = 16220.00;

    return {
      totalCount,
      lowCount,
      mediumCount,
      highCount,
      criticalCount,
      totalMoneyAtRisk,
      preventableExposure,
      recoveredAmount,
      unresolvedAmount,
    };
  }, []);

  const getRiskLevelBadge = (level: string, score: number) => {
    switch (level) {
      case "Critical":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold">{score} · Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-semibold">{score} · High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold">{score} · Medium</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold">{score} · Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Auto-Blocked":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">{status}</Badge>;
      case "Flagged":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">{status}</Badge>;
      case "Pending Review":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{status}</Badge>;
      case "Whitelisted":
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">{status}</Badge>;
      default:
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{status}</Badge>;
    }
  };

  const getRiskTypeBadge = (type: string) => {
    switch (type) {
      case "Fraud":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20"><ShieldAlert className="h-3 w-3" /> Fraud</span>;
      case "Chargeback":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20"><FileCheck className="h-3 w-3" /> Chargeback</span>;
      case "Return":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20"><RefreshCw className="h-3 w-3" /> Return</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20"><AlertCircle className="h-3 w-3" /> Abuse</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Sentinel Risk Center</h1>
              <p className="text-sm text-slate-400">
                Centralized merchant risk operations powered by Nexora Deterministic Rule Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center transition-all">
            <Download className="mr-2 h-4 w-4 text-emerald-400" /> Export Risk Logs
          </button>
          <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center shadow-lg shadow-emerald-500/20 transition-all">
            <Zap className="mr-2 h-4 w-4" /> Trigger Risk Rescan
          </button>
        </div>
      </div>

      {/* A. Risk Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-400">Analyzed Volume</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{metrics.totalCount.toLocaleString()}</p>
          <span className="mt-2 inline-flex items-center text-[10px] text-emerald-400">100% Scanned</span>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-400">Low Risk (0–30)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{metrics.lowCount.toLocaleString()}</p>
          <span className="mt-2 inline-flex items-center text-[10px] text-slate-400">82.9% of total</span>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-400">Medium Risk (31–70)</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{metrics.mediumCount.toLocaleString()}</p>
          <span className="mt-2 inline-flex items-center text-[10px] text-slate-400">13.0% of total</span>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-400">High Risk (71–85)</p>
          <p className="mt-1 text-2xl font-bold text-orange-400">{metrics.highCount.toLocaleString()}</p>
          <span className="mt-2 inline-flex items-center text-[10px] text-orange-400">Action Required</span>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-400">Critical Risk (86–100)</p>
          <p className="mt-1 text-2xl font-bold text-rose-400">{metrics.criticalCount.toLocaleString()}</p>
          <span className="mt-2 inline-flex items-center text-[10px] text-rose-400">Immediate Threat</span>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <p className="text-xs font-medium text-slate-400">Total Money at Risk</p>
          <p className="mt-1 text-2xl font-bold text-rose-300">${metrics.totalMoneyAtRisk.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <span className="mt-2 inline-flex items-center text-[10px] text-slate-400">Across high/critical</span>
        </div>
      </div>

      {/* E. Money Exposure & D. Score Distribution Cards */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Money Exposure Breakdown (E) */}
        <div className="md:col-span-7 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Financial Exposure Breakdown</h2>
            </div>
            <span className="text-xs text-slate-400">Updated in Real-Time</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">Total Financial Exposure</p>
              <p className="text-xl font-bold text-rose-400 mt-1">${metrics.totalMoneyAtRisk.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-slate-500 mt-1">High & Critical transactions value</p>
            </div>

            <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">Potentially Preventable Exposure</p>
              <p className="text-xl font-bold text-amber-400 mt-1">${metrics.preventableExposure.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-slate-500 mt-1">Flagged before completion</p>
            </div>

            <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">Recovered / Mitigated Amount</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">${metrics.recoveredAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-slate-500 mt-1">Saved via auto-rules & refunds</p>
            </div>

            <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">Unresolved Exposure</p>
              <p className="text-xl font-bold text-purple-400 mt-1">${metrics.unresolvedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting manual decision</p>
            </div>
          </div>
        </div>

        {/* Risk Score Visualization (D) */}
        <div className="md:col-span-5 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Risk Score Distribution</h2>
            </div>
            <span className="text-xs text-slate-400">14,280 Total</span>
          </div>

          <div className="space-y-3">
            {/* Low */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-medium">0–30 Low Risk</span>
                <span className="text-slate-300 font-mono">11,840 (82.9%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "82.9%" }} />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-medium">31–70 Medium Risk</span>
                <span className="text-slate-300 font-mono">1,850 (13.0%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "13.0%" }} />
              </div>
            </div>

            {/* High */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-400 font-medium">71–85 High Risk</span>
                <span className="text-slate-300 font-mono">470 (3.3%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "3.3%" }} />
              </div>
            </div>

            {/* Critical */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-medium">86–100 Critical Risk</span>
                <span className="text-slate-300 font-mono">120 (0.8%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "0.8%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B. Risk Filters Bar */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
        {/* Top Row: Risk Type Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Type:
            </span>
            {["All", "Fraud", "Return", "Chargeback", "Abuse"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedRiskType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRiskType === type
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, Customer, Email, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-800 pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Risk Level */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Risk Level</label>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="All">All Risk Levels</option>
              <option value="Critical">Critical (86-100)</option>
              <option value="High">High (71-85)</option>
              <option value="Medium">Medium (31-70)</option>
              <option value="Low">Low (0-30)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Flagged">Flagged</option>
              <option value="Auto-Blocked">Auto-Blocked</option>
              <option value="Resolved">Resolved</option>
              <option value="Whitelisted">Whitelisted</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Date Range</label>
            <select
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option>Today (Aug 24, 2026)</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>

          {/* Amount Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Amount Tier</label>
            <select
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option>All Amounts</option>
              <option>&gt; $5,000 (High Exposure)</option>
              <option>$1,000 - $5,000</option>
              <option>&lt; $1,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* C. Risk Transaction Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Risk Transactions Queue</h3>
            <p className="text-xs text-slate-400">Click any transaction to launch full investigation panel</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            Showing {filteredTransactions.length} of {evaluatedTransactions.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Deterministic Risk Score</th>
                <th className="py-3 px-4">Risk Type</th>
                <th className="py-3 px-4">Risk Factors</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400 group-hover:underline">
                    {tx.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                        {tx.customerAvatar}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{tx.customerName}</p>
                        <p className="text-[10px] text-slate-500">{tx.customerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-100">
                    ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    {getRiskLevelBadge(tx.riskLevel, tx.riskScore)}
                  </td>
                  <td className="py-3 px-4">
                    {getRiskTypeBadge(tx.riskType)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {tx.riskFactors.slice(0, 2).map((factor) => (
                        <span key={factor.name} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                          {factor.name} (+{factor.contribution})
                        </span>
                      ))}
                      {tx.riskFactors.length > 2 && (
                        <span className="text-[10px] text-slate-500 font-mono">+{tx.riskFactors.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    <span className="text-xs text-slate-300 bg-slate-800/80 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 px-2.5 py-1 rounded border border-slate-700 transition-colors inline-flex items-center gap-1">
                      {tx.recommendedAction}
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* F. Clicking a Transaction: Detailed Slide-over Investigation Panel */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0b1329] border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-100 font-mono">{selectedTransaction.id}</h2>
                    {getRiskLevelBadge(selectedTransaction.riskLevel, selectedTransaction.riskScore)}
                  </div>
                  <p className="text-xs text-slate-400">Risk Investigation & Evidence Dossier</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Recommended Action Banner */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deterministic Engine Recommendation</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Rules Evaluation Engine</Badge>
              </div>
              <p className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                {selectedTransaction.recommendedAction}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-700 text-white flex items-center shadow">
                  <Ban className="mr-1.5 h-3.5 w-3.5" /> Block & Refund
                </button>
                <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-950 border border-slate-800 text-amber-400 hover:bg-slate-900 flex items-center">
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate Case
                </button>
                <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-950 border border-slate-800 text-purple-400 hover:bg-slate-900 flex items-center">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Whitelist Customer
                </button>
              </div>
            </div>

            {/* AI Explanation Box */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-emerald-400" /> Explainable Risk Summary
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {selectedTransaction.aiExplanation}
              </p>
            </div>

            {/* Risk Factor Contributions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identified Risk Factors & Contributions</h3>
              <div className="space-y-2">
                {selectedTransaction.riskFactors.map((factor) => (
                  <div key={factor.name} className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{factor.name}</p>
                      <p className="text-[11px] text-slate-400">{factor.description}</p>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      +{factor.contribution} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Transaction Feature Inputs */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine Input Features</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">1h Velocity</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.rawFeatures.velocityPerHour} attempts / hr</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">Failed Attempts</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.rawFeatures.failedAttempts} failed auths</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">Chargeback History</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.rawFeatures.chargebackHistoryCount} chargebacks</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">Return History</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.rawFeatures.returnHistoryCount} returns</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">New Device / Customer</span>
                  <span className="font-medium text-slate-200">
                    {selectedTransaction.rawFeatures.isNewDevice ? "New Device" : "Known Device"} · {selectedTransaction.rawFeatures.isNewCustomer ? "New User" : "Returning User"}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 font-mono">
                  <span className="text-slate-500 block text-[10px]">Unusual Amount / Time</span>
                  <span className="font-medium text-slate-200">
                    {selectedTransaction.rawFeatures.isUnusualAmount ? "Unusual Amt" : "Normal Amt"} · {selectedTransaction.rawFeatures.isUnusualTime ? "Off-Peak Time" : "Normal Time"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => setSelectedTransaction(null)} className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800">
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
