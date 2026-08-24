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
    return newEntry;
  }

  public exportLogsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const auditLoggerService = new AuditLoggerService();
