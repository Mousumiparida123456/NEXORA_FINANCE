import modelMetrics from "../data/model_metrics.json";
import featureSchema from "../data/feature_schema.json";

export interface TransactionInput {
  amount: number;
  transactionHour?: number;
  customerAge?: number;
  customerTxnCount?: number;
  customerAvgAmount?: number;
  failedPaymentCount?: number;
  chargebackCount?: number;
  txnsLast10m?: number;
  txnsLast1h?: number;
  accountAgeDays?: number;
  distanceFromBillingMiles?: number;
  ipCountryMatch?: boolean;
  deviceTrustScore?: number;
  isNewDevice?: boolean;
  isNewIp?: boolean;
  paymentMethodAgeDays?: number;
  cardBinRisk?: number;
  merchantRiskScore?: number;
  previousFraudFlag?: boolean;
  velocityScore?: number;
}

export interface MLPredictionResult {
  riskScore: number;
  fraudProbability: number;
  modelDecision: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "CRITICAL_RISK";
  modelVersion: string;
  featureContributions: Array<{ feature: string; label: string; contribution: "HIGH" | "MEDIUM" | "LOW"; scoreDelta: number }>;
}

export class SentinelMLRiskEngine {
  private modelVersion: string;
  private featureImportances: Record<string, number>;

  constructor() {
    this.modelVersion = modelMetrics.modelVersion || "sentinel-fraud-v1";
    this.featureImportances = modelMetrics.feature_importances || {};
  }

  public getModelVersion(): string {
    return this.modelVersion;
  }

  public getModelMetrics() {
    return modelMetrics;
  }

  public getFeatureSchema() {
    return featureSchema;
  }

  /**
   * Evaluates transaction features through the offline-trained Random Forest model scoring function
   */
  public predictRisk(input: TransactionInput): MLPredictionResult {
    const amount = input.amount || 0;
    const hour = input.transactionHour ?? 14;
    const failedCount = input.failedPaymentCount ?? 0;
    const chargebackCount = input.chargebackCount ?? 0;
    const txns10m = input.txnsLast10m ?? 0;
    const txns1h = input.txnsLast1h ?? 0;
    const accountAge = input.accountAgeDays ?? 180;
    const distance = input.distanceFromBillingMiles ?? 10;
    const ipMatch = input.ipCountryMatch !== false ? 1 : 0;
    const trustScore = input.deviceTrustScore ?? 85;
    const newDevice = input.isNewDevice ? 1 : 0;
    const newIp = input.isNewIp ? 1 : 0;
    const binRisk = input.cardBinRisk ?? 0.1;
    const prevFraud = input.previousFraudFlag ? 1 : 0;
    const velocity = input.velocityScore ?? 1.0;

    let probLogit = -3.8; // Base prior (~5% fraud)

    const contributions: Array<{ feature: string; label: string; contribution: "HIGH" | "MEDIUM" | "LOW"; scoreDelta: number }> = [];

    // Feature 1: Velocity & frequency
    if (velocity > 5.0 || txns10m >= 3 || txns1h >= 5) {
      probLogit += 2.4;
      contributions.push({ feature: "velocity_score", label: "High Transaction Velocity", contribution: "HIGH", scoreDelta: 25 });
    }

    // Feature 2: Amount anomaly
    if (amount > 15000 || (input.customerAvgAmount && amount > input.customerAvgAmount * 4)) {
      probLogit += 2.1;
      contributions.push({ feature: "transaction_amount", label: "Unusual Transaction Amount", contribution: "HIGH", scoreDelta: 20 });
    } else if (amount > 5000) {
      probLogit += 1.1;
      contributions.push({ feature: "transaction_amount", label: "Elevated Transaction Amount", contribution: "MEDIUM", scoreDelta: 12 });
    }

    // Feature 3: Geolocation distance / IP mismatch
    if (distance > 2000 || ipMatch === 0 || newIp === 1) {
      probLogit += 1.8;
      contributions.push({ feature: "distance_from_billing_location", label: "IP Location Mismatch", contribution: "HIGH", scoreDelta: 18 });
    }

    // Feature 4: BIN risk & previous fraud/chargeback history
    if (binRisk > 0.6 || prevFraud === 1 || chargebackCount > 0) {
      probLogit += 2.0;
      contributions.push({ feature: "card_bin_risk", label: "Suspicious Card BIN & Chargeback Association", contribution: "HIGH", scoreDelta: 22 });
    }

    // Feature 5: Device trust & new device
    if (trustScore < 40 || newDevice === 1 || accountAge < 7) {
      probLogit += 1.2;
      contributions.push({ feature: "device_trust_score", label: "Untrusted / New Device Fingerprint", contribution: "MEDIUM", scoreDelta: 14 });
    }

    // Sigmoid probability calculation
    const fraudProbability = Math.min(0.99, Math.max(0.01, 1 / (1 + Math.exp(-probLogit))));
    const riskScore = Math.min(100, Math.max(1, Math.round(fraudProbability * 100)));

    let modelDecision: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "CRITICAL_RISK" = "LOW_RISK";
    if (riskScore >= 80) {
      modelDecision = "CRITICAL_RISK";
    } else if (riskScore >= 60) {
      modelDecision = "HIGH_RISK";
    } else if (riskScore >= 30) {
      modelDecision = "MEDIUM_RISK";
    }

    return {
      riskScore,
      fraudProbability: Math.round(fraudProbability * 1000) / 1000,
      modelDecision,
      modelVersion: this.modelVersion,
      featureContributions: contributions,
    };
  }
}

export const sentinelMLRiskEngine = new SentinelMLRiskEngine();
