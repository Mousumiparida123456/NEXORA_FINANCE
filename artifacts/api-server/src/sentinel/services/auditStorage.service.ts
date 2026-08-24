import { db, sentinelAuditLogs, desc } from "../../db";
import { AuditTrailRecord, DecisionRecord } from "../types/sentinel.types";

export class AuditStorageService {
  private static inMemoryAuditBuffer: AuditTrailRecord[] = [];
  private static readonly MAX_BUFFER_SIZE = 100;

  /**
   * STEP 1I — Real Audit Trail Persistence
   * Persists decision event to PostgreSQL table sentinel_audit_logs, falling back to local memory ring buffer.
   */
  public static async logEvent(
    decisionRecord: DecisionRecord,
    metadata: Record<string, any> = {}
  ): Promise<AuditTrailRecord> {
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

    // 1. Always append to local in-memory ring buffer first for sub-millisecond retrieval
    this.inMemoryAuditBuffer.unshift(auditRecord);
    if (this.inMemoryAuditBuffer.length > this.MAX_BUFFER_SIZE) {
      this.inMemoryAuditBuffer.pop();
    }

    // 2. Attempt PostgreSQL DB persistence
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
      }
    } catch (err) {
      console.warn("⚠️ [AUDIT DB STORAGE]: Database write skipped/failed, audit stored in resilient memory buffer:", err);
    }

    return auditRecord;
  }

  /**
   * Retrieves recent audit logs from database, falling back to in-memory ring buffer.
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
      console.warn("⚠️ [AUDIT DB FETCH]: Database query failed, returning local in-memory audit logs.");
    }

    return this.inMemoryAuditBuffer.slice(0, limit);
  }
}
