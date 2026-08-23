import { AIRecommendation } from "../recommendations/recommendationEngine";
import { auditTrailService } from "@/core/auditTrail";

export type HumanDecisionType = "APPROVED" | "BLOCKED" | "ESCALATED" | "PENDING";

export interface HumanApprovalRecord {
  approvalId: string;
  transactionId: string;
  recommendationId: string;
  operatorId: string;
  decision: HumanDecisionType;
  notes: string;
  decidedAt: string;
}

export class HumanApprovalWorkflow {
  private approvals: Map<string, HumanApprovalRecord> = new Map();

  public submitDecision(
    transactionId: string,
    recommendationId: string,
    operatorId: string,
    decision: HumanDecisionType,
    notes: string,
    category: "Fraud" | "Return" | "Chargeback" | "Abuse"
  ): HumanApprovalRecord {
    const record: HumanApprovalRecord = {
      approvalId: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionId,
      recommendationId,
      operatorId,
      decision,
      notes,
      decidedAt: new Date().toISOString(),
    };

    this.approvals.set(transactionId, record);

    // Write to unified Audit Trail
    auditTrailService.logEvent({
      domain: "MERCHANT_SENTINEL",
      actor: `Human Operator (${operatorId})`,
      action: `Human Decision: ${decision} Order ${transactionId}`,
      category,
      details: notes || `Merchant operator executed ${decision} for transaction ${transactionId}.`,
      severity: decision === "BLOCKED" ? "critical" : decision === "APPROVED" ? "info" : "warning",
    });

    return record;
  }

  public getDecision(transactionId: string): HumanApprovalRecord | undefined {
    return this.approvals.get(transactionId);
  }
}

export const humanApprovalWorkflow = new HumanApprovalWorkflow();
