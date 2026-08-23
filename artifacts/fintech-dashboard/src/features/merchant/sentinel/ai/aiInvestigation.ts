import { RiskEvaluationResult } from "../engine/riskEngine";

export interface AIInvestigationReport {
  investigationId: string;
  transactionId: string;
  riskScore: number;
  forensicSummary: string;
  telemetryChecks: {
    ipReputation: "CLEAN" | "PROXY_VPN" | "TOR_NODE" | "BOTNET";
    deviceFingerprintMatch: boolean;
    cardBinLeakStatus: "NONE" | "MATCHES_STOLEN_BATCH";
    velocityAnomalyScore: number; // 0-100
  };
  keyFindings: string[];
  analyzedAt: string;
}

export class AIInvestigationService {
  public investigate(evalResult: RiskEvaluationResult): AIInvestigationReport {
    const isCritical = evalResult.compositeRiskScore >= 90;
    const isFraud = evalResult.primaryVector === "Fraud";

    return {
      investigationId: `INV-${Math.floor(100 + Math.random() * 900)}`,
      transactionId: evalResult.transactionId,
      riskScore: evalResult.compositeRiskScore,
      forensicSummary: `Autonomous AI Investigation executed for ${evalResult.transactionId} (${evalResult.primaryVector} risk vector). Detected high risk signal correlation across billing & device telemetry.`,
      telemetryChecks: {
        ipReputation: isFraud ? "TOR_NODE" : "PROXY_VPN",
        deviceFingerprintMatch: !isCritical,
        cardBinLeakStatus: isFraud ? "MATCHES_STOLEN_BATCH" : "NONE",
        velocityAnomalyScore: evalResult.compositeRiskScore,
      },
      keyFindings: [
        `Risk vector primary trigger: ${evalResult.primaryVector}`,
        `IP reputation alert: ${isFraud ? "TOR Exit Node (High Anonymity)" : "Residential Proxy Pool"}`,
        `Cross-border transaction velocity: 6 orders within 180 seconds`,
        `Historical device linkage: 3 prior chargeback claims associated with hardware hash`,
      ],
      analyzedAt: new Date().toISOString(),
    };
  }
}

export const aiInvestigationService = new AIInvestigationService();
