export type NetworkNodeType = "CUSTOMER" | "DEVICE" | "PAYMENT" | "ADDRESS" | "IP" | "TRANSACTION";

export interface NetworkNode {
  id: string;
  type: NetworkNodeType;
  label: string;
  sublabel: string;
  riskScore: number; // 0 - 100
  isFlagged: boolean;
  isClusterRoot?: boolean;
  details: {
    country?: string;
    ipAddress?: string;
    firstSeen?: string;
    totalSpent?: number;
    disputeCount?: number;
    notes?: string;
  };
  x: number; // 0 - 100 % graph position
  y: number; // 0 - 100 % graph position
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: "USES_DEVICE" | "USES_CARD" | "SHIPS_TO" | "INITIATED_FROM" | "PAYMENT_FOR";
  isSuspicious: boolean;
  weight?: number;
}

export interface AbuseClusterInsight {
  clusterId: string;
  title: string;
  description: string;
  customerCount: number;
  deviceCount: number;
  paymentCount: number;
  addressCount: number;
  ipCount: number;
  totalExposureUSD: number;
  totalExposureINR: number;
  disclaimer: string;
  isDemoData: true;
}

export class AbuseNetworkService {
  /**
   * Demo Abuse Network Cluster Dataset
   * Clearly labeled as DEMO DATA ONLY to avoid unsupported claims about real fraud.
   */
  public getDemoAbuseNetwork(): {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    insights: AbuseClusterInsight;
  } {
    const nodes: NetworkNode[] = [
      // Central Shared Shipping Address
      {
        id: "NODE-ADDR-01",
        type: "ADDRESS",
        label: "742 Evergreen Terrace, Suite 4B",
        sublabel: "Shared Drop Address [DEMO]",
        riskScore: 94,
        isFlagged: true,
        isClusterRoot: true,
        details: { country: "United States", firstSeen: "2026-08-01", notes: "14 orders shipped across 7 unlinked customer emails." },
        x: 50,
        y: 48,
      },
      // Shared Device 1
      {
        id: "NODE-DEV-01",
        type: "DEVICE",
        label: "Fingerprint #FP-88219",
        sublabel: "Linux / Firefox (Incognito)",
        riskScore: 88,
        isFlagged: true,
        details: { country: "Romania (TOR Exit)", firstSeen: "2026-08-15" },
        x: 28,
        y: 28,
      },
      // Shared Device 2
      {
        id: "NODE-DEV-02",
        type: "DEVICE",
        label: "Fingerprint #FP-99041",
        sublabel: "Macintosh / Chrome Proxy",
        riskScore: 82,
        isFlagged: true,
        details: { country: "United States", firstSeen: "2026-08-18" },
        x: 72,
        y: 28,
      },
      // Shared Device 3
      {
        id: "NODE-DEV-03",
        type: "DEVICE",
        label: "Fingerprint #FP-11029",
        sublabel: "Android Emulator",
        riskScore: 76,
        isFlagged: true,
        details: { country: "Germany", firstSeen: "2026-08-20" },
        x: 50,
        y: 80,
      },
      // Shared Payment Card 1
      {
        id: "NODE-CARD-01",
        type: "PAYMENT",
        label: "Visa **** 4921",
        sublabel: "Stolen BIN #411111",
        riskScore: 96,
        isFlagged: true,
        details: { totalSpent: 4850.00, disputeCount: 2 },
        x: 18,
        y: 60,
      },
      // Shared Payment Card 2
      {
        id: "NODE-CARD-02",
        type: "PAYMENT",
        label: "Mastercard **** 8812",
        sublabel: "High Exposure BIN #541288",
        riskScore: 90,
        isFlagged: true,
        details: { totalSpent: 12500.00, disputeCount: 1 },
        x: 82,
        y: 60,
      },
      // Customers
      {
        id: "NODE-CUST-01",
        type: "CUSTOMER",
        label: "Alex Rivera",
        sublabel: "alex.r@techglobal.io",
        riskScore: 91,
        isFlagged: true,
        details: { totalSpent: 4850.00, disputeCount: 1 },
        x: 20,
        y: 40,
      },
      {
        id: "NODE-CUST-02",
        type: "CUSTOMER",
        label: "Marcus Vance",
        sublabel: "m.vance@solardynamics.net",
        riskScore: 86,
        isFlagged: true,
        details: { totalSpent: 12500.00, disputeCount: 1 },
        x: 80,
        y: 40,
      },
      {
        id: "NODE-CUST-03",
        type: "CUSTOMER",
        label: "Elena Rostova",
        sublabel: "elena.r@fintechgroup.de",
        riskScore: 78,
        isFlagged: true,
        details: { totalSpent: 3200.00 },
        x: 35,
        y: 70,
      },
      {
        id: "NODE-CUST-04",
        type: "CUSTOMER",
        label: "David Chen",
        sublabel: "dchen@apexlogistics.com",
        riskScore: 68,
        isFlagged: false,
        details: { totalSpent: 1450.00 },
        x: 65,
        y: 70,
      },
      // Shared IP Address
      {
        id: "NODE-IP-01",
        type: "IP",
        label: "185.220.101.4",
        sublabel: "TOR Commercial Proxy",
        riskScore: 92,
        isFlagged: true,
        details: { ipAddress: "185.220.101.4", country: "Romania" },
        x: 50,
        y: 18,
      },
      // Flagged Transactions
      {
        id: "NODE-TX-01",
        type: "TRANSACTION",
        label: "TX-948201",
        sublabel: "$4,850.00 (Critical)",
        riskScore: 91,
        isFlagged: true,
        details: { totalSpent: 4850.00 },
        x: 10,
        y: 50,
      },
      {
        id: "NODE-TX-02",
        type: "TRANSACTION",
        label: "TX-948195",
        sublabel: "$12,500.00 (High)",
        riskScore: 86,
        isFlagged: true,
        details: { totalSpent: 12500.00 },
        x: 90,
        y: 50,
      },
    ];

    const edges: NetworkEdge[] = [
      // Customers to Address
      { id: "E1", source: "NODE-CUST-01", target: "NODE-ADDR-01", relationship: "SHIPS_TO", isSuspicious: true },
      { id: "E2", source: "NODE-CUST-02", target: "NODE-ADDR-01", relationship: "SHIPS_TO", isSuspicious: true },
      { id: "E3", source: "NODE-CUST-03", target: "NODE-ADDR-01", relationship: "SHIPS_TO", isSuspicious: true },
      { id: "E4", source: "NODE-CUST-04", target: "NODE-ADDR-01", relationship: "SHIPS_TO", isSuspicious: false },

      // Customers to Devices
      { id: "E5", source: "NODE-CUST-01", target: "NODE-DEV-01", relationship: "USES_DEVICE", isSuspicious: true },
      { id: "E6", source: "NODE-CUST-02", target: "NODE-DEV-02", relationship: "USES_DEVICE", isSuspicious: true },
      { id: "E7", source: "NODE-CUST-03", target: "NODE-DEV-03", relationship: "USES_DEVICE", isSuspicious: true },
      { id: "E8", source: "NODE-CUST-04", target: "NODE-DEV-03", relationship: "USES_DEVICE", isSuspicious: true }, // Shared device between Elena & David!

      // Customers to Payment Cards
      { id: "E9", source: "NODE-CUST-01", target: "NODE-CARD-01", relationship: "USES_CARD", isSuspicious: true },
      { id: "E10", source: "NODE-CUST-02", target: "NODE-CARD-02", relationship: "USES_CARD", isSuspicious: true },
      { id: "E11", source: "NODE-CUST-03", target: "NODE-CARD-01", relationship: "USES_CARD", isSuspicious: true }, // Shared card between Alex & Elena!

      // IP to Devices
      { id: "E12", source: "NODE-IP-01", target: "NODE-DEV-01", relationship: "INITIATED_FROM", isSuspicious: true },
      { id: "E13", source: "NODE-IP-01", target: "NODE-DEV-02", relationship: "INITIATED_FROM", isSuspicious: true },

      // Customers to Transactions
      { id: "E14", source: "NODE-CUST-01", target: "NODE-TX-01", relationship: "PAYMENT_FOR", isSuspicious: true },
      { id: "E15", source: "NODE-CUST-02", target: "NODE-TX-02", relationship: "PAYMENT_FOR", isSuspicious: true },
    ];

    const insights: AbuseClusterInsight = {
      clusterId: "CLUSTER-EVG-8820",
      title: "Potential Coordinated Abuse Cluster Detected",
      description: "Multiple customer accounts sharing identical drop addresses, TOR exit IP nodes, and stolen payment card BINs.",
      customerCount: 7,
      deviceCount: 3,
      paymentCount: 2,
      addressCount: 1,
      ipCount: 1,
      totalExposureUSD: 22000.00,
      totalExposureINR: 284000.00,
      disclaimer: "DEMO GRAPH DATA: Node metrics & cluster correlations are synthetic demonstrations for risk investigation workflows.",
      isDemoData: true,
    };

    return { nodes, edges, insights };
  }
}

export const abuseNetworkService = new AbuseNetworkService();
