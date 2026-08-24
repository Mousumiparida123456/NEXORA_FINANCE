import { TransactionEvaluationSchema, TransactionEvaluationInput } from "../schemas/sentinel.schema";
import { FeatureEngineeringService } from "./featureEngineering.service";
import { VelocityService } from "./velocityService";
import { RiskModelService } from "../models/riskModel.service";
import { RiskFusionService } from "./riskFusion.service";
import { PolicyEngineService } from "./policyEngine.service";
import { RecommendationService } from "./recommendation.service";
import { AuditStorageService } from "./auditStorage.service";
import { SentinelEvaluationResult, DecisionRecord } from "../types/sentinel.types";
import { logger } from "../../lib/logger";

export interface PipelineOptions {
  requestId?: string;
}

export class SentinelPipelineService {
  /**
   * Evaluates a transaction through the complete 7-stage Sentinel Risk Pipeline asynchronously.
   * Enforces transaction idempotency, correlation ID logging, and audit persistence reporting.
   */
  public static async evaluate(
    rawPayload: unknown,
    options: PipelineOptions = {}
  ): Promise<SentinelEvaluationResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const requestId = options.requestId || `REQ-${Math.floor(Math.random() * 899999) + 100000}`;

    // 1. Zod Contract Validation (Step 1C & Step 1 Validation)
    const validatedInput: TransactionEvaluationInput = TransactionEvaluationSchema.parse(rawPayload);

    // 2. STEP 3 — Idempotency Verification
    // Prevent duplicate evaluation and duplicate audit records when same transactionId is submitted multiple times
    const existingDecision = await AuditStorageService.findDecisionByTransactionId(validatedInput.transactionId);
    if (existingDecision) {
      const executionTimeMs = Date.now() - startTime;
      logger.info(
        {
          requestId,
          transactionId: validatedInput.transactionId,
          merchantId: validatedInput.merchantId,
          decision: existingDecision.decisionRecord.decision,
          isIdempotent: true,
          executionTimeMs,
        },
        "⚡ [IDEMPOTENT EVALUATION RETURNED]: Transaction already evaluated"
      );

      // Re-reconstruct full evaluation result from cached decision record
      return {
        evaluationId: `AUD-CACHED-${validatedInput.transactionId}`,
        timestamp: existingDecision.decisionRecord.timestamp,
        merchantId: validatedInput.merchantId,
        transactionId: validatedInput.transactionId,
        amount: validatedInput.amount,
        currency: validatedInput.currency,
        signals: [],
        modelResult: {
          modelName: "Sentinel Risk Scoring Model",
          modelVersion: existingDecision.decisionRecord.modelVersion,
          fraudProbability: existingDecision.decisionRecord.riskScore / 100,
          riskTier: existingDecision.decisionRecord.riskLevel as any,
          topFeatures: existingDecision.decisionRecord.reasons,
          evaluationMetrics: { datasetSize: 20000, evaluationStatus: "offline_trained" },
        },
        fusionScore: {
          fusedScore: existingDecision.decisionRecord.riskScore,
          mlScoreComponent: existingDecision.decisionRecord.riskScore,
          ruleViolationsComponent: 0,
          behavioralAnomalyComponent: 0,
          deviceRiskComponent: 0,
          riskLevel: existingDecision.decisionRecord.riskLevel as any,
          primaryRiskVectors: existingDecision.decisionRecord.reasons,
        },
        decision: {
          action: existingDecision.decisionRecord.decision,
          reason: existingDecision.decisionRecord.reasons[0] || "Cached decision match",
          ruleTriggered: "IDEMPOTENT-CACHE-MATCH",
          requiresHumanReview: existingDecision.decisionRecord.requiresHumanReview,
          requiresMFA: existingDecision.decisionRecord.requiresMFA,
          riskCategory: existingDecision.decisionRecord.riskLevel.toLowerCase() as any,
          confidence: 0.99,
        },
        decisionRecord: existingDecision.decisionRecord,
        recommendation: {
          actionSummary: `Cached ${existingDecision.decisionRecord.decision} decision for transaction ${validatedInput.transactionId}`,
          mitigationSteps: ["Re-submitted transaction matched existing audit log"],
          suggestedWorkflow: existingDecision.decisionRecord.requiresHumanReview ? "MANUAL_INVESTIGATION" : "AUTO_SETTLEMENT",
        },
        auditTrailRecord: {
          auditId: `AUD-CACHED-${validatedInput.transactionId}`,
          transactionId: validatedInput.transactionId,
          merchantId: validatedInput.merchantId,
          actor: "SENTINEL_AI_ENGINE",
          action: existingDecision.decisionRecord.decision,
          riskScore: existingDecision.decisionRecord.riskScore,
          riskLevel: existingDecision.decisionRecord.riskLevel,
          decision: existingDecision.decisionRecord.decision,
          reasons: existingDecision.decisionRecord.reasons,
          modelVersion: existingDecision.decisionRecord.modelVersion,
          policyVersion: existingDecision.decisionRecord.policyVersion,
          timestamp: existingDecision.decisionRecord.timestamp,
          metadata: { isIdempotentMatch: true },
        },
        auditPersistence: existingDecision.auditPersistence,
        executionTimeMs,
      };
    }

    // 3. STEP 1J — Atomic Redis Velocity Counter Increment
    const velocityMetrics = await VelocityService.recordAndGetVelocity(
      validatedInput.customerId,
      validatedInput.ipAddress,
      validatedInput.deviceId
    );

    // 4. Feature Engineering — 13 Risk Signals (Step 1D & 1J)
    const { signals, vector } = FeatureEngineeringService.extractFeatures(validatedInput as any, velocityMetrics);

    // 5. ML Risk Model Scoring (Step 1E & Step 8 Model Naming)
    const modelResult = RiskModelService.predict(vector);

    // 6. Risk Fusion Engine (Step 1F)
    const fusionScore = RiskFusionService.fuse(signals, modelResult);

    // 7. Policy Engine Decision (Step 1G)
    const decision = PolicyEngineService.evaluate(fusionScore, signals);

    // 8. AI Explanation & Mitigation Recommendation
    const recommendation = RecommendationService.generate(decision, fusionScore, signals);

    // 9. STEP 1H — Construct Standardized Decision Record
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

    // 10. STEP 1I & STEP 7 — Persist Real Audit Log Record
    const { record: auditTrailRecord, auditPersistence } = await AuditStorageService.logEvent(decisionRecord, {
      requestId,
      signalsCount: signals.length,
      fraudProbability: modelResult.fraudProbability,
      recommendationSummary: recommendation.actionSummary,
      velocityEngine: velocityMetrics.storageEngine,
      velocitySummary: velocityMetrics.summaryText,
    });

    const executionTimeMs = Date.now() - startTime;

    // STEP 5 — Correlation ID Pino Structured Logging
    logger.info(
      {
        requestId,
        transactionId: validatedInput.transactionId,
        merchantId: validatedInput.merchantId,
        evaluationId: auditTrailRecord.auditId,
        riskScore: fusionScore.fusedScore,
        decision: decision.action,
        modelVersion: modelResult.modelVersion,
        policyVersion: PolicyEngineService.getVersion(),
        auditPersistence,
        executionTimeMs,
      },
      "🛡️ [SENTINEL EVALUATION COMPLETED]"
    );

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
      auditPersistence,
      executionTimeMs,
    };
  }
}
