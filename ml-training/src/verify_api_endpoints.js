const fs = require('fs');
const path = require('path');

function testApiEndpoints() {
  console.log("==================================================");
  console.log("MODEL HEALTH & PERFORMANCE API ARTIFACT VERIFICATION");
  console.log("==================================================");

  const modelPath = path.resolve(process.cwd(), "ml-training/artifacts/nexora_fraud_v1.json");
  const schemaPath = path.resolve(process.cwd(), "ml-training/artifacts/feature_schema.json");
  const metricsPath = path.resolve(process.cwd(), "ml-training/artifacts/metrics.json");
  const metadataPath = path.resolve(process.cwd(), "ml-training/artifacts/model_metadata.json");
  const impPath = path.resolve(process.cwd(), "ml-training/artifacts/feature_importance.json");

  // 1. Health Verification
  console.log("▶ 1. Verifying /api/v1/sentinel/model/health artifacts...");
  const healthExists = fs.existsSync(modelPath) && fs.existsSync(schemaPath);
  console.log("   nexora_fraud_v1.json exists: ", fs.existsSync(modelPath));
  console.log("   feature_schema.json  exists: ", fs.existsSync(schemaPath));

  const healthPayload = {
    status: healthExists ? "ready" : "unavailable",
    modelVersion: "nexora-fraud-v1",
    featureCount: 397,
    modelSource: "IEEE-CIS-XGBoost",
  };
  console.log("▶ Model Health Payload:");
  console.log(JSON.stringify(healthPayload, null, 2));

  // 2. Performance Verification
  console.log("==================================================");
  console.log("▶ 2. Verifying /api/v1/sentinel/model/performance artifacts...");
  const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  const featureImp = JSON.parse(fs.readFileSync(impPath, "utf-8"));

  console.log("▶ ROC-AUC:            ", metrics.roc_auc);
  console.log("▶ PR-AUC:             ", metrics.pr_auc);
  console.log("▶ Precision:          ", metrics.precision);
  console.log("▶ Recall:             ", metrics.recall);
  console.log("▶ F1 Score:           ", metrics.f1_score || metrics.f1);
  console.log("▶ Training Rows:      ", metadata.trainingRows);
  console.log("▶ Validation Rows:    ", metadata.validationRows);
  console.log("▶ Test Rows:          ", metadata.testRows);
  console.log("▶ Feature Count:      ", metadata.featureCount);
  const topFeatures = Array.isArray(featureImp) ? featureImp : (featureImp.top_20_features || []);
  console.log("▶ Top 5 Features:     ", topFeatures.slice(0, 5).map(f => f.feature).join(", "));
  console.log("==================================================");

  if (healthExists && metrics.roc_auc && metadata.featureCount === 397) {
    console.log("🎉 MODEL HEALTH & PERFORMANCE VERIFICATION: PASS!");
  } else {
    console.log("❌ VERIFICATION FAILED");
    process.exit(1);
  }
}

testApiEndpoints();
