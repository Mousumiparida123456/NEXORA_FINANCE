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

export interface RiskTransaction {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  amount: number;
  currency: string;
  riskScore: number; // 0-100
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskType: "Fraud" | "Return" | "Chargeback" | "Abuse";
  riskFactors: string[];
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
  signals: { name: string; score: number; detail: string }[];
}

const DEMO_RISK_TRANSACTIONS: RiskTransaction[] = [
  {
    id: "TX-948201",
    customerName: "Alex Rivera",
    customerEmail: "alex.rivera@techglobal.io",
    customerAvatar: "AR",
    amount: 4850.00,
    currency: "USD",
    riskScore: 94,
    riskLevel: "Critical",
    riskType: "Fraud",
    riskFactors: ["Anonymous Proxy", "High Velocity (14/hr)", "Card BIN Mismatch", "New Device"],
    status: "Auto-Blocked",
    recommendedAction: "Block Card & Refund",
    date: "2026-08-24",
    timestamp: "10:14:22 AM",
    paymentMethod: "Visa ending in 4921",
    cardNumber: "**** **** **** 4921",
    ipAddress: "185.220.101.4 (TOR Exit Node)",
    country: "Romania (Card: USA)",
    deviceType: "Linux / Firefox (Incognito)",
    aiExplanation: "Extreme risk transaction. Payment initiated via known TOR exit node in Romania using a US-issued credit card. Velocity checks triggered 14 transaction attempts within 60 minutes across multiple merchant domains.",
    signals: [
      { name: "IP Anonymizer Check", score: 98, detail: "Confirmed TOR exit node address" },
      { name: "Velocity Anomaly", score: 92, detail: "14 payment attempts in 60 mins" },
      { name: "Geo-Billing Mismatch", score: 95, detail: "Card issued in US, IP located in RO" },
      { name: "Device Fingerprint", score: 88, detail: "Headless browser environment detected" },
    ],
  },
  {
    id: "TX-948195",
    customerName: "Marcus Vance",
    customerEmail: "m.vance@solardynamics.net",
    customerAvatar: "MV",
    amount: 12500.00,
    currency: "USD",
    riskScore: 88,
    riskLevel: "Critical",
    riskType: "Chargeback",
    riskFactors: ["High Order Value", "Past Chargeback History", "Email Domain Created < 7 days"],
    status: "Flagged",
    recommendedAction: "Request 3DS Verification",
    date: "2026-08-24",
    timestamp: "09:48:10 AM",
    paymentMethod: "Mastercard ending in 8812",
    cardNumber: "**** **** **** 8812",
    ipAddress: "198.51.100.42",
    country: "United States",
    deviceType: "Macintosh / Chrome",
    aiExplanation: "High financial exposure transaction. Customer account has 2 previously confirmed chargebacks on partner merchant platforms within the last 90 days. Domain age for email is less than 7 days old.",
    signals: [
      { name: "Chargeback History", score: 94, detail: "2 prior chargeback disputes" },
      { name: "Order Value Outlier", score: 85, detail: "450% higher than average user order" },
      { name: "Domain Reputation", score: 86, detail: "Newly registered domain (5 days old)" },
    ],
  },
  {
    id: "TX-948188",
    customerName: "Elena Rostova",
    customerEmail: "elena.r@fintechgroup.de",
    customerAvatar: "ER",
    amount: 3200.00,
    currency: "USD",
    riskScore: 78,
    riskLevel: "High",
    riskType: "Abuse",
    riskFactors: ["Promo Abuse Pattern", "Multiple Accounts Same Device", "Fast Checkout"],
    status: "Pending Review",
    recommendedAction: "Manual Review",
    date: "2026-08-24",
    timestamp: "09:12:05 AM",
    paymentMethod: "Amex ending in 1004",
    cardNumber: "**** **** **** 1004",
    ipAddress: "84.115.22.18",
    country: "Germany",
    deviceType: "iPhone / Safari",
    aiExplanation: "Promotion code abuse pattern. Device hardware fingerprint matches 5 separate registered accounts claiming first-time signup merchant discounts.",
    signals: [
      { name: "Device Multi-Accounting", score: 82, detail: "5 accounts registered on same device" },
      { name: "Promo Stacking", score: 76, detail: "Redeemed single-use promo code across accounts" },
      { name: "Checkout Speed", score: 74, detail: "Form completed in under 1.2 seconds" },
    ],
  },
  {
    id: "TX-948172",
    customerName: "David Chen",
    customerEmail: "dchen@apexlogistics.com",
    customerAvatar: "DC",
    amount: 1450.00,
    currency: "USD",
    riskScore: 72,
    riskLevel: "High",
    riskType: "Return",
    riskFactors: ["High Return Rate (82%)", "Wardrobing Pattern", "Bulk Item Return History"],
    status: "Pending Review",
    recommendedAction: "Manual Review",
    date: "2026-08-23",
    timestamp: "11:55:40 PM",
    paymentMethod: "Visa ending in 7120",
    cardNumber: "**** **** **** 7120",
    ipAddress: "172.56.21.90",
    country: "United States",
    deviceType: "Windows / Chrome",
    aiExplanation: "Abnormal return behavior pattern. Customer has initiated returns on 82% of all purchases made in the last 6 months, exhibiting policy abuse signals.",
    signals: [
      { name: "Historical Return Rate", score: 84, detail: "82% return rate over 18 transactions" },
      { name: "Policy Threshold", score: 70, detail: "Exceeds merchant return frequency cap" },
    ],
  },
  {
    id: "TX-948160",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@biohealth.co.uk",
    customerAvatar: "SJ",
    amount: 890.00,
    currency: "USD",
    riskScore: 54,
    riskLevel: "Medium",
    riskType: "Fraud",
    riskFactors: ["First Order High Value", "IP Distance > 500mi from Billing"],
    status: "Pending Review",
    recommendedAction: "Approve with Monitoring",
    date: "2026-08-23",
    timestamp: "10:30:15 PM",
    paymentMethod: "Visa ending in 3391",
    cardNumber: "**** **** **** 3391",
    ipAddress: "31.205.88.12",
    country: "United Kingdom",
    deviceType: "iPad / Mobile Safari",
    aiExplanation: "Moderate risk level. IP address is located in London while billing zip code is in Manchester. First time customer purchase.",
    signals: [
      { name: "Distance Variance", score: 58, detail: "200 miles between IP and billing address" },
      { name: "New Customer Profile", score: 50, detail: "No prior purchase history on platform" },
    ],
  },
  {
    id: "TX-948151",
    customerName: "Liam O'Connor",
    customerEmail: "liam@dublindesign.ie",
    customerAvatar: "LO",
    amount: 620.00,
    currency: "USD",
    riskScore: 42,
    riskLevel: "Medium",
    riskType: "Return",
    riskFactors: ["Slightly Elevated Return History"],
    status: "Resolved",
    recommendedAction: "Approve",
    date: "2026-08-23",
    timestamp: "08:14:02 PM",
    paymentMethod: "Mastercard ending in 5012",
    cardNumber: "**** **** **** 5012",
    ipAddress: "89.101.44.12",
    country: "Ireland",
    deviceType: "Macintosh / Safari",
    aiExplanation: "Low-to-moderate risk. Minor return history, but identity and payment details match verified customer profile.",
    signals: [
      { name: "Identity Match", score: 10, detail: "100% address and phone verification match" },
      { name: "Return Frequency", score: 45, detail: "2 returns out of 12 orders" },
    ],
  },
  {
    id: "TX-948144",
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@cloudtech.in",
    customerAvatar: "PS",
    amount: 340.00,
    currency: "USD",
    riskScore: 18,
    riskLevel: "Low",
    riskType: "Fraud",
    riskFactors: ["Verified 3DS", "Low Velocity", "Matching Billing & IP"],
    status: "Whitelisted",
    recommendedAction: "Auto-Approve",
    date: "2026-08-23",
    timestamp: "06:45:30 PM",
    paymentMethod: "Visa ending in 9081",
    cardNumber: "**** **** **** 9081",
    ipAddress: "103.211.52.19",
    country: "India",
    deviceType: "Android / Chrome",
    aiExplanation: "Low risk transaction. Full 3DS verification completed successfully. Customer account has 14 prior successful orders.",
    signals: [
      { name: "3DS Auth", score: 0, detail: "Biometric 3DS2 challenge passed" },
      { name: "Account Longevity", score: 5, detail: "Active customer for 24 months" },
    ],
  },
  {
    id: "TX-948130",
    customerName: "Thomas Wright",
    customerEmail: "twright@globalventures.com",
    customerAvatar: "TW",
    amount: 1980.00,
    currency: "USD",
    riskScore: 12,
    riskLevel: "Low",
    riskType: "Fraud",
    riskFactors: ["Established Enterprise VIP", "Zero Anomalies"],
    status: "Resolved",
    recommendedAction: "Auto-Approve",
    date: "2026-08-23",
    timestamp: "04:20:11 PM",
    paymentMethod: "Amex ending in 4001",
    cardNumber: "**** **** **** 4001",
    ipAddress: "192.241.180.5",
    country: "United States",
    deviceType: "Macintosh / Chrome",
    aiExplanation: "Very low risk transaction. Customer is a verified VIP enterprise corporate buyer with clean historical record.",
    signals: [
      { name: "VIP Status", score: 0, detail: "Verified Corporate Account" },
      { name: "Historical Trust", score: 2, detail: "Over $50,000 processed lifetime" },
    ],
  },
];

export function RiskCenterPage() {
  const [selectedRiskType, setSelectedRiskType] = useState<string>("All");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<RiskTransaction | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return DEMO_RISK_TRANSACTIONS.filter((tx) => {
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
  }, [selectedRiskType, selectedRiskLevel, selectedStatus, searchQuery]);

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
                Centralized merchant risk operations, anomaly detection, money exposure & policy enforcement
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
            Showing {filteredTransactions.length} of {DEMO_RISK_TRANSACTIONS.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Risk Score</th>
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
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {tx.riskFactors.slice(0, 2).map((factor) => (
                        <span key={factor} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                          {factor}
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
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended Next Step</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">AI Recommendation Engine</Badge>
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
                <AlertCircle className="h-4 w-4 text-emerald-400" /> Why Is This Risky?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {selectedTransaction.aiExplanation}
              </p>
            </div>

            {/* Signals Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Signal Breakdown</h3>
              <div className="space-y-2">
                {selectedTransaction.signals.map((signal) => (
                  <div key={signal.name} className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{signal.name}</p>
                      <p className="text-[11px] text-slate-400">{signal.detail}</p>
                    </div>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      signal.score > 80 ? "bg-red-500/20 text-red-400" : signal.score > 50 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {signal.score} / 100
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Metadata Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction Metadata</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Customer Name</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.customerName}</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Email Address</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.customerEmail}</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Transaction Amount</span>
                  <span className="font-medium text-emerald-400 font-mono">${selectedTransaction.amount.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Payment Method</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">IP Address & Node</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.ipAddress}</span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Location & Billing Geo</span>
                  <span className="font-medium text-slate-200">{selectedTransaction.country}</span>
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
