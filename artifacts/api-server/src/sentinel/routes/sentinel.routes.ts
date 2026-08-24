import { Router, Request, Response } from "express";
import { SentinelPipelineService } from "../services/sentinelPipeline.service";
import { AuditStorageService } from "../services/auditStorage.service";
import { VelocityService } from "../services/velocityService";
import { z } from "zod";

export const sentinelRouter = Router();

/**
 * POST /api/v1/sentinel/evaluate
 * Accepts transaction payload, executes 7-stage Sentinel risk pipeline, returns decision & audit record.
 */
sentinelRouter.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const result = await SentinelPipelineService.evaluate(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        details: error.errors,
      });
    }
    console.error("❌ [SENTINEL EVALUATION ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal Sentinel evaluation error",
    });
  }
});

/**
 * GET /api/v1/sentinel/velocity-stats/:customerId
 * STEP 1J — Returns real-time Redis velocity counters for a customer.
 */
sentinelRouter.get("/velocity-stats/:customerId", async (req: Request, res: Response) => {
  try {
    const customerId = String(req.params.customerId || "CUST-DEFAULT");
    const ipAddress = (req.query.ipAddress as string) || "127.0.0.1";
    const stats = await VelocityService.getVelocityOnly(customerId, ipAddress);
    return res.status(200).json({
      success: true,
      customerId,
      data: stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch velocity stats",
    });
  }
});

/**
 * GET /api/v1/sentinel/audit-logs
 * Returns persisted audit trail logs from PostgreSQL database or resilient memory buffer.
 */
sentinelRouter.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const logs = await AuditStorageService.getRecentLogs(limit);
    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    console.error("❌ [SENTINEL AUDIT LOGS ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to fetch audit logs",
    });
  }
});

/**
 * GET /api/v1/sentinel/health
 * Health status of Sentinel Backend Domain
 */
sentinelRouter.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "online",
    domain: "Nexora Sentinel Risk Domain",
    pipelineVersion: "v2.0.0-backend",
    stages: [
      "1. Zod Contract Validation",
      "2. Redis Atomic Velocity Counters",
      "3. 13 Risk Signals Feature Extraction",
      "4. Offline-Trained ML Fraud Scoring",
      "5. Risk Fusion Engine",
      "6. Business Policy Engine",
      "7. PostgreSQL Audit Trail Persistence",
    ],
  });
});
