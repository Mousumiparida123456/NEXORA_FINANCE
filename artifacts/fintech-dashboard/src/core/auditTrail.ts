export type DomainType = "PERSONAL_FINANCE" | "MERCHANT_SENTINEL";

export interface AuditEvent {
  id: string;
  timestamp: string;
  domain: DomainType;
  actor: string;
  action: string;
  category: "Fraud" | "Return" | "Chargeback" | "Abuse" | "Personal_Budget" | "System";
  details: string;
  severity: "info" | "warning" | "high" | "critical";
}

const INITIAL_AUDIT_TRAIL: AuditEvent[] = [
  {
    id: "AUD-9011",
    timestamp: "2 mins ago",
    domain: "MERCHANT_SENTINEL",
    actor: "Human Operator (admin@merchant.com)",
    action: "Human Decision: Blocked Order TXN-904812",
    category: "Fraud",
    details: "Approved AI recommendation: IP mismatch > 5,000 miles & velocity alert.",
    severity: "critical",
  },
  {
    id: "AUD-8994",
    timestamp: "10 mins ago",
    domain: "MERCHANT_SENTINEL",
    actor: "Sentinel AI Agent",
    action: "AI Investigation Completed for TXN-883910",
    category: "Return",
    details: "Serial wardrobing score 88/100. Recommended return policy hold.",
    severity: "high",
  },
  {
    id: "AUD-8820",
    timestamp: "25 mins ago",
    domain: "MERCHANT_SENTINEL",
    actor: "Sentinel Risk Engine",
    action: "Multi-Vector Risk Score Calculated: 91/100",
    category: "Chargeback",
    details: "Flagged TXN-774019 for 3 prior friendly fraud claims.",
    severity: "high",
  },
  {
    id: "AUD-7102",
    timestamp: "1 hour ago",
    domain: "PERSONAL_FINANCE",
    actor: "User (Personal)",
    action: "Budget Limit Updated",
    category: "Personal_Budget",
    details: "Increased Monthly Dining Out budget to $450.00",
    severity: "info",
  },
];

class AuditTrailService {
  private logs: AuditEvent[] = INITIAL_AUDIT_TRAIL;

  public getLogs(domain?: DomainType): AuditEvent[] {
    if (!domain) return this.logs;
    return this.logs.filter((log) => log.domain === domain);
  }

  public logEvent(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
    const newLog: AuditEvent = {
      ...event,
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: "Just now",
    };
    this.logs = [newLog, ...this.logs];
    return newLog;
  }
}

export const auditTrailService = new AuditTrailService();
