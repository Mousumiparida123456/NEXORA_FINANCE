import { z } from "zod";

export const TransactionEvaluationSchema = z.object({
  transactionId: z.string().optional().default(() => `TXN-${Math.floor(Math.random() * 899999) + 100000}`),
  merchantId: z.string().optional().default("MER-89420"),
  customerId: z.string().optional().default("CUST-1049"),
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.string().optional().default("INR"),
  cardCountry: z.string().optional().default("IN"),
  ipAddress: z.string().optional().default("103.21.244.0"),
  ipCountry: z.string().optional().default("IN"),
  deviceFingerprint: z.string().optional().default("DEV-FINGERPRINT-DEFAULT"),
  deviceTrustScore: z.number().min(0).max(100).optional().default(85),
  customerEmail: z.string().email().optional().default("customer@example.com"),
  accountAgeDays: z.number().min(0).optional().default(180),
  velocityLast24h: z.number().min(0).optional().default(1),
  pastChargebackCount: z.number().min(0).optional().default(0),
  category: z.string().optional().default("electronics"),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
});

export type TransactionEvaluationInput = z.infer<typeof TransactionEvaluationSchema>;
