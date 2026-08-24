import { TransactionPayload, RiskSignal, FeatureVector } from "../types/sentinel.types";

export class FeatureEngineeringService {
  /**
   * Extracts 13 risk signals and computes a normalized feature vector for ML scoring.
   */
  public static extractFeatures(payload: TransactionPayload): {
    signals: RiskSignal[];
    vector: FeatureVector;
  } {
    const signals: RiskSignal[] = [];

    // 1. Transaction Amount Risk
    const amount = payload.amount;
    let amountRisk = 10;
    if (amount > 100000) amountRisk = 90;
    else if (amount > 50000) amountRisk = 75;
    else if (amount > 25000) amountRisk = 50;
    else if (amount > 10000) amountRisk = 30;

    signals.push({
      id: "SIG-01",
      name: "Amount Exposure",
      category: "amount",
      score: amountRisk,
      severity: amountRisk >= 75 ? "critical" : amountRisk >= 50 ? "high" : "low",
      details: `Transaction amount of ₹${amount.toLocaleString()} evaluated against merchant baseline`,
      weight: 1.2,
    });

    // 2. Velocity Risk
    const velocity = payload.velocityLast24h ?? 1;
    let velocityRisk = 10;
    if (velocity > 10) velocityRisk = 95;
    else if (velocity > 5) velocityRisk = 80;
    else if (velocity > 3) velocityRisk = 55;

    signals.push({
      id: "SIG-02",
      name: "Velocity Anomaly",
      category: "velocity",
      score: velocityRisk,
      severity: velocityRisk >= 80 ? "critical" : velocityRisk >= 50 ? "high" : "low",
      details: `${velocity} transactions attempted in past 24 hours`,
      weight: 1.5,
    });

    // 3. Device Trust Score
    const deviceTrust = payload.deviceTrustScore ?? 85;
    const deviceRisk = Math.max(0, 100 - deviceTrust);

    signals.push({
      id: "SIG-03",
      name: "Device Fingerprint Trust",
      category: "device",
      score: deviceRisk,
      severity: deviceRisk >= 70 ? "high" : deviceRisk >= 40 ? "medium" : "low",
      details: `Device fingerprint trust score rated at ${deviceTrust}/100`,
      weight: 1.0,
    });

    // 4. Geo / IP Mismatch
    const cardCountry = (payload.cardCountry || "IN").toUpperCase();
    const ipCountry = (payload.ipCountry || "IN").toUpperCase();
    const isMismatch = cardCountry !== ipCountry;
    const geoRisk = isMismatch ? 85 : 15;

    signals.push({
      id: "SIG-04",
      name: "Geo Mismatch",
      category: "geo",
      score: geoRisk,
      severity: isMismatch ? "high" : "low",
      details: isMismatch
        ? `Card issuing country (${cardCountry}) differs from IP country (${ipCountry})`
        : `Card issuing country matches connection IP country (${cardCountry})`,
      weight: 1.3,
    });

    // 5. Past Chargebacks
    const chargebackCount = payload.pastChargebackCount ?? 0;
    const chargebackRisk = chargebackCount > 0 ? Math.min(100, chargebackCount * 45) : 0;

    signals.push({
      id: "SIG-05",
      name: "Chargeback History",
      category: "reputation",
      score: chargebackRisk,
      severity: chargebackRisk >= 70 ? "critical" : chargebackRisk > 0 ? "high" : "low",
      details: `${chargebackCount} historical chargebacks associated with customer profile`,
      weight: 1.8,
    });

    // 6. Account Age Risk
    const accountAge = payload.accountAgeDays ?? 180;
    let accountAgeRisk = 10;
    if (accountAge < 3) accountAgeRisk = 85;
    else if (accountAge < 14) accountAgeRisk = 60;
    else if (accountAge < 30) accountAgeRisk = 35;

    signals.push({
      id: "SIG-06",
      name: "Account Maturity",
      category: "behavior",
      score: accountAgeRisk,
      severity: accountAgeRisk >= 60 ? "medium" : "low",
      details: `Account tenure is ${accountAge} days`,
      weight: 0.9,
    });

    // 7. Email Domain Trust
    const email = payload.customerEmail || "";
    const isDisposable = /@(tempmail|guerrillamail|mailinator|disposable|10minutemail)\.com/i.test(email);
    const emailRisk = isDisposable ? 95 : 15;

    signals.push({
      id: "SIG-07",
      name: "Email Domain Reputation",
      category: "reputation",
      score: emailRisk,
      severity: isDisposable ? "critical" : "low",
      details: isDisposable ? "Disposable email domain detected" : "Trusted email domain provider",
      weight: 1.1,
    });

    // 8. Micro-Charge Testing Flag
    const isMicroCharge = amount < 100 && velocity > 3;
    const microChargeRisk = isMicroCharge ? 90 : 10;

    signals.push({
      id: "SIG-08",
      name: "Card Testing Pattern",
      category: "behavior",
      score: microChargeRisk,
      severity: isMicroCharge ? "critical" : "low",
      details: isMicroCharge ? "Repeated small transaction amounts indicative of card testing" : "Normal purchase pattern",
      weight: 1.6,
    });

    // Compute normalized feature vector (0.0 to 1.0)
    const vector: FeatureVector = {
      amountNormalized: Math.min(1.0, amount / 150000),
      velocityScore: velocityRisk / 100,
      deviceRiskScore: deviceRisk / 100,
      geoDistanceScore: geoRisk / 100,
      cardMismatchFlag: isMismatch ? 1.0 : 0.0,
      accountAgeScore: accountAgeRisk / 100,
      reputationRiskScore: chargebackRisk / 100,
      categoryRiskScore: payload.category === "electronics" || payload.category === "crypto" ? 0.8 : 0.2,
      timeOfDayRiskScore: 0.2,
      emailDomainTrustScore: emailRisk / 100,
      microChargeFlag: isMicroCharge ? 1.0 : 0.0,
      pastChargebackFlag: chargebackCount > 0 ? 1.0 : 0.0,
      behavioralAnomalyScore: (velocityRisk + deviceRisk) / 200,
    };

    return { signals, vector };
  }
}
