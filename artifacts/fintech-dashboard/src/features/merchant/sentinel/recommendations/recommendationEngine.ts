import { AIInvestigationReport } from "../ai/aiInvestigation";

export type RecommendedActionType =
  | "BLOCK_AND_REFUND"
  | "REQUIRE_3DS"
  | "HOLD_FOR_HUMAN_AUDIT"
  | "APPROVE_OVERRIDE"
  | "REQUEST_ID_VERIFICATION";

export interface AIRecommendation {
  recommendationId: string;
  transactionId: string;
  recommendedAction: RecommendedActionType;
  confidenceScore: number; // 0-100
  rationale: string;
  mitigationImpact: string;
}

export class RecommendationEngine {
  public generateRecommendation(report: AIInvestigationReport): AIRecommendation {
    let action: RecommendedActionType = "HOLD_FOR_HUMAN_AUDIT";
    let rationale = "Elevated risk score requires human operator triage.";
    let impact = "Prevents potential dispute fee ($35.00) and loss of merchandise.";

    if (report.riskScore >= 90) {
      action = "BLOCK_AND_REFUND";
      rationale = `Critical risk score (${report.riskScore}/100) with IP mismatch & stolen BIN match. High probability of fraudulent dispute.`;
      impact = `Protects 100% of order value and avoids chargeback penalty.`;
    } else if (report.telemetryChecks.ipReputation === "PROXY_VPN") {
      action = "REQUIRE_3DS";
      rationale = "VPN/Proxy usage detected. Require 3D-Secure 2.0 biometric verification before capture.";
      impact = "Shifts fraud liability to card issuing bank.";
    }

    return {
      recommendationId: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionId: report.transactionId,
      recommendedAction: action,
      confidenceScore: Math.round(report.riskScore * 0.95),
      rationale,
      mitigationImpact: impact,
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
