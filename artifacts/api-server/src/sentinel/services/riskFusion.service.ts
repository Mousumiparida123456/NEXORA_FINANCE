import { RiskSignal, RiskModelResult, RiskFusionScore, RiskCategory } from "../types/sentinel.types";

export class RiskFusionService {
  /**
   * Fuses ML model fraud probability, deterministic rule scores, and behavioral signals.
   */
  public static fuse(signals: RiskSignal[], modelResult: RiskModelResult): RiskFusionScore {
    const modelScore = Math.round(modelResult.fraudProbability * 100);

    // Rule Score: average of top 3 severe signals
    const sortedSignals = [...signals].sort((a, b) => b.score - a.score);
    const topSignals = sortedSignals.slice(0, 3);
    const ruleScore = Math.round(
      topSignals.reduce((acc, sig) => acc + sig.score * sig.weight, 0) /
        topSignals.reduce((acc, sig) => acc + sig.weight, 0)
    );

    // Behavioral Score from velocity and device signals
    const behavioralSignals = signals.filter((s) => s.category === "behavior" || s.category === "velocity");
    const behavioralScore =
      behavioralSignals.length > 0
        ? Math.round(behavioralSignals.reduce((a, b) => a + b.score, 0) / behavioralSignals.length)
        : 10;

    // Fused Composite Score (60% Rules, 30% ML Model, 10% Behavioral)
    const fusedScore = Math.min(100, Math.round(ruleScore * 0.6 + modelScore * 0.3 + behavioralScore * 0.1));

    let riskCategory: RiskCategory = "safe";
    if (fusedScore >= 80) riskCategory = "critical";
    else if (fusedScore >= 60) riskCategory = "high";
    else if (fusedScore >= 35) riskCategory = "medium";
    else if (fusedScore >= 15) riskCategory = "low";

    const primaryRiskVectors = topSignals.filter((s) => s.score >= 40).map((s) => s.name);

    return {
      fusedScore,
      modelScore,
      ruleScore,
      behavioralScore,
      riskCategory,
      primaryRiskVectors: primaryRiskVectors.length > 0 ? primaryRiskVectors : ["Clean Behavioral Baseline"],
    };
  }
}
