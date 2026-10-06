import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { SentinelPipelineService } from "../services/sentinelPipeline.service";
import { AuditStorageService } from "../services/auditStorage.service";
import { VelocityService } from "../services/velocityService";
import { AuthService } from "../../services/AuthService";
import { logger } from "../../lib/logger";
import { z } from "zod";

export const sentinelRouter = Router();

// STEP 6 — Sentinel Dedicated Rate Limiter (60 requests per minute per IP)
const sentinelRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
    logger.warn({ requestId, ip: req.ip }, "⚠️ [SENTINEL RATE LIMIT EXCEEDED]");
    return res.status(429).json({
      success: false,
      requestId,
      error: "Rate Limit Exceeded",
      message: "Too many risk evaluation requests from this IP. Please try again in 1 minute.",
    });
  },
});

// Helper to extract access token from Authorization header or cookies
const getAuthToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  if ((req as any).cookies?.nexora_access) {
    return (req as any).cookies.nexora_access;
  }
  return null;
};

// STEP 2 — Authentication Middleware for Sentinel Domain
const sentinelAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
  (req as any).requestId = requestId;

  // Preserve Demo Mode without forcing auth headers
  const isDemo =
    req.headers["x-sentinel-demo"] === "true" ||
    req.query.demo === "true" ||
    req.body?.demoMode === true;

  if (isDemo) {
    (req as any).isDemoMode = true;
    return next();
  }

  const token = getAuthToken(req);
  if (!token) {
    logger.warn({ requestId, path: req.path }, "⛔ [SENTINEL AUTH REJECTED]: Missing authentication token");
    return res.status(401).json({
      success: false,
      requestId,
      error: "Unauthorized",
      message: "Authentication token required for Sentinel evaluation endpoint. Pass Bearer token or x-sentinel-demo header.",
    });
  }

  const userPayload = AuthService.verifyAccessToken(token);
  if (!userPayload) {
    logger.warn({ requestId, path: req.path }, "⛔ [SENTINEL AUTH REJECTED]: Invalid or expired access token");
    return res.status(401).json({
      success: false,
      requestId,
      error: "Unauthorized",
      message: "Invalid or expired access token",
    });
  }

  (req as any).user = userPayload;
  return next();
};

/**
 * POST /api/v1/sentinel/evaluate
 * STEP 5 & STEP 10 — Hardened Risk Evaluation Endpoint with Correlation ID, Auth, Idempotency, and Rate Limiting
 */
sentinelRouter.post(
  "/evaluate",
  sentinelRateLimiter,
  sentinelAuthMiddleware,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = (req as any).requestId || (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;

    try {
      const result = await SentinelPipelineService.evaluate(req.body, { requestId });
      const durationMs = Date.now() - startTime;

      // STEP 10 — Standardized Response Contract with root requestId
      return res.status(200).json({
        success: true,
        requestId,
        data: result,
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      // 400 Validation Error
      if (error instanceof z.ZodError) {
        logger.warn(
          { requestId, durationMs, validationErrors: error.errors },
          "⚠️ [SENTINEL VALIDATION FAILED]"
        );
        return res.status(400).json({
          success: false,
          requestId,
          error: "Validation Error",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      // Fraud Model Unavailable Error (503)
      if (error?.message === "Fraud model unavailable") {
        logger.warn(
          { requestId, durationMs },
          "⚠️ [SENTINEL MODEL UNAVAILABLE]"
        );
        return res.status(503).json({
          success: false,
          requestId,
          error: "Fraud model unavailable",
          message: "The Sentinel fraud detection model is currently unavailable.",
        });
      }

      // STEP 4 — 500 Structured Server Failure (Suppressing Stack Traces)
      logger.error(
        {
          requestId,
          durationMs,
          transactionId: req.body?.transactionId,
          merchantId: req.body?.merchantId,
          error: error?.message || String(error),
        },
        "❌ [SENTINEL PIPELINE EVALUATION EXCEPTION]"
      );

      return res.status(500).json({
        success: false,
        requestId,
        error: "Internal Sentinel Evaluation Error",
        message: "An unexpected error occurred while evaluating transaction risk.",
      });
    }
  }
);

/**
 * GET /api/v1/sentinel/velocity-stats/:customerId
 * STEP 1J — Returns real-time Redis velocity counters for a customer.
 */
sentinelRouter.get("/velocity-stats/:customerId", async (req: Request, res: Response) => {
  const requestId = (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
  try {
    const customerId = String(req.params.customerId || "CUST-DEFAULT");
    const ipAddress = (req.query.ipAddress as string) || "127.0.0.1";
    const stats = await VelocityService.getVelocityOnly(customerId, ipAddress);
    return res.status(200).json({
      success: true,
      requestId,
      customerId,
      data: stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      requestId,
      error: error?.message || "Failed to fetch velocity stats",
    });
  }
});

/**
 * GET /api/v1/sentinel/audit-logs
 * Returns persisted audit trail logs from PostgreSQL database or resilient memory buffer.
 */
sentinelRouter.get("/audit-logs", sentinelAuthMiddleware, async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const userContext = (req as any).user;
    const logs = await AuditStorageService.getRecentLogs(limit, userContext);
    return res.status(200).json({
      success: true,
      requestId,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    logger.error({ requestId, error: error?.message }, "❌ [SENTINEL AUDIT LOGS ERROR]");
    return res.status(500).json({
      success: false,
      requestId,
      error: error?.message || "Failed to fetch audit logs",
    });
  }
});

/**
 * POST /api/v1/sentinel/audit-event
 * Receives merchant domain actions/events and persists them directly into PostgreSQL sentinel_audit_logs.
 */
sentinelRouter.post(
  "/audit-event",
  sentinelAuthMiddleware,
  async (req: Request, res: Response) => {
    const requestId = (req as any).requestId || (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
    try {
      const {
        transactionId,
        merchantId = "MERCHANT-003",
        actor = "MERCHANT_USER",
        action = "SENTINEL_EVENT",
        riskScore = 50,
        riskLevel = "MEDIUM",
        decision = "APPROVE",
        reasons = [],
        modelVersion = "sentinel-risk-v1",
        policyVersion = "v2.0.0",
        metadata = {},
        timestamp = new Date().toISOString(),
      } = req.body || {};

      const decisionRecord = {
        transactionId: transactionId || `TXN-EVENT-${Math.floor(Math.random() * 899999) + 100000}`,
        merchantId,
        riskScore,
        riskLevel,
        modelVersion,
        policyVersion,
        decision,
        reasons: Array.isArray(reasons) && reasons.length > 0 ? reasons : [action],
        requiresHumanReview: decision === "BLOCK" || decision === "MANUAL_REVIEW" || decision === "HOLD",
        requiresMFA: decision === "REQUIRE_3DS",
        timestamp,
      };

      const auditResult = await AuditStorageService.logEvent(decisionRecord, {
        actor,
        action,
        requestId,
        ...metadata,
      });

      return res.status(200).json({
        success: true,
        requestId,
        data: auditResult.record,
        auditPersistence: auditResult.auditPersistence,
      });
    } catch (error: any) {
      logger.error({ requestId, error: error?.message }, "❌ [SENTINEL AUDIT EVENT PERSISTENCE ERROR]");
      return res.status(500).json({
        success: false,
        requestId,
        error: error?.message || "Failed to persist audit event",
      });
    }
  }
);

/**
 * GET /api/v1/sentinel/model/health
 * Health check for the trained IEEE-CIS XGBoost fraud detection model
 */
sentinelRouter.get(["/model/health", "/model-health"], (req: Request, res: Response) => {
  const modelPath = path.resolve(__dirname, "../../../../../ml-training/artifacts/nexora_fraud_v1.json");
  const schemaPath = path.resolve(__dirname, "../../../../../ml-training/artifacts/feature_schema.json");

  const exists = fs.existsSync(modelPath) && fs.existsSync(schemaPath);

  if (!exists) {
    return res.status(503).json({
      status: "unavailable",
      error: "Fraud model unavailable",
      modelVersion: "nexora-fraud-v1",
      modelSource: "IEEE-CIS-XGBoost",
    });
  }

  return res.status(200).json({
    status: "ready",
    modelVersion: "nexora-fraud-v1",
    modelSource: "IEEE-CIS-XGBoost",
    featureCount: 397,
  });
});

/**
 * GET /api/v1/sentinel/model/performance
 * Returns real training metrics, confusion matrix, ROC-AUC, and feature importance for frontend
 */
sentinelRouter.get(["/model/performance", "/model/metrics"], (req: Request, res: Response) => {
  const metricsPath = path.resolve(__dirname, "../../../../../ml-training/artifacts/metrics.json");
  const metadataPath = path.resolve(__dirname, "../../../../../ml-training/artifacts/model_metadata.json");
  const impPath = path.resolve(__dirname, "../../../../../ml-training/artifacts/feature_importance.json");

  if (!fs.existsSync(metricsPath)) {
    return res.status(404).json({ error: "Model metrics artifact not found" });
  }

  try {
    const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));
    const metadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, "utf-8")) : {};
    const featureImp = fs.existsSync(impPath) ? JSON.parse(fs.readFileSync(impPath, "utf-8")) : [];

    return res.status(200).json({
      success: true,
      modelVersion: "nexora-fraud-v1",
      modelSource: "IEEE-CIS-XGBoost",
      algorithm: "XGBoost (XGBClassifier)",
      datasetName: "IEEE-CIS Fraud Detection",
      metrics: {
        roc_auc: metrics.roc_auc,
        pr_auc: metrics.pr_auc,
        precision: metrics.precision,
        recall: metrics.recall,
        f1: metrics.f1,
        accuracy: metrics.accuracy,
        false_positive_rate: metrics.false_positive_rate,
        false_negative_rate: metrics.false_negative_rate,
        confusion_matrix: metrics.confusion_matrix,
      },
      metadata: {
        trainingRows: metadata.dataset_split?.train_rows || 413378,
        validationRows: metadata.dataset_split?.val_rows || 88581,
        testRows: metadata.dataset_split?.test_rows || 88581,
        totalDatasetRows: metadata.dataset_split?.total_rows || 590540,
        fraudRate: metadata.fraud_rate || 0.03499,
        featureCount: metadata.selected_features_count || 397,
        scalePosWeight: metadata.scale_pos_weight || 27.577,
      },
      topFeatures: featureImp.slice(0, 20),
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read model performance metrics" });
  }
});

/**
 * GET /api/v1/sentinel/health
 * Health status of Sentinel Backend Domain
 */
sentinelRouter.get("/health", (req: Request, res: Response) => {
  const requestId = (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
  return res.status(200).json({
    status: "online",
    domain: "Nexora Sentinel Risk Domain",
    pipelineVersion: "v2.0.0-production-hardened",
    requestId,
    stages: [
      "1. Zod Contract Validation",
      "2. Redis Atomic Velocity Counters",
      "3. 13 Risk Signals Feature Extraction",
      "4. Sentinel Risk Scoring Model (nexora-fraud-v1)",
      "5. Risk Fusion Engine",
      "6. Business Policy Engine",
      "7. PostgreSQL Audit Trail Persistence",
    ],
  });
});
