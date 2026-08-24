import { Router, Request, Response } from "express";
import { SentinelPipelineService } from "../services/sentinelPipeline.service";
import { AuditStorageService } from "../services/auditStorage.service";
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
      "2. 13 Risk Signals Feature Extraction",
      "3. Offline-Trained ML Fraud Scoring",
      "4. Risk Fusion Engine",
      "5. Business Policy Engine",
      "6. AI Explanation & Mitigation",
      "7. PostgreSQL Audit Trail Persistence",
    ],
  });
});
