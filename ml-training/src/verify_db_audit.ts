import { db, sentinelAuditLogs, eq } from "../../artifacts/api-server/src/db";
import { SentinelPipelineService } from "../../artifacts/api-server/src/sentinel/services/sentinelPipeline.service";

async function verifyDatabaseAuditLog() {
  console.log("==================================================");
  console.log("POSTGRESQL AUDIT LOG RECORD VERIFICATION");
  console.log("==================================================");

  const testTxnId = `TXN-DB-VERIFY-${Date.now()}`;
  const testPayload = {
    transactionId: testTxnId,
    merchantId: "MERCHANT-DB-TEST",
    customerId: "CUST-DB-001",
    amount: 18500.0,
    currency: "USD",
    paymentMethod: "credit_card",
    ipAddress: "198.51.100.77",
    deviceId: "DEV-DB-TEST-01",
    timestamp: new Date().toISOString(),
    ProductCD: "W",
    card1: 16000,
    card2: 333,
    TransactionDT: 13300000,
  };

  console.log(`▶ 1. Executing Sentinel Evaluation for ${testTxnId}...`);
  const evalRes = await SentinelPipelineService.evaluate(testPayload as any);
  console.log(`▶ Evaluation Completed: Decision=${evalRes.decision?.action}, RiskScore=${evalRes.fusionScore?.fusedScore}, ModelVersion=${evalRes.modelResult?.modelVersion}`);

  console.log("▶ 2. Querying PostgreSQL `sentinel_audit_logs` table directly...");
  if (!db) {
    console.log("⚠️ Database connection object is undefined (Running in local memory fallback mode)");
    console.log("==================================================");
    return;
  }

  try {
    const records = await db
      .select()
      .from(sentinelAuditLogs)
      .where(eq(sentinelAuditLogs.transactionId, testTxnId));

    if (records.length === 0) {
      console.log("❌ DB RECORD NOT FOUND in PostgreSQL `sentinel_audit_logs` table!");
      console.log("Audit Persistence engine reported:", evalRes.auditPersistence);
      process.exit(1);
    }

    const rec = records[0];
    console.log("==================================================");
    console.log("✅ POSTGRESQL AUDIT RECORD FOUND & VERIFIED!");
    console.log("==================================================");
    console.log("Audit ID:            ", rec.auditId);
    console.log("Transaction ID:      ", rec.transactionId);
    console.log("Merchant ID:         ", rec.merchantId);
    console.log("Risk Score:          ", rec.riskScore);
    console.log("Risk Level:          ", rec.riskLevel);
    console.log("Decision:            ", rec.decision);
    console.log("Primary Reasons:     ", rec.reasons);
    console.log("Model Version:       ", rec.modelVersion);
    console.log("Policy Version:      ", rec.policyVersion);
    console.log("Timestamp:           ", rec.timestamp);
    console.log("Metadata Payload:    ", JSON.stringify(rec.metadata, null, 2));

    const meta = rec.metadata as any || {};
    console.log("==================================================");
    console.log("METADATA FIELD CHECKS:");
    console.log("▶ fraudProbability: ", meta.fraudProbability, " (Expected: numeric float)");
    console.log("▶ predictedFraud:   ", meta.predictedFraud, " (Expected: boolean)");
    console.log("▶ modelSource:      ", meta.modelSource, " (Expected: IEEE-CIS-XGBoost)");
    console.log("==================================================");

    const isModelVersionOk = rec.modelVersion === "nexora-fraud-v1";
    const isModelSourceOk = meta.modelSource === "IEEE-CIS-XGBoost";

    if (isModelVersionOk && isModelSourceOk) {
      console.log("🎉 AUDIT LOG DATABASE VERIFICATION: PASS!");
    } else {
      console.log("❌ AUDIT LOG VERIFICATION FAILED: Model version or source mismatch");
      process.exit(1);
    }
  } catch (err: any) {
    console.error("❌ DB Query Error:", err?.message || err);
    process.exit(1);
  }
}

verifyDatabaseAuditLog().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
