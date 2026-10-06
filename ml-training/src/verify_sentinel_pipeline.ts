import { SentinelPipelineService } from "../../artifacts/api-server/src/sentinel/services/sentinelPipeline.service";

async function main() {
  console.log("==================================================");
  console.log("SENTINEL PIPELINE REAL XGBOOST EVALUATION TEST");
  console.log("==================================================");

  const testPayload = {
    transactionId: `TXN-SENTINEL-E2E-${Date.now()}`,
    merchantId: "MERCHANT-001",
    customerId: "CUST-999",
    amount: 12500.0,
    currency: "USD",
    paymentMethod: "credit_card",
    ipAddress: "198.51.100.44",
    deviceId: "DEV-MAC-PRO-01",
    timestamp: new Date().toISOString(),
    ProductCD: "W",
    card1: 15000,
    card2: 222,
    TransactionDT: 13200000,
  };

  try {
    const res = await SentinelPipelineService.evaluate(testPayload as any);
    console.log("==================================================");
    console.log("✅ EVALUATION SUCCESS!");
    console.log("==================================================");
    console.log("Transaction ID:       ", res.transactionId);
    console.log("Fused Risk Score:     ", res.fusionScore?.fusedScore, "/ 100");
    console.log("Risk Level:           ", res.fusionScore?.riskLevel);
    console.log("Model Name:           ", res.modelResult?.modelName);
    console.log("Model Version:        ", res.modelResult?.modelVersion);
    console.log("Fraud Probability:    ", res.modelResult?.fraudProbability);
    console.log("Decision Action:      ", res.decision?.action);
    console.log("Audit Record ID:      ", res.evaluationId);
    console.log("Audit Persistence:   ", res.auditPersistence);
    console.log("Execution Time:       ", res.executionTimeMs, "ms");
    console.log("==================================================");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Evaluation Failed:", err?.message || err);
    process.exit(1);
  }
}

main();
