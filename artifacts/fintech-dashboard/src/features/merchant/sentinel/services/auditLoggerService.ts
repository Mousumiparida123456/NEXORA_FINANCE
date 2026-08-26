import { api } from "@/lib/api";

export type AuditActionSource = "AI" | "HUMAN" | "SYSTEM";
export type SentinelRecommendation = "APPROVE" | "HOLD_FOR_REVIEW" | "REQUEST_VERIFICATION" | "BLOCK" | "MONITOR";
export type SentinelHumanDecision = "APPROVE" | "HOLD" | "HOLD_FOR_REVIEW" | "REQUEST_3DS" | "REQUEST_VERIFICATION" | "BLOCK" | "MONITOR";

export interface SentinelAuditEvent {
  id: string;
  timestamp: string; // ISO 8601
  formattedTime: string; // e.g. "12:42 PM"
  transactionId: string;
  investigationId: string;
  riskScore: number; // 0 - 100
  riskFactors: string[]; // e.g. ["Unusual amount", "New device", "Multiple failed attempts"]
  aiRecommendation: SentinelRecommendation;
  humanDecision: SentinelHumanDecision;
  approvedBy: string; // e.g. "Merchant Admin (admin@nexora.io)"
  previousStatus: string;
  newStatus: string;
  reason: string;
  actionSource: AuditActionSource;
}

class AuditLoggerService {
  private static readonly STORAGE_KEY = "nexora_sentinel_audit_events_v2";

  private logs: SentinelAuditEvent[];

  constructor() {
    this.logs = this.loadInitialLogs();
  }

  private loadInitialLogs(): SentinelAuditEvent[] {
    try {
      const stored = localStorage.getItem(AuditLoggerService.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fall back to pre-populated seed data
    }

    // Default Seed Dataset adhering strictly to User Requirements
    return [
      {
        id: "AUDIT-10982-5",
        timestamp: "2026-08-24T13:42:25Z",
        formattedTime: "13:42:25",
        transactionId: "TXN-10982",
        investigationId: "INV-00291",
        riskScore: 94,
        riskFactors: ["Synthetic recipient profile", "12 network suspicious records", "Unusual transaction amount (₹25,000)"],
        aiRecommendation: "HOLD_FOR_REVIEW",
        humanDecision: "HOLD",
        approvedBy: "Autonomous Sentinel AI Agent",
        previousStatus: "INVESTIGATION_CREATED",
        newStatus: "AI_RECOMMENDATION_GENERATED",
        reason: "AI_RECOMMENDATION_GENERATED - Recommendation: HOLD_PAYMENT (Confidence: 96%)",
        actionSource: "AI",
      },
      {
        id: "AUDIT-10982-4",
        timestamp: "2026-08-24T13:42:21Z",
        formattedTime: "13:42:21",
        transactionId: "TXN-10982",
        investigationId: "INV-00291",
        riskScore: 94,
        riskFactors: ["Critical threshold crossed (94/100)"],
        aiRecommendation: "HOLD_FOR_REVIEW",
        humanDecision: "HOLD",
        approvedBy: "Sentinel Workflow Engine",
        previousStatus: "PAYMENT_HELD",
        newStatus: "INVESTIGATION_CREATED",
        reason: "INVESTIGATION_CREATED - Case INV-00291 initialized automatically",
        actionSource: "SYSTEM",
      },
      {
        id: "AUDIT-10982-3",
        timestamp: "2026-08-24T13:42:20Z",
        formattedTime: "13:42:20",
        transactionId: "TXN-10982",
        investigationId: "INV-00291",
        riskScore: 94,
        riskFactors: ["SafePay Pre-Authorization hold enforced"],
        aiRecommendation: "HOLD_FOR_REVIEW",
        humanDecision: "HOLD",
        approvedBy: "SafePay Risk Protection",
        previousStatus: "RISK_DETECTED",
        newStatus: "PAYMENT_HELD",
        reason: "PAYMENT_HELD - Funds authorization blocked pre-transfer",
        actionSource: "SYSTEM",
      },
      {
        id: "AUDIT-10982-2",
        timestamp: "2026-08-24T13:42:19Z",
        formattedTime: "13:42:19",
        transactionId: "TXN-10982",
        investigationId: "INV-00291",
        riskScore: 94,
        riskFactors: ["Recipient Risk (+35)", "Suspicious Activity (+25)", "Chargeback History (+15)", "Unusual Amount (+12)", "Velocity (+7)"],
        aiRecommendation: "HOLD_FOR_REVIEW",
        humanDecision: "HOLD",
        approvedBy: "Deterministic Risk Engine",
        previousStatus: "PAYMENT_RISK_CHECK",
        newStatus: "RISK_DETECTED",
        reason: "RISK_DETECTED - Score: 94 / 100 (Level: CRITICAL)",
        actionSource: "SYSTEM",
      },
      {
        id: "AUDIT-10982-1",
        timestamp: "2026-08-24T13:42:18Z",
        formattedTime: "13:42:18",
        transactionId: "TXN-10982",
        investigationId: "INV-00291",
        riskScore: 94,
        riskFactors: ["Payment initiated via UPI (demo-risk-recipient@upi)"],
        aiRecommendation: "HOLD_FOR_REVIEW",
        humanDecision: "HOLD",
        approvedBy: "SafePay Gateway Ingress",
        previousStatus: "INITIATED",
        newStatus: "PAYMENT_RISK_CHECK",
        reason: "PAYMENT_RISK_CHECK - Amount: ₹25,000 to demo-risk-recipient@upi",
        actionSource: "SYSTEM",
      },
      {
        id: "AUDIT-99201",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        formattedTime: "12:42 PM",
        transactionId: "TXN-92841",
        investigationId: "CASE-948201",
        riskScore: 94,
        riskFactors: ["Unusual transaction amount", "New device fingerprint", "Multiple failed attempts"],
        aiRecommendation: "HOLD_FOR_REVIEW",
        humanDecision: "HOLD",
        approvedBy: "Merchant Admin (admin@nexora.io)",
        previousStatus: "PENDING_REVIEW",
        newStatus: "HELD_FOR_REVIEW",
        reason: "Unusual amount + new device + multiple failed attempts",
        actionSource: "HUMAN",
      },
      {
        id: "AUDIT-99198",
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        formattedTime: "11:55 AM",
        transactionId: "TX-948195",
        investigationId: "CASE-948195",
        riskScore: 86,
        riskFactors: ["High dollar value", "New billing address", "Chargeback history"],
        aiRecommendation: "REQUEST_VERIFICATION",
        humanDecision: "REQUEST_3DS",
        approvedBy: "Senior Analyst (sarah.c@nexora.io)",
        previousStatus: "FLAGGED_HIGH_RISK",
        newStatus: "REQUIRE_3DS",
        reason: "Requested 3DS biometric verification due to high exposure amount",
        actionSource: "HUMAN",
      },
      {
        id: "AUDIT-99182",
        timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
        formattedTime: "10:20 AM",
        transactionId: "TX-948188",
        investigationId: "CASE-948188",
        riskScore: 78,
        riskFactors: ["International IP", "Velocity spike"],
        aiRecommendation: "APPROVE",
        humanDecision: "APPROVE",
        approvedBy: "Merchant Admin (admin@nexora.io)",
        previousStatus: "PENDING_REVIEW",
        newStatus: "APPROVED",
        reason: "Customer verified via phone call authorization",
        actionSource: "HUMAN",
      },
      {
        id: "AUDIT-99165",
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        formattedTime: "08:10 AM",
        transactionId: "TX-947990",
        investigationId: "CASE-947990",
        riskScore: 98,
        riskFactors: ["Stolen Card BIN", "TOR Exit Node IP", "Dispute History"],
        aiRecommendation: "BLOCK",
        humanDecision: "BLOCK",
        approvedBy: "Compliance Lead (alex.r@nexora.io)",
        previousStatus: "FLAGGED_CRITICAL",
        newStatus: "BLOCKED_AND_REFUNDED",
        reason: "Stolen card BIN matched known fraud cluster #EVG-8820",
        actionSource: "HUMAN",
      },
      {
        id: "AUDIT-99150",
        timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
        formattedTime: "06:00 AM",
        transactionId: "TX-947810",
        investigationId: "CASE-947810",
        riskScore: 22,
        riskFactors: ["Low Risk Profile"],
        aiRecommendation: "APPROVE",
        humanDecision: "APPROVE",
        approvedBy: "System Rule Auto-Approve",
        previousStatus: "NEW_CHECKOUT",
        newStatus: "COMPLETED",
        reason: "Automated rule pass (Risk Score < 30)",
        actionSource: "SYSTEM",
      },
    ];
  }

  private saveLogs(): void {
    try {
      localStorage.setItem(AuditLoggerService.STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // In-memory fallback
    }
  }

  public getAuditEvents(): SentinelAuditEvent[] {
    return [...this.logs];
  }

  public logEvent(event: Omit<SentinelAuditEvent, "id" | "timestamp" | "formattedTime">): SentinelAuditEvent {
    const now = new Date();
    const newEntry: SentinelAuditEvent = {
      ...event,
      id: `AUDIT-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Prepend to maintain reverse chronological order (newest first)
    this.logs.unshift(newEntry);
    this.saveLogs();

    // Asynchronously dispatch real backend audit record to PostgreSQL
    api.postSentinelAuditEvent({
      transactionId: event.transactionId,
      merchantId: "MERCHANT-003",
      actor: event.approvedBy || "MERCHANT_USER",
      action: event.newStatus || event.humanDecision || "SENTINEL_ACTION",
      riskScore: event.riskScore || 50,
      riskLevel: event.riskScore >= 90 ? "CRITICAL" : event.riskScore >= 75 ? "HIGH" : event.riskScore >= 50 ? "MEDIUM" : "LOW",
      decision: event.humanDecision === "HOLD" ? "MANUAL_REVIEW" : event.humanDecision || "APPROVE",
      reasons: event.riskFactors || [event.reason],
      metadata: {
        investigationId: event.investigationId,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        actionSource: event.actionSource,
        reason: event.reason,
      },
      timestamp: now.toISOString(),
    }).catch((err) => console.warn("Failed to persist backend audit event:", err));

    return newEntry;
  }

  public exportLogsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const auditLoggerService = new AuditLoggerService();
