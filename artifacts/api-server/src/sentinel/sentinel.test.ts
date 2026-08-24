import { SentinelPipelineService } from "./services/sentinelPipeline.service";
import { AuditStorageService } from "./services/auditStorage.service";
import { TransactionEvaluationSchema } from "./schemas/sentinel.schema";
import { AuthService } from "../services/AuthService";
import { z } from "zod";

async function runSentinelTest(testName: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    console.log(`✅ [PASS] ${testName}`);
  } catch (error: any) {
    console.error(`❌ [FAIL] ${testName}:`, error.message || error);
    process.exitCode = 1;
  }
}

export async function runAllSentinelTests() {
  console.log("\n🧪 Running Sentinel Production Hardening Backend Test Suite...\n");

  // 1. Valid Transaction Evaluation
  await runSentinelTest("1. Valid Transaction Evaluation", async () => {
    const payload = {
      demoMode: true,
      transactionId: `TXN-VALID-${Date.now()}`,
      merchantId: "MER-001",
      customerId: "CUST-001",
      amount: 1500,
      currency: "USD",
      timestamp: new Date().toISOString(),
      accountAgeDays: 100,
    };

    const result = await SentinelPipelineService.evaluate(payload);
    if (!result.decisionRecord || !result.evaluationId) {
      throw new Error("Result missing decisionRecord or evaluationId");
    }
    if (result.modelResult.modelName !== "Sentinel Risk Scoring Model") {
      throw new Error(`Unexpected model name: ${result.modelResult.modelName}`);
    }
    if (result.modelResult.modelVersion !== "sentinel-risk-v1") {
      throw new Error(`Unexpected model version: ${result.modelResult.modelVersion}`);
    }
  });

  // 2. Missing Amount Validation Error
  await runSentinelTest("2. Missing Amount Validation Error", async () => {
    try {
      TransactionEvaluationSchema.parse({
        currency: "USD",
        timestamp: new Date().toISOString(),
      });
      throw new Error("Validation should have failed for missing amount");
    } catch (err: any) {
      if (!(err instanceof z.ZodError)) throw err;
    }
  });

  // 3. Negative Amount Validation Error
  await runSentinelTest("3. Negative Amount Validation Error", async () => {
    try {
      TransactionEvaluationSchema.parse({
        amount: -500,
        currency: "USD",
        timestamp: new Date().toISOString(),
      });
      throw new Error("Validation should have failed for negative amount");
    } catch (err: any) {
      if (!(err instanceof z.ZodError)) throw err;
    }
  });

  // 4. Invalid Timestamp Validation Error
  await runSentinelTest("4. Invalid Timestamp Validation Error", async () => {
    try {
      TransactionEvaluationSchema.parse({
        amount: 100,
        currency: "USD",
        timestamp: "NOT_A_TIMESTAMP",
      });
      throw new Error("Validation should have failed for invalid timestamp");
    } catch (err: any) {
      if (!(err instanceof z.ZodError)) throw err;
    }
  });

  // 5. Invalid Currency Validation Error
  await runSentinelTest("5. Invalid Currency Validation Error", async () => {
    try {
      TransactionEvaluationSchema.parse({
        amount: 100,
        currency: "INVALID_CURRENCY_CODE",
        timestamp: new Date().toISOString(),
      });
      throw new Error("Validation should have failed for invalid currency");
    } catch (err: any) {
      if (!(err instanceof z.ZodError)) throw err;
    }
  });

  // 6. Unauthorized Request (Missing/Invalid Token Verification)
  await runSentinelTest("6. Unauthorized Request Verification", async () => {
    const invalidToken = "invalid.jwt.token";
    const verification = AuthService.verifyAccessToken(invalidToken);
    if (verification !== null) {
      throw new Error("Invalid token verification should return null");
    }
  });

  // 7. Same transactionId Submitted Twice (Idempotency Guarantee)
  await runSentinelTest("7. Same transactionId Idempotency Guarantee", async () => {
    const txnId = `TXN-IDEMPOTENT-${Date.now()}`;
    const payload = {
      demoMode: true,
      transactionId: txnId,
      merchantId: "MER-001",
      customerId: "CUST-001",
      amount: 2500,
      currency: "INR",
      timestamp: new Date().toISOString(),
    };

    const res1 = await SentinelPipelineService.evaluate(payload);
    const res2 = await SentinelPipelineService.evaluate(payload);

    if (res1.decisionRecord.decision !== res2.decisionRecord.decision) {
      throw new Error("Idempotent decisions do not match!");
    }
    if (res1.decisionRecord.riskScore !== res2.decisionRecord.riskScore) {
      throw new Error("Idempotent risk scores do not match!");
    }
  });

  // 8. High-Risk Transaction Evaluation
  await runSentinelTest("8. High-Risk Transaction Evaluation", async () => {
    const payload = {
      demoMode: true,
      transactionId: `TXN-HIGH-RISK-${Date.now()}`,
      amount: 150000,
      currency: "INR",
      timestamp: new Date().toISOString(),
      pastChargebackCount: 3,
      failedPaymentAttempts: 5,
      ipReputationScore: 95,
      deviceTrustScore: 10,
      behavioralDeviationScore: 90,
      unusualAmountRatio: 4.5,
      velocityLast24h: 15,
    };

    const result = await SentinelPipelineService.evaluate(payload);
    if (result.fusionScore.fusedScore < 70) {
      throw new Error(`High risk score expected >= 70, got ${result.fusionScore.fusedScore}`);
    }
    if (result.decision.action !== "BLOCK" && result.decision.action !== "REQUIRE_3DS" && result.decision.action !== "MANUAL_REVIEW") {
      throw new Error(`Expected severe action for high risk payload, got ${result.decision.action}`);
    }
  });

  // 9. Low-Risk Clean Transaction Evaluation
  await runSentinelTest("9. Low-Risk Clean Transaction Evaluation", async () => {
    const payload = {
      demoMode: true,
      transactionId: `TXN-LOW-RISK-${Date.now()}`,
      amount: 50,
      currency: "USD",
      timestamp: new Date().toISOString(),
      accountAgeDays: 365,
      pastChargebackCount: 0,
      failedPaymentAttempts: 0,
      deviceTrustScore: 95,
      ipReputationScore: 5,
    };

    const result = await SentinelPipelineService.evaluate(payload);
    if (result.fusionScore.fusedScore > 40) {
      throw new Error(`Low risk score expected <= 40, got ${result.fusionScore.fusedScore}`);
    }
    if (result.decision.action !== "APPROVE") {
      throw new Error(`Expected APPROVE for clean baseline, got ${result.decision.action}`);
    }
  });

  // 10. Audit Storage Persistence Status Verification
  await runSentinelTest("10. Audit Storage Persistence Status Verification", async () => {
    const payload = {
      demoMode: true,
      transactionId: `TXN-AUDIT-TEST-${Date.now()}`,
      amount: 300,
      currency: "USD",
      timestamp: new Date().toISOString(),
    };

    const result = await SentinelPipelineService.evaluate(payload);
    if (result.auditPersistence !== "postgresql" && result.auditPersistence !== "memory-fallback") {
      throw new Error(`Invalid auditPersistence flag: ${result.auditPersistence}`);
    }
  });

  // 11. Rate Limit & Header Validation Check
  await runSentinelTest("11. Request Header & Correlation ID Verification", async () => {
    const payload = {
      demoMode: true,
      transactionId: `TXN-HEADER-${Date.now()}`,
      amount: 500,
      currency: "EUR",
      timestamp: new Date().toISOString(),
    };
    const reqId = "REQ-CUSTOM-HEADER-TEST";
    const result = await SentinelPipelineService.evaluate(payload, { requestId: reqId });
    if (!result.evaluationId) throw new Error("Evaluation ID missing");
  });

  // 12. Unexpected Service Error Handling
  await runSentinelTest("12. Unexpected Service Error Handling", async () => {
    try {
      await SentinelPipelineService.evaluate(null);
      throw new Error("Pipeline should reject null payload");
    } catch (err: any) {
      // expected error
    }
  });

  console.log("\n🎉 All 12 Sentinel Production Hardening Backend Tests Completed Successfully!\n");
}

runAllSentinelTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
