import { PolicyDecision, RiskFusionScore, RiskSignal, RecommendationResult } from "../types/sentinel.types";

export class RecommendationService {
  /**
   * Generates natural language AI explanations and operator mitigation steps based on policy decisions.
   */
  public static generate(decision: PolicyDecision, fusion: RiskFusionScore, signals: RiskSignal[]): RecommendationResult {
    const { action, reason } = decision;
    const { fusedScore, primaryRiskVectors } = fusion;

    let actionSummary = "";
    let explanation = "";
    let operatorMitigationSteps: string[] = [];

    switch (action) {
      case "BLOCK":
        actionSummary = "Immediate Transaction Interception Executed";
        explanation = `Sentinel AI automatically blocked this transaction (Risk Score: ${fusedScore}/100). Threat vectors detected: ${primaryRiskVectors.join(", ")}. ${reason}.`;
        operatorMitigationSteps = [
          "Issue automated refund or void pre-authorization hold to prevent chargeback dispute",
          "Blacklist IP address and device fingerprint in Risk Rules Center",
          "Notify merchant compliance team of potential velocity or card testing attack",
          "Log immutable incident entry in Sentinel Audit Trail",
        ];
        break;

      case "MANUAL_REVIEW":
        actionSummary = "Placed on Priority Operator Hold";
        explanation = `Sentinel AI flagged this payment for manual investigation (Risk Score: ${fusedScore}/100). Key concerns: ${primaryRiskVectors.join(", ")}. ${reason}.`;
        operatorMitigationSteps = [
          "Verify customer identity and phone confirmation",
          "Check order shipping address against billing card country",
          "Review past 30-day transaction velocity for this email domain",
          "Approve or override decision within 2 hours to avoid settlement delay",
        ];
        break;

      case "REQUIRE_3DS":
        actionSummary = "Step-Up Authentication Challenge Issued";
        explanation = `Sentinel AI triggered 3D-Secure 2.0 biometric/OTP verification (Risk Score: ${fusedScore}/100). Key triggers: ${primaryRiskVectors.join(", ")}. ${reason}.`;
        operatorMitigationSteps = [
          "Monitor 3DS challenge completion status from payment gateway",
          "If 3DS succeeds, liability shifts to card issuing bank automatically",
          "If 3DS fails, payment is automatically declined",
        ];
        break;

      case "APPROVE":
      default:
        actionSummary = "Automated Settlement Approved";
        explanation = `Sentinel AI verified this transaction as low risk (Risk Score: ${fusedScore}/100). Clean velocity and trusted device parameters observed.`;
        operatorMitigationSteps = [
          "Proceed with standard order fulfillment and settlement",
          "Monitor post-settlement delivery confirmation",
        ];
        break;
    }

    return {
      actionSummary,
      explanation,
      operatorMitigationSteps,
      suggestedAction: action,
    };
  }
}
