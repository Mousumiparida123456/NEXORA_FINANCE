import { SentinelPipelineService } from "../../artifacts/api-server/src/sentinel/services/sentinelPipeline.service";
import { AuditStorageService } from "../../artifacts/api-server/src/sentinel/services/auditStorage.service";
import { AuditTrailRecord } from "../../artifacts/api-server/src/sentinel/types/sentinel.types";

async function runE2ETest() {
  console.log("==================================================");
  console.log("STARTING END-TO-END SENTINEL PIPELINE INTEGRATION TEST");
  console.log("==================================================");

  const testId = `TXN-E2E-${Date.now()}`;
  const sampleTxn = {
    transactionId: testId,
    merchantId: "MERCHANT-001",
    customerId: "CUST-8888",
    amount: 45000.0,
    currency: "USD",
    paymentMethod: "credit_card",
    ipAddress: "198.51.100.24",
    deviceId: "DEV-TOR-PROXY-99",
    timestamp: new Date().toISOString(),
    ProductCD: "W",
    card1: 15000,
    card2: 555,
    TransactionDT: 13200000,
    P_emaildomain: "protonmail.com",
    R_emaildomain: "gmail.com",
  };

  const evalResult = await SentinelPipelineService.evaluate(sampleTxn as any);

  console.log("▶ Transaction ID:         ", evalResult.transactionId);
  console.log("▶ Fused Risk Score:       ", evalResult.fusionScore?.fusedScore, "/ 100");
  console.log("▶ Risk Level:             ", evalResult.fusionScore?.riskLevel);
  console.log("▶ Model Version:          ", evalResult.modelResult?.modelVersion);
  console.log("▶ Policy Action:          ", evalResult.decision?.action);
  console.log("▶ Primary Risk Reasons:   ", evalResult.decisionRecord?.reasons);
  console.log("▶ Human Review Required:  ", evalResult.decisionRecord?.requiresHumanReview);
  console.log("▶ MFA Required:           ", evalResult.decisionRecord?.requiresMFA);
  console.log("▶ Audit Log ID:           ", evalResult.evaluationId);
  console.log("▶ Audit Persistence:      ", evalResult.auditPersistence);
  console.log("==================================================");

  // Retrieve event from Audit Storage to confirm persistence
  const logs = await AuditStorageService.getRecentLogs(50);
  const loggedEvent = logs.find((l: AuditTrailRecord) => l.transactionId === testId);

  if (loggedEvent) {
    console.log("✅ AUDIT PERSISTENCE VERIFIED!");
    console.log("▶ Logged Model Version:   ", loggedEvent.modelVersion);
    console.log("▶ Logged Metadata:        ", loggedEvent.metadata);
    console.log("==================================================");
    console.log("🎉 ALL SENTINEL PIPELINE INTEGRATION CHECKS PASSED!");
  } else {
    console.log("❌ Audit record not found in storage!");
    process.exit(1);
  }
}

runE2ETest().catch((err) => {
  console.error("❌ E2E Test error:", err);
  process.exit(1);
});
