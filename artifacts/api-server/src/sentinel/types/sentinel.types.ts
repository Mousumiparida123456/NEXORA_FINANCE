export type PolicyAction = "APPROVE" | "REQUIRE_3DS" | "MANUAL_REVIEW" | "BLOCK";

export type RiskCategory = "safe" | "low" | "medium" | "high" | "critical";

export interface TransactionPayload {
  transactionId: string;
  merchantId: string;
  customerId: string;
  amount: number;
  currency: string;
  ipAddress?: string;
  country?: string;
  deviceId?: string;
  paymentMethod?: string;
  timestamp: string;

  // Extended context parameters for 13 risk signals computation:
  accountAgeDays?: number;
  velocityLast24h?: number;
  deviceTrustScore?: number; // 0 - 100
  ipReputationScore?: number; // 0 - 100
  geoDistanceKm?: number;
  merchantRiskScore?: number; // 0 - 100
  paymentMethodVelocity?: number;
  pastChargebackCount?: number;
  customerHistoryScore?: number; // 0 - 100
  unusualAmountRatio?: number;
  failedPaymentAttempts?: number;
  behavioralDeviationScore?: number; // 0 - 100
}

export interface RiskSignal {
  id: string;
  name: string;
  category: "velocity" | "device" | "geo" | "amount" | "reputation" | "behavior";
  normalizedScore: number; // 0.0 (low risk) to 1.0 (high risk)
  score: number; // 0 - 100 for visual display
  severity: "low" | "medium" | "high" | "critical";
  details: string;
  weight: number;
}

export interface FeatureVector {
  transactionAmount: number; // 0.0 - 1.0
  transactionVelocity: number; // 0.0 - 1.0
  accountAge: number; // 0.0 - 1.0
  deviceRisk: number; // 0.0 - 1.0
  ipReputation: number; // 0.0 - 1.0
  geoDistance: number; // 0.0 - 1.0
  merchantRisk: number; // 0.0 - 1.0
  paymentVelocity: number; // 0.0 - 1.0
  chargebackHistory: number; // 0.0 - 1.0
  customerHistory: number; // 0.0 - 1.0
  unusualAmount: number; // 0.0 - 1.0
  failedPaymentAttempts: number; // 0.0 - 1.0
  behavioralDeviation: number; // 0.0 - 1.0
}

export interface RiskModelResult {
  modelName: string;
  modelVersion: string;
  fraudProbability: number; // 0.00 to 1.00
  riskTier: "Low" | "Medium" | "High" | "Critical";
  confidenceScore: number; // 0.00 to 1.00
  evaluationMetrics: {
    datasetSize: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
  };
  keyFactors: Array<{ factor: string; contribution: number; normalizedValue: number }>;
}

export interface RiskFusionScore {
  fusedScore: number; // 0 - 100
  modelScore: number;
  ruleScore: number;
  behavioralScore: number;
  riskCategory: RiskCategory;
  primaryRiskVectors: string[];
}

export interface PolicyDecision {
  action: PolicyAction;
  reason: string;
  ruleTriggered?: string;
  requiresHumanReview: boolean;
  requiresMFA: boolean;
  riskCategory: RiskCategory;
  confidence: number;
}

export interface RecommendationResult {
  actionSummary: string;
  explanation: string;
  operatorMitigationSteps: string[];
  suggestedAction: PolicyAction;
}

export interface SentinelEvaluationResult {
  evaluationId: string;
  timestamp: string;
  merchantId: string;
  transactionId: string;
  amount: number;
  currency: string;
  signals: RiskSignal[];
  modelResult: RiskModelResult;
  fusionScore: RiskFusionScore;
  decision: PolicyDecision;
  recommendation: RecommendationResult;
  executionTimeMs: number;
}
