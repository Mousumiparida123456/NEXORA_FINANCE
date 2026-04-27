import { logger } from "../lib/logger";

export interface Transaction {
  id?: number;
  accountId: number;
  amount: string;
  type: string;
  timestamp: Date;
  description?: string;
}

export class FraudService {
  /**
   * FAANG-Ready Fraud Detection Engine
   * Uses rule-based heuristics to flag suspicious activity
   */
  static async analyzeTransaction(tx: Transaction): Promise<{ isSuspicious: boolean; reason?: string }> {
    const amount = parseFloat(tx.amount);
    const hour = tx.timestamp.getHours();

    // Rule 1: High value transaction alert (> ₹1,00,000)
    if (amount > 100000) {
      logger.warn({ txId: tx.id, amount }, "High value transaction flagged");
      return { isSuspicious: true, reason: "Unusually high transaction value" };
    }

    // Rule 2: Night-time activity alert (1 AM - 5 AM)
    if (hour >= 1 && hour <= 5) {
      logger.warn({ txId: tx.id, hour }, "Night-time transaction flagged");
      return { isSuspicious: true, reason: "Transaction outside of normal active hours" };
    }

    // Rule 3: Rapid succession transactions (Simulated)
    // In a real FAANG system, we would check Redis for the last X transactions in Y seconds.
    
    return { isSuspicious: false };
  }
}
