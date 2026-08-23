export type RiskVectorType = "Fraud" | "Return" | "Chargeback" | "Abuse";

export interface RiskEvaluationRequest {
  transactionId: string;
  amount: number;
  customerEmail: string;
  ipAddress: string;
  billingCountry: string;
  ipCountry: string;
  returnHistoryCount: number;
  priorDisputeCount: number;
  promoCodeUses: number;
}

export interface RiskVectorBreakdown {
  vector: RiskVectorType;
  score: number; // 0-100
  level: "Low" | "Medium" | "High" | "Critical";
  signals: string[];
}

export interface RiskEvaluationResult {
  transactionId: string;
  compositeRiskScore: number; // 0-100
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  primaryVector: RiskVectorType;
  vectorBreakdowns: RiskVectorBreakdown[];
  evaluatedAt: string;
}

export class SentinelRiskEngine {
  public evaluateRisk(req: RiskEvaluationRequest): RiskEvaluationResult {
    const breakdowns: RiskVectorBreakdown[] = [];

    // 1. Fraud Risk Vector Evaluation
    const fraudSignals: string[] = [];
    let fraudScore = 20;
    if (req.billingCountry !== req.ipCountry) {
      fraudScore += 45;
      fraudSignals.push(`Geolocation mismatch: Billing (${req.billingCountry}) vs IP (${req.ipCountry})`);
    }
    if (req.amount > 2000) {
      fraudScore += 25;
      fraudSignals.push(`High transaction value threshold exceeded ($${req.amount})`);
    }
    breakdowns.push({
      vector: "Fraud",
      score: Math.min(100, fraudScore),
      level: fraudScore >= 80 ? "Critical" : fraudScore >= 60 ? "High" : "Low",
      signals: fraudSignals,
    });

    // 2. Return Risk Vector Evaluation
    const returnSignals: string[] = [];
    let returnScore = 15;
    if (req.returnHistoryCount >= 4) {
      returnScore += 65;
      returnSignals.push(`Serial return behavior: ${req.returnHistoryCount} high-value returns past 30 days`);
    }
    breakdowns.push({
      vector: "Return",
      score: Math.min(100, returnScore),
      level: returnScore >= 75 ? "High" : "Low",
      signals: returnSignals,
    });

    // 3. Chargeback Risk Vector Evaluation
    const chargebackSignals: string[] = [];
    let chargebackScore = 10;
    if (req.priorDisputeCount > 0) {
      chargebackScore += 70;
      chargebackSignals.push(`Prior dispute history: ${req.priorDisputeCount} friendly fraud claims reported`);
    }
    breakdowns.push({
      vector: "Chargeback",
      score: Math.min(100, chargebackScore),
      level: chargebackScore >= 75 ? "High" : "Low",
      signals: chargebackSignals,
    });

    // 4. Abuse Risk Vector Evaluation
    const abuseSignals: string[] = [];
    let abuseScore = 10;
    if (req.promoCodeUses > 3) {
      abuseScore += 65;
      abuseSignals.push(`Promo code harvesting: ${req.promoCodeUses} account creations from same IP`);
    }
    breakdowns.push({
      vector: "Abuse",
      score: Math.min(100, abuseScore),
      level: abuseScore >= 70 ? "High" : "Low",
      signals: abuseSignals,
    });

    // Find highest vector score
    const highestVector = breakdowns.reduce((max, b) => (b.score > max.score ? b : max), breakdowns[0]);
    const compositeScore = Math.max(...breakdowns.map((b) => b.score));

    return {
      transactionId: req.transactionId,
      compositeRiskScore: compositeScore,
      riskLevel: compositeScore >= 90 ? "Critical" : compositeScore >= 75 ? "High" : compositeScore >= 50 ? "Medium" : "Low",
      primaryVector: highestVector.vector,
      vectorBreakdowns: breakdowns,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const sentinelRiskEngine = new SentinelRiskEngine();
