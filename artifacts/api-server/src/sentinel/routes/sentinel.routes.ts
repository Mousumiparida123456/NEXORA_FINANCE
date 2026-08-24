import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
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
sentinelRouter.get("/audit-logs", async (req: Request, res: Response) => {
  const requestId = (req.headers["x-request-id"] as string) || `REQ-${crypto.randomUUID()}`;
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const logs = await AuditStorageService.getRecentLogs(limit);
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
      "4. Sentinel Risk Scoring Model (sentinel-risk-v1)",
      "5. Risk Fusion Engine",
      "6. Business Policy Engine",
      "7. PostgreSQL Audit Trail Persistence",
    ],
  });
});
