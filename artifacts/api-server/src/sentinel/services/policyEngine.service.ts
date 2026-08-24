import { RiskFusionScore, RiskSignal, PolicyDecision, PolicyAction } from "../types/sentinel.types";

export class PolicyEngineService {
  /**
   * Evaluates fused risk scores and hard rule triggers to output final policy decision.
   */
  public static evaluate(fusion: RiskFusionScore, signals: RiskSignal[]): PolicyDecision {
    const { fusedScore, riskCategory } = fusion;

    // Check for hard blocking rules first
    const criticalSignal = signals.find((s) => s.score >= 90);
    if (criticalSignal) {
      return {
        action: "BLOCK",
        reason: `Hard policy block triggered by ${criticalSignal.name} (${criticalSignal.details})`,
        ruleTriggered: criticalSignal.id,
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "critical",
        confidence: 0.96,
      };
    }

    // High Risk Threshold: BLOCK or MANUAL_REVIEW
    if (fusedScore >= 75) {
      return {
        action: "BLOCK",
        reason: `High composite threat score (${fusedScore}/100) exceeded safety threshold`,
        ruleTriggered: "RULE-COMPOSITE-BLOCK",
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "critical",
        confidence: 0.92,
      };
    }

    // Medium-High Risk Threshold: MANUAL_REVIEW
    if (fusedScore >= 50) {
      return {
        action: "MANUAL_REVIEW",
        reason: `Elevated threat score (${fusedScore}/100) requires operator verification`,
        ruleTriggered: "RULE-REVIEW-THRESHOLD",
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "high",
        confidence: 0.88,
      };
    }

    // Medium Risk Threshold: REQUIRE_3DS
    if (fusedScore >= 30) {
      return {
        action: "REQUIRE_3DS",
        reason: `Moderate risk score (${fusedScore}/100) triggers 3D-Secure 2.0 challenge`,
        ruleTriggered: "RULE-STEPUP-3DS",
        requiresHumanReview: false,
        requiresMFA: true,
        riskCategory: "medium",
        confidence: 0.95,
      };
    }

    // Low / Safe Risk Threshold: APPROVE
    return {
      action: "APPROVE",
      reason: `Low risk score (${fusedScore}/100) verified within clean velocity bounds`,
      ruleTriggered: "RULE-AUTO-PASS",
      requiresHumanReview: false,
      requiresMFA: false,
      riskCategory: "safe",
      confidence: 0.98,
    };
  }
}
