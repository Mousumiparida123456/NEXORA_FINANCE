import { z } from "zod";

/**
 * STEP 1C — Transaction Contract Schema
 * Validates request payload against required merchant transaction contract with fallback defaults.
 */
export const TransactionEvaluationSchema = z.object({
  transactionId: z.string().optional().default(() => `TXN-${Math.floor(Math.random() * 899999) + 100000}`),
  merchantId: z.string().optional().default("MER-89420"),
  customerId: z.string().optional().default("CUST-1049"),

  amount: z.number({ required_error: "Transaction amount is required" }).positive("Amount must be a positive number"),
  currency: z.string().optional().default("INR"),

  ipAddress: z.string().optional().default("103.21.244.0"),
  country: z.string().optional().default("IN"),
  deviceId: z.string().optional().default("DEV-FINGERPRINT-DEFAULT"),

  paymentMethod: z.string().optional().default("CREDIT_CARD"),

  timestamp: z.string().optional().default(() => new Date().toISOString()),

  // Optional behavioral & velocity context for 13 risk signals computation
  accountAgeDays: z.number().min(0).optional().default(180),
  velocityLast24h: z.number().min(0).optional().default(1),
  deviceTrustScore: z.number().min(0).max(100).optional().default(85),
  ipReputationScore: z.number().min(0).max(100).optional().default(15),
  geoDistanceKm: z.number().min(0).optional().default(5),
  merchantRiskScore: z.number().min(0).max(100).optional().default(20),
  paymentMethodVelocity: z.number().min(0).optional().default(1),
  pastChargebackCount: z.number().min(0).optional().default(0),
  customerHistoryScore: z.number().min(0).max(100).optional().default(90),
  unusualAmountRatio: z.number().min(0).optional().default(1.0),
  failedPaymentAttempts: z.number().min(0).optional().default(0),
  behavioralDeviationScore: z.number().min(0).max(100).optional().default(10),
});

export type TransactionEvaluationInput = z.infer<typeof TransactionEvaluationSchema>;
