import { RiskFusionScore, RiskSignal, PolicyDecision } from "../types/sentinel.types";

export class PolicyEngineService {
  private static readonly POLICY_VERSION = "v2.0-policy";

  /**
   * STEP 1G — Policy Engine
   * Evaluates fused risk score and hard policy rules to execute business policy decision.
   */
  public static evaluate(fusion: RiskFusionScore, signals: RiskSignal[]): PolicyDecision {
    const { fusedScore, riskLevel } = fusion;

    // Helper signal lookups
    const cbSignal = signals.find((s) => s.name === "chargebackHistory");
    const ipSignal = signals.find((s) => s.name === "ipReputation");
    const failedAttemptsSignal = signals.find((s) => s.name === "failedPaymentAttempts");

    const cbHigh = (cbSignal?.normalizedScore ?? 0) >= 0.50;
    const ipProxyHigh = (ipSignal?.normalizedScore ?? 0) >= 0.60;
    const failedAttemptsHigh = (failedAttemptsSignal?.normalizedScore ?? 0) >= 0.60;

    // Hard Policy Rule 1: IF riskScore > 90 AND chargebackHistory = HIGH THEN BLOCK
    if (fusedScore > 90 && cbHigh) {
      return {
        action: "BLOCK",
        reason: "Hard policy override: Critical risk score (>90) combined with historical chargeback record",
        ruleTriggered: "POLICY-HARD-BLOCK-CHARGEBACK",
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "critical",
        confidence: 0.99,
      };
    }

    // Hard Policy Rule 2: IF riskScore > 70 AND ipReputation = PROXY_VPN THEN REQUIRE_3DS
    if (fusedScore > 70 && ipProxyHigh) {
      return {
        action: "REQUIRE_3DS",
        reason: "Hard policy override: Elevated risk score (>70) connected via proxy/VPN IP connection",
        ruleTriggered: "POLICY-HARD-3DS-PROXY",
        requiresHumanReview: false,
        requiresMFA: true,
        riskCategory: "high",
        confidence: 0.95,
      };
    }

    // Hard Policy Rule 3: Multiple failed payment attempts -> MANUAL_REVIEW
    if (failedAttemptsHigh && fusedScore >= 60) {
      return {
        action: "MANUAL_REVIEW",
        reason: "Hard policy override: Card testing pattern detected with repeated failed payment attempts",
        ruleTriggered: "POLICY-HARD-REVIEW-CARD-TESTING",
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "high",
        confidence: 0.92,
      };
    }

    // Score Range Mapping (STEP 1G Specification)
    // 91 - 100 → BLOCK
    if (fusedScore >= 91) {
      return {
        action: "BLOCK",
        reason: `Critical composite risk score (${fusedScore}/100) exceeded safety cutoff`,
        ruleTriggered: "POLICY-TIER-BLOCK",
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "critical",
        confidence: 0.96,
      };
    }

    // 81 - 90 → HUMAN_REVIEW (MANUAL_REVIEW)
    if (fusedScore >= 81) {
      return {
        action: "MANUAL_REVIEW",
        reason: `High risk score (${fusedScore}/100) requires human fraud analyst review`,
        ruleTriggered: "POLICY-TIER-HUMAN-REVIEW",
        requiresHumanReview: true,
        requiresMFA: false,
        riskCategory: "high",
        confidence: 0.90,
      };
    }

    // 61 - 80 → REQUIRE_3DS
    if (fusedScore >= 61) {
      return {
        action: "REQUIRE_3DS",
        reason: `Medium-high risk score (${fusedScore}/100) requires 3D-Secure biometric/OTP challenge`,
        ruleTriggered: "POLICY-TIER-3DS-STEPUP",
        requiresHumanReview: false,
        requiresMFA: true,
        riskCategory: "medium",
        confidence: 0.94,
      };
    }

    // 31 - 60 → APPROVE (with monitor flag)
    if (fusedScore >= 31) {
      return {
        action: "APPROVE",
        reason: `Low-medium risk score (${fusedScore}/100) approved under active velocity monitoring`,
        ruleTriggered: "POLICY-TIER-APPROVE-MONITOR",
        requiresHumanReview: false,
        requiresMFA: false,
        riskCategory: "low",
        confidence: 0.95,
      };
    }

    // 0 - 30 → APPROVE
    return {
      action: "APPROVE",
      reason: `Safe clean baseline transaction (${fusedScore}/100) approved for instant settlement`,
      ruleTriggered: "POLICY-TIER-APPROVE-PASS",
      requiresHumanReview: false,
      requiresMFA: false,
      riskCategory: "safe",
      confidence: 0.99,
    };
  }

  public static getVersion(): string {
    return this.POLICY_VERSION;
  }
}
