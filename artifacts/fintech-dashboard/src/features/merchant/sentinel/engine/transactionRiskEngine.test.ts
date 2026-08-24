import { DeterministicRiskEngine, TransactionFeatureInput } from "./transactionRiskEngine";

function runTests() {
  console.log("=========================================");
  console.log("  SENTINEL RISK ENGINE UNIT TEST SUITE   ");
  console.log("=========================================\n");

  const engine = new DeterministicRiskEngine();

  // Test 1: Low Risk Scenario
  const lowRiskTx: TransactionFeatureInput = {
    transactionId: "TX-LOW-001",
    amount: 150,
    velocityPerHour: 1,
    failedAttempts: 0,
    customerHistoryCount: 25,
    isNewCustomer: false,
    isNewDevice: false,
    isUnusualAmount: false,
    isUnusualTime: false,
    returnHistoryCount: 0,
    chargebackHistoryCount: 0,
    transactionVelocity24h: 2,
  };

  const lowResult = engine.evaluateTransaction(lowRiskTx);
  console.log(`[TEST 1] Low Risk Tx Score: ${lowResult.riskScore} | Level: ${lowResult.level} | Action: ${lowResult.recommendedAction}`);
  if (lowResult.level !== "LOW" || lowResult.riskScore > 30) {
    throw new Error(`Test 1 Failed: Expected LOW level (0-30), got ${lowResult.level} (${lowResult.riskScore})`);
  }
  console.log("✅ TEST 1 PASSED: LOW risk classification validated\n");

  // Test 2: Medium Risk Scenario (Target Score: 48 => MEDIUM)
  const mediumRiskTx: TransactionFeatureInput = {
    transactionId: "TX-MED-002",
    amount: 1200,
    velocityPerHour: 2,
    failedAttempts: 1, // 12 pts
    customerHistoryCount: 2,
    isNewCustomer: true, // 8 pts
    isNewDevice: true, // 10 pts
    isUnusualAmount: false,
    isUnusualTime: false,
    returnHistoryCount: 2, // 16 pts
    chargebackHistoryCount: 0,
    transactionVelocity24h: 3,
  };

  const medResult = engine.evaluateTransaction(mediumRiskTx);
  console.log(`[TEST 2] Medium Risk Tx Score: ${medResult.riskScore} | Level: ${medResult.level} | Action: ${medResult.recommendedAction}`);
  if (medResult.level !== "MEDIUM" || medResult.riskScore < 31 || medResult.riskScore > 70) {
    throw new Error(`Test 2 Failed: Expected MEDIUM level (31-70), got ${medResult.level} (${medResult.riskScore})`);
  }
  console.log("✅ TEST 2 PASSED: MEDIUM risk classification validated\n");

  // Test 3: High Risk Scenario (Target Score: 78 => HIGH)
  const highRiskTx: TransactionFeatureInput = {
    transactionId: "TX-HIGH-003",
    amount: 2000,
    velocityPerHour: 4, // (4-2)*8 = 16 pts
    failedAttempts: 2, // 24 pts
    customerHistoryCount: 0,
    isNewCustomer: true, // 8 pts
    isNewDevice: true, // 10 pts
    isUnusualAmount: true, // 20 pts
    isUnusualTime: false,
    returnHistoryCount: 0,
    chargebackHistoryCount: 0,
    transactionVelocity24h: 4,
  };

  const highResult = engine.evaluateTransaction(highRiskTx);
  console.log(`[TEST 3] High Risk Tx Score: ${highResult.riskScore} | Level: ${highResult.level} | Action: ${highResult.recommendedAction}`);
  if (highResult.level !== "HIGH" || highResult.riskScore < 71 || highResult.riskScore > 85) {
    throw new Error(`Test 3 Failed: Expected HIGH level (71-85), got ${highResult.level} (${highResult.riskScore})`);
  }
  console.log("✅ TEST 3 PASSED: HIGH risk classification validated\n");

  // Test 4: Critical Risk Scenario (Target Score: 100 => CRITICAL)
  const criticalRiskTx: TransactionFeatureInput = {
    transactionId: "TX-CRIT-004",
    amount: 14500, // 15 pts
    velocityPerHour: 8, // max 25 pts
    failedAttempts: 3, // 30 pts
    customerHistoryCount: 0,
    isNewCustomer: true, // 8 pts
    isNewDevice: true, // 10 pts
    isUnusualAmount: true, // 20 pts
    isUnusualTime: true, // 10 pts
    returnHistoryCount: 4, // 24 pts
    chargebackHistoryCount: 2, // max 60 pts
    transactionVelocity24h: 12,
  };

  const critResult = engine.evaluateTransaction(criticalRiskTx);
  console.log(`[TEST 4] Critical Risk Tx Score: ${critResult.riskScore} | Level: ${critResult.level} | Action: ${critResult.recommendedAction}`);
  console.log("Risk Factors Identified:");
  critResult.factors.forEach((f) => console.log(` - ${f.name}: +${f.contribution} (${f.description})`));
  if (critResult.level !== "CRITICAL" || critResult.riskScore < 86) {
    throw new Error(`Test 4 Failed: Expected CRITICAL level (86-100), got ${critResult.level} (${critResult.riskScore})`);
  }
  if (critResult.riskScore > 100) {
    throw new Error(`Test 4 Failed: Score exceeded 100 cap: ${critResult.riskScore}`);
  }
  console.log("✅ TEST 4 PASSED: CRITICAL risk classification & 100 cap validated\n");

  console.log("=========================================");
  console.log("  ALL RISK ENGINE TESTS PASSED CLEANLY   ");
  console.log("=========================================");
}

runTests();
