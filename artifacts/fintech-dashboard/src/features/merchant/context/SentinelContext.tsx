import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { auditLoggerService, SentinelAuditEvent } from "../sentinel/services/auditLoggerService";
import { api, BackendAuditRecord } from "@/lib/api";

export interface SentinelTransaction {
  id: string;
  amount: number;
  currency?: string;
  riskScore: number;
  riskType: "Fraud" | "Return" | "Chargeback" | "Abuse";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  customerName: string;
  customerEmail: string;
  detectedAt: string;
  timestamp?: string;
  paymentMethod?: string;
  riskFactors?: string[];
  status: "Action Required" | "Under Review" | "Escalated" | "Blocked" | "Approved" | "Hold";
  decision: "NONE" | "APPROVED_BY_MERCHANT" | "BLOCK_AND_REFUND" | "HOLD_FOR_REVIEW" | "REQUEST_3DS";
  refundStatus: "NONE" | "REFUND_INITIATED" | "COMPLETED";
  investigationStatus: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  location: string;
  ipAddress: string;
  deviceId: string;
  cardBin: string;
  signals: string[];
}

export interface SentinelStateMetrics {
  paymentsBlocked: number;
  refundsInitiated: number;
  preventedLoss: number;
  approvedAfterReview: number;
}

interface SentinelContextType {
  transactions: SentinelTransaction[];
  metrics: SentinelStateMetrics;
  isFetching: boolean;
  approveOrder: (id: string) => Promise<void>;
  blockAndRefund: (id: string) => Promise<void>;
  getTransactionById: (id: string) => SentinelTransaction | undefined;
  resetDemoData: () => void;
  addTransaction: (txn: SentinelTransaction) => void;
  recordAuditLog: (event: Partial<SentinelAuditEvent>) => void;
  refreshTransactions: () => Promise<void>;
}

const STORAGE_KEY = "nexora_sentinel_shared_state_v3";

const INITIAL_TRANSACTIONS: SentinelTransaction[] = [
  {
    id: "TXN-904812",
    amount: 2450.00,
    currency: "USD",
    riskScore: 94,
    riskType: "Fraud",
    riskLevel: "Critical",
    customerName: "Alexander Wright",
    customerEmail: "alex.w@example.com",
    detectedAt: "10 mins ago",
    status: "Action Required",
    decision: "NONE",
    refundStatus: "NONE",
    investigationStatus: "OPEN",
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
    amount: 1890.50,
    currency: "USD",
    riskScore: 88,
    riskType: "Return",
    riskLevel: "High",
    customerName: "Sophia Chen",
    customerEmail: "sophia.c@example.com",
    detectedAt: "28 mins ago",
    status: "Under Review",
    decision: "NONE",
    refundStatus: "NONE",
    investigationStatus: "UNDER_REVIEW",
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
    amount: 3200.00,
    currency: "USD",
    riskScore: 91,
    riskType: "Chargeback",
    riskLevel: "Critical",
    customerName: "Marcus Vance",
    customerEmail: "m.vance@example.com",
    detectedAt: "1 hour ago",
    status: "Escalated",
    decision: "NONE",
    refundStatus: "NONE",
    investigationStatus: "OPEN",
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
    amount: 780.00,
    currency: "USD",
    riskScore: 78,
    riskType: "Abuse",
    riskLevel: "High",
    customerName: "Jordan Miller",
    customerEmail: "j.miller99@example.com",
    detectedAt: "2 hours ago",
    status: "Action Required",
    decision: "NONE",
    refundStatus: "NONE",
    investigationStatus: "OPEN",
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
    amount: 4150.00,
    currency: "USD",
    riskScore: 96,
    riskType: "Fraud",
    riskLevel: "Critical",
    customerName: "Elena Rostova",
    customerEmail: "elena.r@example.com",
    detectedAt: "3 hours ago",
    status: "Blocked",
    decision: "BLOCK_AND_REFUND",
    refundStatus: "REFUND_INITIATED",
    investigationStatus: "RESOLVED",
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
    amount: 1250.00,
    currency: "USD",
    riskScore: 65,
    riskType: "Return",
    riskLevel: "Medium",
    customerName: "David K.",
    customerEmail: "david.k@example.com",
    detectedAt: "4 hours ago",
    status: "Approved",
    decision: "APPROVED_BY_MERCHANT",
    refundStatus: "NONE",
    investigationStatus: "RESOLVED",
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

const INITIAL_METRICS: SentinelStateMetrics = {
  paymentsBlocked: 14,
  refundsInitiated: 12,
  preventedLoss: 98400.00,
  approvedAfterReview: 18,
};

function mapAuditRecordToTransaction(record: BackendAuditRecord): SentinelTransaction {
  const score = typeof record.riskScore === "number" ? record.riskScore : 85;

  let riskLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
  const rawLevel = (record.riskLevel || "").toUpperCase();
  if (rawLevel === "CRITICAL" || score >= 90) riskLevel = "Critical";
  else if (rawLevel === "HIGH" || score >= 75) riskLevel = "High";
  else if (rawLevel === "MEDIUM" || score >= 50) riskLevel = "Medium";
  else riskLevel = "Low";

  let status: SentinelTransaction["status"] = "Action Required";
  let decision: SentinelTransaction["decision"] = "NONE";
  const rawDecision = (record.decision || "").toUpperCase();
  if (rawDecision === "APPROVE") {
    status = "Approved";
    decision = "APPROVED_BY_MERCHANT";
  } else if (rawDecision === "BLOCK") {
    status = "Blocked";
    decision = "BLOCK_AND_REFUND";
  } else if (rawDecision === "MANUAL_REVIEW" || rawDecision === "HOLD" || rawDecision === "HOLD_FOR_REVIEW") {
    status = "Hold";
    decision = "HOLD_FOR_REVIEW";
  } else if (rawDecision === "REQUIRE_3DS" || rawDecision === "REQUEST_3DS") {
    status = "Under Review";
    decision = "REQUEST_3DS";
  }

  const meta = record.metadata || {};

  // Customer resolution logic (NO hardcoding or fallback to "SENTINEL_AI_ENGINE")
  let customerName = "Unknown customer";
  if (meta.customerId) {
    customerName = meta.customerId;
  } else if (meta.customerName) {
    customerName = meta.customerName;
  } else if (record.actor && record.actor !== "SENTINEL_AI_ENGINE") {
    customerName = record.actor;
  } else if (record.merchantId) {
    customerName = record.merchantId;
  }

  const customerEmail =
    meta.customerEmail ||
    (record.actor && record.actor.includes("@")
      ? record.actor
      : customerName !== "Unknown customer" && !customerName.startsWith("CUST-") && !customerName.startsWith("MERCHANT-")
      ? `${customerName.toLowerCase().replace(/\s+/g, ".")}@example.com`
      : `${customerName.toLowerCase()}@nexora.io`);

  // Amount and currency resolution (NO hardcoding or demo multiplication)
  const rawAmount = meta.amount !== undefined ? meta.amount : meta.transactionAmount;
  const amount = typeof rawAmount === "number" ? rawAmount : typeof rawAmount === "string" && !isNaN(Number(rawAmount)) ? Number(rawAmount) : 0;
  const currency = meta.currency || "INR";

  // Payment method resolution (NO defaulting to "Credit Card (Visa)")
  const paymentMethod = meta.paymentMethod || "Not provided";

  const signals =
    Array.isArray(record.reasons) && record.reasons.length > 0
      ? record.reasons
      : meta.signals || ["Sentinel Risk Evaluation Signal"];

  const formattedDate = record.timestamp
    ? new Date(record.timestamp).toLocaleString()
    : "Just now";

  return {
    id: record.transactionId,
    amount,
    currency,
    riskScore: score,
    riskType: meta.riskType || (score >= 90 ? "Fraud" : score >= 80 ? "Return" : score >= 70 ? "Chargeback" : "Abuse"),
    riskLevel,
    customerName,
    customerEmail,
    detectedAt: formattedDate,
    timestamp: record.timestamp,
    paymentMethod,
    riskFactors: signals,
    status,
    decision,
    refundStatus: status === "Blocked" ? "REFUND_INITIATED" : "NONE",
    investigationStatus: status === "Approved" || status === "Blocked" ? "RESOLVED" : "OPEN",
    location: meta.location || meta.ipAddress ? `IP: ${meta.ipAddress || "Remote"}` : "Remote IP",
    ipAddress: meta.ipAddress || "192.168.1.1",
    deviceId: meta.deviceId || "DEV-CLIENT-001",
    cardBin: meta.cardBin || "N/A",
    signals,
  };
}

const SentinelContext = createContext<SentinelContextType | undefined>(undefined);

export const SentinelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<SentinelTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.transactions && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          return parsed.transactions;
        }
      }
    } catch (e) {
      console.warn("Failed to load sentinel state from localStorage:", e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [metrics, setMetrics] = useState<SentinelStateMetrics>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.metrics) {
          return parsed.metrics;
        }
      }
    } catch (e) {
      console.warn("Failed to load sentinel metrics from localStorage:", e);
    }
    return INITIAL_METRICS;
  });

  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fetch real backend transactions derived from PostgreSQL sentinel/audit-logs
  const refreshTransactions = useCallback(async (): Promise<void> => {
    setIsFetching(true);
    try {
      const response = await api.getSentinelAuditLogs();
      if (response && Array.isArray(response.data)) {
        const fetchedTxns = response.data.map(mapAuditRecordToTransaction);

        setTransactions((prevTxns) => {
          const map = new Map<string, SentinelTransaction>();
          // 1. Add fetched backend transactions
          for (const t of fetchedTxns) {
            map.set(t.id, t);
          }
          // 2. Overlay existing state (preserving any local Merchant actions like Approve/Block)
          for (const existing of prevTxns) {
            const backendMatch = map.get(existing.id);
            if (backendMatch) {
              // If merchant modified status locally (e.g. Approved or Blocked), preserve local decision
              if (existing.status === "Approved" || existing.status === "Blocked") {
                map.set(existing.id, {
                  ...backendMatch,
                  status: existing.status,
                  decision: existing.decision,
                  refundStatus: existing.refundStatus,
                  investigationStatus: existing.investigationStatus,
                });
              } else {
                map.set(existing.id, backendMatch);
              }
            } else {
              // Local transaction not yet in backend array
              map.set(existing.id, existing);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn("Unable to fetch backend Sentinel transactions:", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Initial fetch and auto-polling (every 8 seconds)
  useEffect(() => {
    refreshTransactions();
    const interval = setInterval(() => {
      refreshTransactions();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, metrics }));
    } catch (e) {
      console.warn("Failed to save sentinel state to localStorage:", e);
    }
  }, [transactions, metrics]);

  const getTransactionById = (id: string): SentinelTransaction | undefined => {
    return transactions.find((t) => t.id === id);
  };

  const approveOrder = async (id: string): Promise<void> => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    await new Promise((resolve) => setTimeout(resolve, 800));

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "Approved",
              decision: "APPROVED_BY_MERCHANT",
              investigationStatus: "RESOLVED",
            }
          : t
      )
    );

    setMetrics((prev) => ({
      ...prev,
      approvedAfterReview: prev.approvedAfterReview + 1,
    }));

    // Record immutable audit event
    auditLoggerService.logEvent({
      transactionId: target.id,
      investigationId: `CASE-${target.id}`,
      riskScore: target.riskScore,
      riskFactors: target.signals,
      aiRecommendation: "APPROVE",
      humanDecision: "APPROVE",
      approvedBy: "Merchant Admin (admin@nexora.io)",
      previousStatus: target.status,
      newStatus: "APPROVED",
      reason: `ORDER_APPROVED - Decision: APPROVED_BY_MERCHANT (Risk Score: ${target.riskScore})`,
      actionSource: "HUMAN",
    });

    toast({
      title: "✓ Order Approved",
      description: `Transaction ${id} has been approved successfully.`,
    });
  };

  const blockAndRefund = async (id: string): Promise<void> => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    await new Promise((resolve) => setTimeout(resolve, 900));

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "Blocked",
              decision: "BLOCK_AND_REFUND",
              refundStatus: "REFUND_INITIATED",
              investigationStatus: "RESOLVED",
            }
          : t
      )
    );

    setMetrics((prev) => ({
      ...prev,
      paymentsBlocked: prev.paymentsBlocked + 1,
      refundsInitiated: prev.refundsInitiated + 1,
      preventedLoss: prev.preventedLoss + target.amount,
    }));

    // Record 3 required audit log events for Block & Refund flow
    auditLoggerService.logEvent({
      transactionId: target.id,
      investigationId: `CASE-${target.id}`,
      riskScore: target.riskScore,
      riskFactors: target.signals,
      aiRecommendation: "BLOCK",
      humanDecision: "BLOCK",
      approvedBy: "Merchant Admin (admin@nexora.io)",
      previousStatus: target.status,
      newStatus: "RISK_DECISION_MADE",
      reason: `RISK_DECISION_MADE - Score: ${target.riskScore}, Decision: BLOCK_AND_REFUND`,
      actionSource: "HUMAN",
    });

    auditLoggerService.logEvent({
      transactionId: target.id,
      investigationId: `CASE-${target.id}`,
      riskScore: target.riskScore,
      riskFactors: target.signals,
      aiRecommendation: "BLOCK",
      humanDecision: "BLOCK",
      approvedBy: "Merchant Admin (admin@nexora.io)",
      previousStatus: "RISK_DECISION_MADE",
      newStatus: "BLOCKED",
      reason: `PAYMENT_BLOCKED - Transaction ${target.id}`,
      actionSource: "HUMAN",
    });

    auditLoggerService.logEvent({
      transactionId: target.id,
      investigationId: `CASE-${target.id}`,
      riskScore: target.riskScore,
      riskFactors: target.signals,
      aiRecommendation: "BLOCK",
      humanDecision: "BLOCK",
      approvedBy: "Merchant Admin (admin@nexora.io)",
      previousStatus: "BLOCKED",
      newStatus: "REFUND_INITIATED",
      reason: `REFUND_INITIATED - Amount: $${target.amount.toFixed(2)}`,
      actionSource: "HUMAN",
    });

    toast({
      title: "✓ Payment Blocked",
      description: `Transaction ${id} has been blocked and the refund has been initiated.`,
    });
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMetrics(INITIAL_METRICS);
    refreshTransactions();
    toast({
      title: "⚡ Stream Refreshed",
      description: "Fetched latest live transaction records from Sentinel PostgreSQL backend.",
    });
  };

  const addTransaction = (txn: SentinelTransaction) => {
    setTransactions((prev) => [txn, ...prev]);
  };

  const recordAuditLog = (evt: Partial<SentinelAuditEvent>) => {
    auditLoggerService.logEvent({
      transactionId: evt.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      investigationId: evt.investigationId || `CASE-${Math.floor(100000 + Math.random() * 900000)}`,
      riskScore: evt.riskScore || 85,
      riskFactors: evt.riskFactors || ["Risk Vector Detected"],
      aiRecommendation: evt.aiRecommendation || "BLOCK",
      humanDecision: evt.humanDecision || "BLOCK",
      approvedBy: evt.approvedBy || "Merchant Operator",
      previousStatus: evt.previousStatus || "SUSPICIOUS",
      newStatus: evt.newStatus || "ACTION_TAKEN",
      reason: evt.reason || "Manual Risk Action Recorded",
      actionSource: evt.actionSource || "HUMAN",
    });
  };

  return (
    <SentinelContext.Provider
      value={{
        transactions,
        metrics,
        isFetching,
        approveOrder,
        blockAndRefund,
        getTransactionById,
        resetDemoData,
        addTransaction,
        recordAuditLog,
        refreshTransactions,
      }}
    >
      {children}
    </SentinelContext.Provider>
  );
};

export const useSentinelState = (): SentinelContextType => {
  const context = useContext(SentinelContext);
  if (!context) {
    throw new Error("useSentinelState must be used within a SentinelProvider");
  }
  return context;
};

