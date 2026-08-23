import React from "react";
import { SentinelHeader } from "./SentinelHeader";
import { SentinelArchitectureFlow } from "./SentinelArchitectureFlow";
import { SentinelMetrics } from "./SentinelMetrics";
import { SentinelRiskBreakdown } from "./SentinelRiskBreakdown";
import { SentinelRiskTrendChart } from "./SentinelRiskTrendChart";
import { SentinelTransactionsTable } from "./SentinelTransactionsTable";
import { SentinelAIAgentSummary } from "./SentinelAIAgentSummary";
import { SentinelRiskEventsTimeline } from "./SentinelRiskEventsTimeline";

export function SentinelDashboard() {
  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header (NEXORA SENTINEL branding, merchant selector, time, status, demo banner) */}
      <SentinelHeader />

      {/* Architecture Diagram Pipeline Flow */}
      <SentinelArchitectureFlow />

      {/* 2. Top Metrics (Money at Risk, High-Risk Txns, Open Investigations, Preventable Loss) */}
      <SentinelMetrics />

      {/* 3. Risk Exposure Breakdown (Fraud, Return, Chargeback, Abuse categories) */}
      <SentinelRiskBreakdown />

      {/* 4. Risk Trend Chart (Recharts visualization over time) */}
      <SentinelRiskTrendChart />

      {/* 5. High-Risk Transactions Table (8 columns, search, filters, investigate modal) */}
      <SentinelTransactionsTable />

      {/* 6 & 7. Grid for AI Risk Agent Summary and Recent Risk Events Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SentinelAIAgentSummary />
        </div>
        <div className="lg:col-span-1">
          <SentinelRiskEventsTimeline />
        </div>
      </div>
    </div>
  );
}
