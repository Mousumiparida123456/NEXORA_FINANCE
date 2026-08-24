import { Router, Request, Response } from "express";
import { SentinelPipelineService } from "../services/sentinelPipeline.service";
import { z } from "zod";

export const sentinelRouter = Router();

/**
 * POST /api/v1/sentinel/evaluate
 * Accepts transaction payload, runs Zod validation, executes 7-stage Sentinel pipeline, returns decision.
 */
sentinelRouter.post("/evaluate", (req: Request, res: Response) => {
  try {
    const result = SentinelPipelineService.evaluate(req.body);
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
    console.error("❌ [SENTINEL PIPELINE ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal Sentinel evaluation error",
    });
  }
});

/**
 * GET /api/v1/sentinel/health
 * Returns status of Sentinel Backend Domain
 */
sentinelRouter.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "online",
    domain: "Nexora Sentinel Domain",
    pipelineVersion: "v2.0.0-backend",
    stages: 7,
  });
});
