import { TransactionEvaluationSchema, TransactionEvaluationInput } from "../schemas/sentinel.schema";
import { FeatureEngineeringService } from "./featureEngineering.service";
import { RiskModelService } from "../models/riskModel.service";
import { RiskFusionService } from "./riskFusion.service";
import { PolicyEngineService } from "./policyEngine.service";
import { RecommendationService } from "./recommendation.service";
import { SentinelEvaluationResult } from "../types/sentinel.types";

export class SentinelPipelineService {
  /**
   * Evaluates a transaction through the complete 7-stage Sentinel Risk Pipeline.
   */
  public static evaluate(rawPayload: unknown): SentinelEvaluationResult {
    const startTime = Date.now();

    // 1. Zod Validation
    const validatedInput: TransactionEvaluationInput = TransactionEvaluationSchema.parse(rawPayload);

    // 2. Feature Engineering (13 Risk Signals)
    const { signals, vector } = FeatureEngineeringService.extractFeatures(validatedInput as any);

    // 3. ML Risk Model Scoring
    const modelResult = RiskModelService.predict(vector);

    // 4. Risk Fusion Engine
    const fusionScore = RiskFusionService.fuse(signals, modelResult);

    // 5. Policy Engine Decision
    const decision = PolicyEngineService.evaluate(fusionScore, signals);

    // 6. AI Explanation & Mitigation Recommendation
    const recommendation = RecommendationService.generate(decision, fusionScore, signals);

    const executionTimeMs = Date.now() - startTime;

    // 7. Assemble Complete Evaluation Result Record
    return {
      evaluationId: `EV-${Math.floor(Math.random() * 899999) + 100000}`,
      timestamp: new Date().toISOString(),
      merchantId: validatedInput.merchantId,
      transactionId: validatedInput.transactionId,
      amount: validatedInput.amount,
      currency: validatedInput.currency,
      signals,
      modelResult,
      fusionScore,
      decision,
      recommendation,
      executionTimeMs,
    };
  }
}
