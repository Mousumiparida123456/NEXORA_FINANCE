import { TransactionEvaluationSchema, TransactionEvaluationInput } from "../schemas/sentinel.schema";
import { FeatureEngineeringService } from "./featureEngineering.service";
import { VelocityService } from "./velocityService";
import { RiskModelService } from "../models/riskModel.service";
import { RiskFusionService } from "./riskFusion.service";
import { PolicyEngineService } from "./policyEngine.service";
import { RecommendationService } from "./recommendation.service";
import { AuditStorageService } from "./auditStorage.service";
import { SentinelEvaluationResult, DecisionRecord } from "../types/sentinel.types";

export class SentinelPipelineService {
  /**
   * Evaluates a transaction through the complete 7-stage Sentinel Risk Pipeline asynchronously.
   */
  public static async evaluate(rawPayload: unknown): Promise<SentinelEvaluationResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 1. Zod Contract Validation (Step 1C)
    const validatedInput: TransactionEvaluationInput = TransactionEvaluationSchema.parse(rawPayload);

    // 2. STEP 1J — Atomic Redis Velocity Counter Increment
    const velocityMetrics = await VelocityService.recordAndGetVelocity(
      validatedInput.customerId,
      validatedInput.ipAddress,
      validatedInput.deviceId
    );

    // 3. Feature Engineering — 13 Risk Signals (Step 1D & 1J)
    const { signals, vector } = FeatureEngineeringService.extractFeatures(validatedInput as any, velocityMetrics);

    // 4. ML Risk Model Scoring (Step 1E)
    const modelResult = RiskModelService.predict(vector);

    // 5. Risk Fusion Engine (Step 1F)
    const fusionScore = RiskFusionService.fuse(signals, modelResult);

    // 6. Policy Engine Decision (Step 1G)
    const decision = PolicyEngineService.evaluate(fusionScore, signals);

    // 7. AI Explanation & Mitigation Recommendation
    const recommendation = RecommendationService.generate(decision, fusionScore, signals);

    // 8. STEP 1H — Construct Standardized Decision Record
    const decisionRecord: DecisionRecord = {
      transactionId: validatedInput.transactionId,
      merchantId: validatedInput.merchantId,
      riskScore: fusionScore.fusedScore,
      riskLevel: fusionScore.riskLevel,
      modelVersion: modelResult.modelVersion,
      policyVersion: PolicyEngineService.getVersion(),
      decision: decision.action,
      reasons: fusionScore.primaryRiskVectors.length > 0 ? fusionScore.primaryRiskVectors : [decision.reason],
      requiresHumanReview: decision.requiresHumanReview,
      requiresMFA: decision.requiresMFA,
      timestamp,
    };

    // 9. STEP 1I — Persist Real Audit Log Record
    const auditTrailRecord = await AuditStorageService.logEvent(decisionRecord, {
      signalsCount: signals.length,
      fraudProbability: modelResult.fraudProbability,
      recommendationSummary: recommendation.actionSummary,
      velocityEngine: velocityMetrics.storageEngine,
      velocitySummary: velocityMetrics.summaryText,
    });

    const executionTimeMs = Date.now() - startTime;

    return {
      evaluationId: auditTrailRecord.auditId,
      timestamp,
      merchantId: validatedInput.merchantId,
      transactionId: validatedInput.transactionId,
      amount: validatedInput.amount,
      currency: validatedInput.currency,
      signals,
      modelResult,
      fusionScore,
      decision,
      decisionRecord,
      recommendation,
      auditTrailRecord,
      executionTimeMs,
    };
  }
}
