export type PolicyAction = "APPROVE" | "REQUIRE_3DS" | "MANUAL_REVIEW" | "BLOCK";

export type RiskCategory = "safe" | "low" | "medium" | "high" | "critical";

export interface TransactionPayload {
  transactionId?: string;
  merchantId?: string;
  customerId?: string;
  amount: number;
  currency?: string;
  cardCountry?: string;
  ipAddress?: string;
  ipCountry?: string;
  deviceFingerprint?: string;
  deviceTrustScore?: number; // 0 - 100
  customerEmail?: string;
  accountAgeDays?: number;
  velocityLast24h?: number;
  pastChargebackCount?: number;
  category?: string;
  timestamp?: string;
}

export interface RiskSignal {
  id: string;
  name: string;
  category: "velocity" | "device" | "geo" | "amount" | "reputation" | "behavior";
  score: number; // 0 - 100
  severity: "low" | "medium" | "high" | "critical";
  details: string;
  weight: number;
}

export interface FeatureVector {
  amountNormalized: number;
  velocityScore: number;
  deviceRiskScore: number;
  geoDistanceScore: number;
  cardMismatchFlag: number;
  accountAgeScore: number;
  reputationRiskScore: number;
  categoryRiskScore: number;
  timeOfDayRiskScore: number;
  emailDomainTrustScore: number;
  microChargeFlag: number;
  pastChargebackFlag: number;
  behavioralAnomalyScore: number;
}

export interface RiskModelResult {
  modelName: string;
  modelVersion: string;
  fraudProbability: number; // 0.0 to 1.0
  confidenceScore: number; // 0.0 to 1.0
  keyFactors: Array<{ factor: string; contribution: number }>;
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
