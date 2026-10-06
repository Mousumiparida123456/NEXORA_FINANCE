import { SentinelPipelineService } from "../../artifacts/api-server/src/sentinel/services/sentinelPipeline.service";

async function runControlledDemoTests() {
  console.log("==================================================");
  console.log("NEXORA SENTINEL — CONTROLLED DEMO TRANSACTIONS");
  console.log("==================================================");

  // 1. TEST A: Low-Risk Transaction
  const testA = {
    transactionId: `TXN-DEMO-LOW-${Date.now()}`,
    merchantId: "MERCHANT-001",
    customerId: "CUST-SAFE-101",
    amount: 45.50,
    currency: "USD",
    paymentMethod: "debit_card",
    ipAddress: "192.168.1.50",
    deviceId: "DEV-IPHONE-SAFE",
    timestamp: new Date().toISOString(),
    ProductCD: "W",
    card1: 12500,
    card2: 222,
    card4: "visa",
    card6: "debit",
    P_emaildomain: "gmail.com",
    R_emaildomain: "gmail.com",
    TransactionDT: 13155000,
  };

  console.log("\n▶ EXECUTING TEST A (Low-Risk Transaction)...");
  console.log(`Payload: Amount=$${testA.amount}, Email=${testA.P_emaildomain}, Card=${testA.card4}`);
  const resA = await SentinelPipelineService.evaluate(testA as any);

  console.log("--------------------------------------------------");
  console.log("TEST A RESULTS:");
  console.log("Transaction ID:    ", resA.transactionId);
  console.log("Fraud Probability: ", resA.modelResult?.fraudProbability);
  console.log("Risk Score:        ", resA.fusionScore?.fusedScore, "/ 100");
  console.log("Risk Level:        ", resA.fusionScore?.riskLevel);
  console.log("Decision:          ", resA.decision?.action);
  console.log("Audit ID:          ", resA.evaluationId);
  console.log("--------------------------------------------------");

  // 2. TEST B: High-Risk Transaction
  const testB = {
    transactionId: `TXN-DEMO-HIGH-${Date.now()}`,
    merchantId: "MERCHANT-001",
    customerId: "CUST-FRAUD-999",
    amount: 125000.0,
    currency: "USD",
    paymentMethod: "credit_card",
    ipAddress: "198.51.100.99",
    deviceId: "DEV-TOR-PROXY-99",
    timestamp: new Date().toISOString(),
    ProductCD: "W",
    card1: 16000,
    card2: 333,
    TransactionDT: 13300000,
    accountAgeDays: 0,
    ipReputationScore: 98,
    deviceTrustScore: 0,
    pastChargebackCount: 3,
    unusualAmountRatio: 10.0,
    failedPaymentAttempts: 5,
    behavioralDeviationScore: 95,
  };

  console.log("\n▶ EXECUTING TEST B (High-Risk Transaction)...");
  console.log(`Payload: Amount=$${testB.amount}, ProductCD=${testB.ProductCD}, Card1=${testB.card1}, Card2=${testB.card2}`);
  const resB = await SentinelPipelineService.evaluate(testB as any);

  console.log("--------------------------------------------------");
  console.log("TEST B RESULTS:");
  console.log("Transaction ID:    ", resB.transactionId);
  console.log("Fraud Probability: ", resB.modelResult?.fraudProbability);
  console.log("Risk Score:        ", resB.fusionScore?.fusedScore, "/ 100");
  console.log("Risk Level:        ", resB.fusionScore?.riskLevel);
  console.log("Decision:          ", resB.decision?.action);
  console.log("Audit ID:          ", resB.evaluationId);
  const outputText = `
==================================================
NEXORA SENTINEL — CONTROLLED DEMO TRANSACTIONS REPORT
==================================================
TEST A (Low-Risk Transaction):
  Transaction ID:    ${resA.transactionId}
  Fraud Probability: ${resA.modelResult?.fraudProbability}
  Risk Score:        ${resA.fusionScore?.fusedScore} / 100
  Risk Level:        ${resA.fusionScore?.riskLevel}
  Decision:          ${resA.decision?.action}
  Audit ID:          ${resA.evaluationId}

TEST B (High-Risk Transaction):
  Transaction ID:    ${resB.transactionId}
  Fraud Probability: ${resB.modelResult?.fraudProbability}
  Risk Score:        ${resB.fusionScore?.fusedScore} / 100
  Risk Level:        ${resB.fusionScore?.riskLevel}
  Decision:          ${resB.decision?.action}
  Audit ID:          ${resB.evaluationId}
==================================================
`;
  console.log(outputText);
  const fs = require('fs');
  fs.writeFileSync('ml-training/demo_test_results.txt', outputText);
  process.exit(0);
}

runControlledDemoTests().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
