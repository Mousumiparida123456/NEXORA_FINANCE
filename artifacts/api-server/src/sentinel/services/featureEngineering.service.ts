import { TransactionPayload, RiskSignal, FeatureVector } from "../types/sentinel.types";

export class FeatureEngineeringService {
  /**
   * STEP 1D — Build 13 Measurable Risk Signals
   * Computes normalized feature values (0.0 = low risk, 1.0 = high risk) for all 13 risk signals.
   */
  public static extractFeatures(payload: TransactionPayload): {
    signals: RiskSignal[];
    vector: FeatureVector;
  } {
    const signals: RiskSignal[] = [];

    // Helper to clamp values between 0.0 and 1.0
    const clamp = (val: number) => Math.min(1.0, Math.max(0.0, val));

    // 1. transactionAmount (Normalized 0.0 to 1.0)
    const amount = payload.amount || 0;
    const amountNorm = clamp(amount / 150000);
    signals.push({
      id: "SIG-01",
      name: "transactionAmount",
      category: "amount",
      normalizedScore: Number(amountNorm.toFixed(3)),
      score: Math.round(amountNorm * 100),
      severity: amountNorm >= 0.75 ? "critical" : amountNorm >= 0.5 ? "high" : "low",
      details: `Transaction amount of ₹${amount.toLocaleString()} normalized against baseline`,
      weight: 0.10,
    });

    // 2. transactionVelocity (Normalized 0.0 to 1.0)
    const velocity = payload.velocityLast24h ?? 1;
    const velocityNorm = clamp(velocity / 10);
    signals.push({
      id: "SIG-02",
      name: "transactionVelocity",
      category: "velocity",
      normalizedScore: Number(velocityNorm.toFixed(3)),
      score: Math.round(velocityNorm * 100),
      severity: velocityNorm >= 0.8 ? "critical" : velocityNorm >= 0.5 ? "high" : "low",
      details: `${velocity} transaction attempts registered in past 24h window`,
      weight: 0.18,
    });

    // 3. accountAge (Normalized 0.0 to 1.0: New account < 30 days = High Risk)
    const ageDays = payload.accountAgeDays ?? 180;
    const accountAgeNorm = clamp(1.0 - ageDays / 180);
    signals.push({
      id: "SIG-03",
      name: "accountAge",
      category: "behavior",
      normalizedScore: Number(accountAgeNorm.toFixed(3)),
      score: Math.round(accountAgeNorm * 100),
      severity: accountAgeNorm >= 0.7 ? "high" : accountAgeNorm >= 0.4 ? "medium" : "low",
      details: `Account tenure is ${ageDays} days`,
      weight: 0.08,
    });

    // 4. deviceRisk (Normalized 0.0 to 1.0)
    const deviceTrust = payload.deviceTrustScore ?? 85;
    const deviceRiskNorm = clamp(1.0 - deviceTrust / 100);
    signals.push({
      id: "SIG-04",
      name: "deviceRisk",
      category: "device",
      normalizedScore: Number(deviceRiskNorm.toFixed(3)),
      score: Math.round(deviceRiskNorm * 100),
      severity: deviceRiskNorm >= 0.7 ? "high" : deviceRiskNorm >= 0.4 ? "medium" : "low",
      details: `Device trust fingerprint score rated ${deviceTrust}/100`,
      weight: 0.06,
    });

    // 5. ipReputation (Normalized 0.0 to 1.0)
    const ipRep = payload.ipReputationScore ?? 15;
    const ipRepNorm = clamp(ipRep / 100);
    signals.push({
      id: "SIG-05",
      name: "ipReputation",
      category: "reputation",
      normalizedScore: Number(ipRepNorm.toFixed(3)),
      score: Math.round(ipRepNorm * 100),
      severity: ipRepNorm >= 0.7 ? "critical" : ipRepNorm >= 0.4 ? "medium" : "low",
      details: `Connection IP address reputation risk level at ${(ipRepNorm * 100).toFixed(0)}%`,
      weight: 0.05,
    });

    // 6. geoDistance (Normalized 0.0 to 1.0)
    const distanceKm = payload.geoDistanceKm ?? 5;
    const geoNorm = clamp(distanceKm / 1000);
    signals.push({
      id: "SIG-06",
      name: "geoDistance",
      category: "geo",
      normalizedScore: Number(geoNorm.toFixed(3)),
      score: Math.round(geoNorm * 100),
      severity: geoNorm >= 0.6 ? "high" : "low",
      details: `Physical distance from billing residence is ${distanceKm} km`,
      weight: 0.04,
    });

    // 7. merchantRisk (Normalized 0.0 to 1.0)
    const merchantRiskScore = payload.merchantRiskScore ?? 20;
    const merchantNorm = clamp(merchantRiskScore / 100);
    signals.push({
      id: "SIG-07",
      name: "merchantRisk",
      category: "amount",
      normalizedScore: Number(merchantNorm.toFixed(3)),
      score: Math.round(merchantNorm * 100),
      severity: merchantNorm >= 0.7 ? "high" : "low",
      details: `Merchant risk rating category evaluated at ${(merchantNorm * 100).toFixed(0)}%`,
      weight: 0.1447,
    });

    // 8. paymentVelocity (Normalized 0.0 to 1.0)
    const payVel = payload.paymentMethodVelocity ?? 1;
    const payVelNorm = clamp(payVel / 5);
    signals.push({
      id: "SIG-08",
      name: "paymentVelocity",
      category: "velocity",
      normalizedScore: Number(payVelNorm.toFixed(3)),
      score: Math.round(payVelNorm * 100),
      severity: payVelNorm >= 0.7 ? "critical" : "low",
      details: `${payVel} payment method switches in current session`,
      weight: 0.10,
    });

    // 9. chargebackHistory (Normalized 0.0 to 1.0)
    const cbCount = payload.pastChargebackCount ?? 0;
    const cbNorm = clamp(cbCount / 3);
    signals.push({
      id: "SIG-09",
      name: "chargebackHistory",
      category: "reputation",
      normalizedScore: Number(cbNorm.toFixed(3)),
      score: Math.round(cbNorm * 100),
      severity: cbNorm > 0 ? "critical" : "low",
      details: `${cbCount} past chargeback disputes recorded on file`,
      weight: 0.031,
    });

    // 10. customerHistory (Normalized 0.0 to 1.0: Lower history score = High Risk)
    const custHist = payload.customerHistoryScore ?? 90;
    const custHistNorm = clamp(1.0 - custHist / 100);
    signals.push({
      id: "SIG-10",
      name: "customerHistory",
      category: "reputation",
      normalizedScore: Number(custHistNorm.toFixed(3)),
      score: Math.round(custHistNorm * 100),
      severity: custHistNorm >= 0.6 ? "high" : "low",
      details: `Customer historical baseline trust metric at ${custHist}/100`,
      weight: 0.05,
    });

    // 11. unusualAmount (Normalized 0.0 to 1.0)
    const ratio = payload.unusualAmountRatio ?? 1.0;
    const unusualNorm = clamp((ratio - 1.0) / 4.0);
    signals.push({
      id: "SIG-11",
      name: "unusualAmount",
      category: "amount",
      normalizedScore: Number(unusualNorm.toFixed(3)),
      score: Math.round(unusualNorm * 100),
      severity: unusualNorm >= 0.6 ? "high" : "low",
      details: `Amount is ${ratio.toFixed(1)}x customer's typical order size`,
      weight: 0.08,
    });

    // 12. failedPaymentAttempts (Normalized 0.0 to 1.0)
    const failedAttempts = payload.failedPaymentAttempts ?? 0;
    const failedNorm = clamp(failedAttempts / 5);
    signals.push({
      id: "SIG-12",
      name: "failedPaymentAttempts",
      category: "behavior",
      normalizedScore: Number(failedNorm.toFixed(3)),
      score: Math.round(failedNorm * 100),
      severity: failedNorm >= 0.6 ? "critical" : "low",
      details: `${failedAttempts} recent declined payment attempts`,
      weight: 0.08,
    });

    // 13. behavioralDeviation (Normalized 0.0 to 1.0)
    const behDev = payload.behavioralDeviationScore ?? 10;
    const behDevNorm = clamp(behDev / 100);
    signals.push({
      id: "SIG-13",
      name: "behavioralDeviation",
      category: "behavior",
      normalizedScore: Number(behDevNorm.toFixed(3)),
      score: Math.round(behDevNorm * 100),
      severity: behDevNorm >= 0.7 ? "high" : "low",
      details: `Session navigation and typing speed anomaly rating at ${behDev}%`,
      weight: 0.05,
    });

    // Construct normalized feature vector
    const vector: FeatureVector = {
      transactionAmount: Number(amountNorm.toFixed(3)),
      transactionVelocity: Number(velocityNorm.toFixed(3)),
      accountAge: Number(accountAgeNorm.toFixed(3)),
      deviceRisk: Number(deviceRiskNorm.toFixed(3)),
      ipReputation: Number(ipRepNorm.toFixed(3)),
      geoDistance: Number(geoNorm.toFixed(3)),
      merchantRisk: Number(merchantNorm.toFixed(3)),
      paymentVelocity: Number(payVelNorm.toFixed(3)),
      chargebackHistory: Number(cbNorm.toFixed(3)),
      customerHistory: Number(custHistNorm.toFixed(3)),
      unusualAmount: Number(unusualNorm.toFixed(3)),
      failedPaymentAttempts: Number(failedNorm.toFixed(3)),
      behavioralDeviation: Number(behDevNorm.toFixed(3)),
    };

    return { signals, vector };
  }
}
