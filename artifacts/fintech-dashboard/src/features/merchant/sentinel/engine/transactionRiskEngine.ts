export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TransactionFeatureInput {
  transactionId: string;
  amount: number;
  velocityPerHour: number;
  failedAttempts: number;
  customerHistoryCount: number;
  isNewCustomer: boolean;
  isNewDevice: boolean;
  isUnusualAmount: boolean;
  isUnusualTime: boolean;
  returnHistoryCount: number;
  chargebackHistoryCount: number;
  transactionVelocity24h: number;
}

export interface RiskFactorContribution {
  name: string;
  contribution: number;
  description: string;
}

export interface RiskEvaluationOutput {
  transactionId: string;
  riskScore: number; // Bounded 0 - 100
  level: RiskLevel;
  factors: RiskFactorContribution[];
  recommendedAction: "AUTO_APPROVE" | "REQUIRE_3DS" | "MANUAL_REVIEW" | "BLOCK_AND_REFUND";
  explanationSummary: string;
  evaluatedAt: string;
}

export interface RiskEngineConfig {
  chargebackWeight: number; // Pts per chargeback (default: 30)
  maxChargebackScore: number; // Cap (default: 60)
  failedAttemptWeight: number; // Pts per failed attempt (default: 12)
  maxFailedAttemptScore: number; // Cap (default: 30)
  velocity1hWeight: number; // Pts per attempt > 2 (default: 8)
  maxVelocity1hScore: number; // Cap (default: 25)
  unusualAmountScore: number; // Fixed pts (default: 20)
  newDeviceScore: number; // Fixed pts (default: 10)
  newCustomerScore: number; // Fixed pts (default: 8)
  unusualTimeScore: number; // Fixed pts (default: 10)
  returnHistoryWeight: number; // Pts per return (default: 8)
  maxReturnHistoryScore: number; // Cap (default: 24)
  highAmountThreshold: number; // Dollar value (default: 5000)
  highAmountScore: number; // Fixed pts (default: 15)
}

export const DEFAULT_RISK_ENGINE_CONFIG: RiskEngineConfig = {
  chargebackWeight: 30,
  maxChargebackScore: 60,
  failedAttemptWeight: 12,
  maxFailedAttemptScore: 30,
  velocity1hWeight: 8,
  maxVelocity1hScore: 25,
  unusualAmountScore: 20,
  newDeviceScore: 10,
  newCustomerScore: 8,
  unusualTimeScore: 10,
  returnHistoryWeight: 8,
  maxReturnHistoryScore: 24,
  highAmountThreshold: 5000,
  highAmountScore: 15,
};

export class DeterministicRiskEngine {
  private config: RiskEngineConfig;

  constructor(customConfig?: Partial<RiskEngineConfig>) {
    this.config = { ...DEFAULT_RISK_ENGINE_CONFIG, ...customConfig };
  }

  /**
   * Deterministically evaluates a transaction's features and returns an explainable risk score (0-100).
   */
  public evaluateTransaction(input: TransactionFeatureInput): RiskEvaluationOutput {
    const factors: RiskFactorContribution[] = [];
    let rawScore = 0;

    // 1. Chargeback History Assessment
    if (input.chargebackHistoryCount > 0) {
      const cbScore = Math.min(
        this.config.maxChargebackScore,
        input.chargebackHistoryCount * this.config.chargebackWeight
      );
      rawScore += cbScore;
      factors.push({
        name: "Prior Chargeback History",
        contribution: cbScore,
        description: `Customer has ${input.chargebackHistoryCount} past chargeback dispute(s) on record`,
      });
    }

    // 2. Failed Payment Attempts Assessment
    if (input.failedAttempts > 0) {
      const failedScore = Math.min(
        this.config.maxFailedAttemptScore,
        input.failedAttempts * this.config.failedAttemptWeight
      );
      rawScore += failedScore;
      factors.push({
        name: "Multiple Failed Attempts",
        contribution: failedScore,
        description: `${input.failedAttempts} failed card authorization attempt(s) prior to checkout`,
      });
    }

    // 3. Hourly Transaction Velocity Assessment
    if (input.velocityPerHour > 2) {
      const excessVelocity = input.velocityPerHour - 2;
      const velocityScore = Math.min(
        this.config.maxVelocity1hScore,
        excessVelocity * this.config.velocity1hWeight
      );
      rawScore += velocityScore;
      factors.push({
        name: "High Transaction Velocity",
        contribution: velocityScore,
        description: `${input.velocityPerHour} payment attempts initiated within 60 minutes`,
      });
    }

    // 4. Unusual Amount Assessment
    if (input.isUnusualAmount) {
      rawScore += this.config.unusualAmountScore;
      factors.push({
        name: "Unusual Transaction Amount",
        contribution: this.config.unusualAmountScore,
        description: `Amount ($${input.amount.toFixed(2)}) significantly exceeds customer's historical average`,
      });
    }

    // 5. Absolute High Order Value Assessment
    if (input.amount >= this.config.highAmountThreshold) {
      rawScore += this.config.highAmountScore;
      factors.push({
        name: "High Value Exposure Threshold",
        contribution: this.config.highAmountScore,
        description: `Order value ($${input.amount.toFixed(2)}) exceeds high-risk dollar cap ($${this.config.highAmountThreshold})`,
      });
    }

    // 6. New Device Indicator
    if (input.isNewDevice) {
      rawScore += this.config.newDeviceScore;
      factors.push({
        name: "Unrecognized Device Hardware",
        contribution: this.config.newDeviceScore,
        description: "Transaction initiated from a previously unseen device fingerprint",
      });
    }

    // 7. New Customer Indicator
    if (input.isNewCustomer) {
      rawScore += this.config.newCustomerScore;
      factors.push({
        name: "New Customer Profile",
        contribution: this.config.newCustomerScore,
        description: `Account has 0 prior completed purchases on platform`,
      });
    }

    // 8. Unusual Transaction Time (Off-Peak Hours)
    if (input.isUnusualTime) {
      rawScore += this.config.unusualTimeScore;
      factors.push({
        name: "Unusual Transaction Time",
        contribution: this.config.unusualTimeScore,
        description: "Payment initiated during local off-peak hours (1:00 AM - 5:00 AM)",
      });
    }

    // 9. Serial Return History Assessment
    if (input.returnHistoryCount >= 2) {
      const returnScore = Math.min(
        this.config.maxReturnHistoryScore,
        input.returnHistoryCount * this.config.returnHistoryWeight
      );
      rawScore += returnScore;
      factors.push({
        name: "Elevated Return Rate",
        contribution: returnScore,
        description: `Customer has initiated ${input.returnHistoryCount} product return(s) in past orders`,
      });
    }

    // Cap the risk score at 100
    const riskScore = Math.min(100, Math.round(rawScore));

    // Classify Risk Level according to explicit bounds
    let level: RiskLevel = "LOW";
    if (riskScore >= 86) {
      level = "CRITICAL";
    } else if (riskScore >= 71) {
      level = "HIGH";
    } else if (riskScore >= 31) {
      level = "MEDIUM";
    } else {
      level = "LOW";
    }

    // Determine Recommended Action
    let recommendedAction: "AUTO_APPROVE" | "REQUIRE_3DS" | "MANUAL_REVIEW" | "BLOCK_AND_REFUND";
    switch (level) {
      case "CRITICAL":
        recommendedAction = "BLOCK_AND_REFUND";
        break;
      case "HIGH":
        recommendedAction = "MANUAL_REVIEW";
        break;
      case "MEDIUM":
        recommendedAction = "REQUIRE_3DS";
        break;
      default:
        recommendedAction = "AUTO_APPROVE";
        break;
    }

    // Build human-readable narrative explanation
    const topFactors = [...factors].sort((a, b) => b.contribution - a.contribution).slice(0, 3);
    const explanationSummary =
      topFactors.length > 0
        ? `Evaluated as ${level} risk (Score ${riskScore}/100) primarily driven by: ${topFactors.map((f) => f.name).join(", ")}.`
        : `Evaluated as LOW risk (Score ${riskScore}/100). No significant risk factors identified.`;

    return {
      transactionId: input.transactionId,
      riskScore,
      level,
      factors,
      recommendedAction,
      explanationSummary,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const deterministicRiskEngine = new DeterministicRiskEngine();
