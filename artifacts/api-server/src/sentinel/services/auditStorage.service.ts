import { db, sentinelAuditLogs, desc, eq } from "../../db";
import { AuditTrailRecord, DecisionRecord } from "../types/sentinel.types";
import { logger } from "../../lib/logger";

export interface LogEventResult {
  record: AuditTrailRecord;
  auditPersistence: "postgresql" | "memory-fallback";
}

export class AuditStorageService {
  private static inMemoryAuditBuffer: AuditTrailRecord[] = [];
  private static readonly MAX_BUFFER_SIZE = 100;

  /**
   * STEP 3 — Idempotency Lookup
   * Checks if an evaluation for transactionId already exists in PostgreSQL or memory buffer.
   */
  public static async findDecisionByTransactionId(
    transactionId: string
  ): Promise<{ decisionRecord: DecisionRecord; auditPersistence: "postgresql" | "memory-fallback" } | null> {
    if (!transactionId) return null;

    // 1. Check PostgreSQL DB first (Source of Truth)
    try {
      if (db) {
        const existing = await db.query.sentinelAuditLogs.findFirst({
          where: eq(sentinelAuditLogs.transactionId, transactionId),
        });

        if (existing) {
          logger.info({ transactionId, auditId: existing.auditId }, "⚡ [IDEMPOTENCY MATCH]: Existing decision found in PostgreSQL audit store");
          const decisionRecord: DecisionRecord = {
            transactionId: existing.transactionId,
            merchantId: existing.merchantId,
            riskScore: existing.riskScore,
            riskLevel: existing.riskLevel as any,
            modelVersion: existing.modelVersion,
            policyVersion: existing.policyVersion,
            decision: existing.decision as any,
            reasons: (existing.reasons as string[]) || [],
            requiresHumanReview: existing.decision === "BLOCK" || existing.decision === "MANUAL_REVIEW",
            requiresMFA: existing.decision === "REQUIRE_3DS",
            timestamp: existing.timestamp ? new Date(existing.timestamp).toISOString() : new Date().toISOString(),
          };
          return { decisionRecord, auditPersistence: "postgresql" };
        }
      }
    } catch (err) {
      logger.warn({ transactionId, error: err }, "⚠️ [AUDIT DB FETCH]: Database query error in findDecisionByTransactionId");
    }

    // 2. Check local in-memory ring buffer fallback
    const memoryMatch = this.inMemoryAuditBuffer.find((rec) => rec.transactionId === transactionId);
    if (memoryMatch) {
      logger.info({ transactionId, auditId: memoryMatch.auditId }, "⚡ [IDEMPOTENCY MATCH]: Existing decision found in memory ring buffer");
      const decisionRecord: DecisionRecord = {
        transactionId: memoryMatch.transactionId,
        merchantId: memoryMatch.merchantId,
        riskScore: memoryMatch.riskScore,
        riskLevel: memoryMatch.riskLevel as any,
        modelVersion: memoryMatch.modelVersion,
        policyVersion: memoryMatch.policyVersion,
        decision: memoryMatch.decision as any,
        reasons: memoryMatch.reasons,
        requiresHumanReview: memoryMatch.action === "BLOCK" || memoryMatch.action === "MANUAL_REVIEW",
        requiresMFA: memoryMatch.action === "REQUIRE_3DS",
        timestamp: memoryMatch.timestamp,
      };
      return { decisionRecord, auditPersistence: "memory-fallback" };
    }

    return null;
  }

  /**
   * STEP 7 — Persists audit record to PostgreSQL table sentinel_audit_logs with explicit persistence status.
   */
  public static async logEvent(
    decisionRecord: DecisionRecord,
    metadata: Record<string, any> = {}
  ): Promise<LogEventResult> {
    const auditId = `AUD-${Math.floor(Math.random() * 899999) + 100000}`;
    const timestamp = decisionRecord.timestamp || new Date().toISOString();

    const auditRecord: AuditTrailRecord = {
      auditId,
      transactionId: decisionRecord.transactionId,
      merchantId: decisionRecord.merchantId,
      actor: "SENTINEL_AI_ENGINE",
      action: decisionRecord.decision,
      riskScore: decisionRecord.riskScore,
      riskLevel: decisionRecord.riskLevel,
      decision: decisionRecord.decision,
      reasons: decisionRecord.reasons,
      modelVersion: decisionRecord.modelVersion,
      policyVersion: decisionRecord.policyVersion,
      timestamp,
      metadata,
    };

    // Always maintain short-lived in-memory ring buffer for low-latency queries
    this.inMemoryAuditBuffer.unshift(auditRecord);
    if (this.inMemoryAuditBuffer.length > this.MAX_BUFFER_SIZE) {
      this.inMemoryAuditBuffer.pop();
    }

    let auditPersistence: "postgresql" | "memory-fallback" = "memory-fallback";

    // Attempt PostgreSQL persistence (Source of Truth)
    try {
      if (db) {
        await db.insert(sentinelAuditLogs).values({
          auditId,
          transactionId: decisionRecord.transactionId,
          merchantId: decisionRecord.merchantId,
          actor: "SENTINEL_AI_ENGINE",
          action: decisionRecord.decision,
          riskScore: decisionRecord.riskScore,
          riskLevel: decisionRecord.riskLevel,
          decision: decisionRecord.decision,
          reasons: decisionRecord.reasons,
          modelVersion: decisionRecord.modelVersion,
          policyVersion: decisionRecord.policyVersion,
          metadata,
          timestamp: new Date(timestamp),
        });
        auditPersistence = "postgresql";
      }
    } catch (err) {
      logger.warn({ transactionId: decisionRecord.transactionId, error: err }, "⚠️ [AUDIT DB STORAGE]: Database write skipped/failed, audit stored in resilient memory buffer");
      auditPersistence = "memory-fallback";
    }

    return { record: auditRecord, auditPersistence };
  }

  /**
   * Retrieves recent audit logs from database, falling back to memory ring buffer.
   */
  public static async getRecentLogs(limit: number = 20): Promise<AuditTrailRecord[]> {
    try {
      if (db) {
        const dbLogs = await db.query.sentinelAuditLogs.findMany({
          limit,
          orderBy: [desc(sentinelAuditLogs.timestamp)],
        });

        if (dbLogs && dbLogs.length > 0) {
          return dbLogs.map((log: any) => ({
            auditId: log.auditId,
            transactionId: log.transactionId,
            merchantId: log.merchantId,
            actor: log.actor,
            action: log.action as any,
            riskScore: log.riskScore,
            riskLevel: log.riskLevel,
            decision: log.decision,
            reasons: (log.reasons as string[]) || [],
            modelVersion: log.modelVersion,
            policyVersion: log.policyVersion,
            timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
            metadata: (log.metadata as Record<string, any>) || {},
          }));
        }
      }
    } catch (err) {
      logger.warn("⚠️ [AUDIT DB FETCH]: Database query failed, returning local in-memory audit logs.");
    }

    return this.inMemoryAuditBuffer.slice(0, limit);
  }
}
