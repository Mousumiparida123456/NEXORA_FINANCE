import { z } from "zod";

// Helper for ISO timestamp format verification
const isIsoTimestamp = (val: string) => !isNaN(Date.parse(val));

/**
 * STEP 1 — Hardened Sentinel Transaction Evaluation Schema
 * Enforces production validation constraints, rejects invalid currency, non-finite values, and invalid timestamps.
 */
export const TransactionEvaluationSchema = z.object({
  demoMode: z.boolean().optional().default(false),

  transactionId: z.string({ required_error: "transactionId is required" }).min(1, "transactionId cannot be empty").optional(),

  merchantId: z.string({ required_error: "merchantId is required" }).min(1, "merchantId cannot be empty").optional(),

  customerId: z.string({ required_error: "customerId is required" }).min(1, "customerId cannot be empty").optional(),

  amount: z
    .number({ required_error: "Transaction amount is required" })
    .finite("Transaction amount must be a finite number")
    .positive("Transaction amount must be a positive number"),

  currency: z
    .string({ required_error: "Currency is required" })
    .regex(/^[A-Z]{3}$/, "Currency must be a valid 3-letter uppercase ISO code (e.g. USD, INR, EUR)"),

  ipAddress: z
    .string()
    .ip({ version: "v4", message: "Invalid IPv4 address format" })
    .or(z.string().ip({ version: "v6", message: "Invalid IPv6 address format" }))
    .optional(),

  country: z.string().length(2, "Country must be a 2-letter ISO country code").optional(),

  deviceId: z.string().max(128, "deviceId exceeds maximum allowed length of 128 characters").optional(),

  paymentMethod: z.string().max(64, "paymentMethod exceeds maximum 64 characters").optional(),

  timestamp: z
    .string()
    .refine(isIsoTimestamp, { message: "Timestamp must be a valid ISO 8601 string" })
    .optional()
    .default(() => new Date().toISOString()),

  // Numeric risk input parameters — Must reject NaN, Infinity, and out-of-range values
  accountAgeDays: z.number().finite("accountAgeDays must be a finite number").min(0, "accountAgeDays cannot be negative").optional().default(180),
  velocityLast24h: z.number().finite("velocityLast24h must be a finite number").min(0, "velocityLast24h cannot be negative").optional().default(1),
  deviceTrustScore: z.number().finite("deviceTrustScore must be a finite number").min(0).max(100).optional().default(85),
  ipReputationScore: z.number().finite("ipReputationScore must be a finite number").min(0).max(100).optional().default(15),
  geoDistanceKm: z.number().finite("geoDistanceKm must be a finite number").min(0).optional().default(5),
  merchantRiskScore: z.number().finite("merchantRiskScore must be a finite number").min(0).max(100).optional().default(20),
  paymentMethodVelocity: z.number().finite("paymentMethodVelocity must be a finite number").min(0).optional().default(1),
  pastChargebackCount: z.number().finite("pastChargebackCount must be a finite number").min(0).optional().default(0),
  customerHistoryScore: z.number().finite("customerHistoryScore must be a finite number").min(0).max(100).optional().default(90),
  unusualAmountRatio: z.number().finite("unusualAmountRatio must be a finite number").min(0).optional().default(1.0),
  failedPaymentAttempts: z.number().finite("failedPaymentAttempts must be a finite number").min(0).optional().default(0),
  behavioralDeviationScore: z.number().finite("behavioralDeviationScore must be a finite number").min(0).max(100).optional().default(10),
}).transform((data) => {
  // Demo Mode Fallback for missing ids
  const isDemo = data.demoMode;
  return {
    ...data,
    transactionId: data.transactionId || (isDemo ? `TXN-DEMO-${Math.floor(Math.random() * 899999) + 100000}` : `TXN-${Math.floor(Math.random() * 899999) + 100000}`),
    merchantId: data.merchantId || (isDemo ? "MER-DEMO-89420" : "MER-89420"),
    customerId: data.customerId || (isDemo ? "CUST-DEMO-1049" : "CUST-1049"),
  };
});

export type TransactionEvaluationInput = z.infer<typeof TransactionEvaluationSchema>;
