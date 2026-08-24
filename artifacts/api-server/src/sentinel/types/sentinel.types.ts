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
  mlScoreComponent: number;
  ruleViolationsComponent: number;
  behavioralAnomalyComponent: number;
  deviceRiskComponent: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
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

/**
 * STEP 1H — Decision Record Interface
 * The standardized decision object consumed by frontend and audit trail.
 */
export interface DecisionRecord {
  transactionId: string;
  merchantId: string;
  riskScore: number; // Fused score (0 - 100)
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
  modelVersion: string;
  policyVersion: string;
  decision: PolicyAction;
  reasons: string[];
  requiresHumanReview: boolean;
  requiresMFA: boolean;
  timestamp: string;
}

/**
 * STEP 1I — Audit Trail Record Interface
 */
export interface AuditTrailRecord {
  auditId: string;
  transactionId: string;
  merchantId: string;
  actor: string;
  action: PolicyAction;
  riskScore: number;
  riskLevel: string;
  decision: string;
  reasons: string[];
  modelVersion: string;
  policyVersion: string;
  timestamp: string;
  metadata: Record<string, any>;
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
  decisionRecord: DecisionRecord;
  recommendation: RecommendationResult;
  auditTrailRecord?: AuditTrailRecord;
  executionTimeMs: number;
}
