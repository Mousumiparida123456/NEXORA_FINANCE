import { RiskSignal, RiskModelResult, RiskFusionScore } from "../types/sentinel.types";

export class RiskFusionService {
  /**
   * STEP 1F — Risk Fusion Engine
   * Fuses ML probability score with rule violation add-ons, behavioral anomaly add-ons, and device risk add-ons.
   */
  public static fuse(signals: RiskSignal[], modelResult: RiskModelResult): RiskFusionScore {
    // 1. Base ML Score (0 - 100)
    const mlScoreComponent = Math.round(modelResult.fraudProbability * 100);

    // 2. Rule Violations Add-on
    const severeRules = signals.filter((s) => s.normalizedScore >= 0.60);
    const ruleViolationsComponent = Math.min(15, severeRules.length * 5);

    // 3. Behavioral Anomaly Add-on
    const behSignal = signals.find((s) => s.name === "behavioralDeviation" || s.name === "paymentVelocity");
    const behavioralAnomalyComponent = behSignal ? Math.round(behSignal.normalizedScore * 10) : 0;

    // 4. Device Risk Add-on
    const devSignal = signals.find((s) => s.name === "deviceRisk");
    const deviceRiskComponent = devSignal ? Math.round(devSignal.normalizedScore * 8) : 0;

    // 5. Final Fused Score (Clamped to 100 max)
    const fusedScore = Math.min(
      100,
      mlScoreComponent + ruleViolationsComponent + behavioralAnomalyComponent + deviceRiskComponent
    );

    // STEP 1F Risk Level Tiering
    let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE" = "SAFE";
    if (fusedScore >= 91) riskLevel = "CRITICAL";
    else if (fusedScore >= 81) riskLevel = "HIGH";
    else if (fusedScore >= 61) riskLevel = "MEDIUM";
    else if (fusedScore >= 31) riskLevel = "LOW";
    else riskLevel = "SAFE";

    const topRiskSignals = [...signals]
      .filter((s) => s.normalizedScore >= 0.40)
      .sort((a, b) => b.normalizedScore - a.normalizedScore)
      .map((s) => s.details);

    return {
      fusedScore,
      mlScoreComponent,
      ruleViolationsComponent,
      behavioralAnomalyComponent,
      deviceRiskComponent,
      riskLevel,
      primaryRiskVectors: topRiskSignals.length > 0 ? topRiskSignals : ["Clean transaction baseline"],
    };
  }
}
