import React from "react";
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  CreditCard,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export interface RiskEvent {
  id: string;
  timestamp: string;
  timeAgo: string;
  type: "Suspicious Transaction" | "Return Risk" | "Chargeback Risk" | "Investigation Opened";
  title: string;
  description: string;
  riskValue?: string;
  riskScore?: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DEMO_RISK_EVENTS: RiskEvent[] = [
  {
    id: "EVT-109",
    timestamp: "2026-08-23 21:05:12",
    timeAgo: "5 mins ago",
    type: "Suspicious Transaction",
    title: "Suspicious transaction detected: TXN-904812",
    description: "High velocity card testing pattern (6 attempts in 3 mins) from Lagos, NG IP pool.",
    riskValue: "$2,450.00",
    riskScore: 94,
    icon: ShieldAlert,
    color: "text-red-400",
    bgColor: "bg-red-500/15",
    borderColor: "border-red-500/30",
  },
  {
    id: "EVT-108",
    timestamp: "2026-08-23 20:42:00",
    timeAgo: "28 mins ago",
    type: "Return Risk",
    title: "Return risk anomaly flagged: Customer sophia.c@example.com",
    description: "Wardrobing indicator triggered: Returned 5 electronics items in 7 days across 2 merchant accounts.",
    riskValue: "$1,890.50",
    riskScore: 88,
    icon: RefreshCw,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
  },
  {
    id: "EVT-107",
    timestamp: "2026-08-23 19:15:30",
    timeAgo: "1 hour ago",
    type: "Chargeback Risk",
    title: "Chargeback risk notice received: DISP-3310",
    description: "Card issuer pre-arbitration notice for claim of unrecognized payment on digital gift cards.",
    riskValue: "$3,200.00",
    riskScore: 91,
    icon: CreditCard,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-500/30",
  },
  {
    id: "EVT-106",
    timestamp: "2026-08-23 18:30:00",
    timeAgo: "2 hours ago",
    type: "Investigation Opened",
    title: "Investigation case #INV-409 opened by Sentinel AI Agent",
    description: "Automated triage grouped 12 related suspicious orders into single cross-merchant investigation queue.",
    riskValue: "$29,400.00",
    riskScore: 89,
    icon: Search,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    borderColor: "border-emerald-500/30",
  },
];

export function SentinelRiskEventsTimeline() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Risk Events</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time chronological timeline of detected threat vectors, return anomalies & investigation events
          </p>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
          Last 24 Hours
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="mt-5 relative space-y-6 before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-slate-800">
        {DEMO_RISK_EVENTS.map((event) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative flex items-start gap-4 pl-1">
              {/* Event Icon Node */}
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border ${event.bgColor} ${event.color} ${event.borderColor} shadow-md`}
              >
                <Icon className="h-4 w-4" />
              </span>

              {/* Event Body */}
              <div className="flex-1 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 space-y-1.5 hover:border-slate-700 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${event.bgColor} ${event.color} ${event.borderColor}`}>
                      {event.type}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100">{event.title}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{event.timeAgo}</span>
                </div>

                <p className="text-xs text-slate-300/90 leading-relaxed">{event.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400 font-mono">
                    ID: <span className="text-slate-200 font-semibold">{event.id}</span>
                  </span>
                  {event.riskValue && (
                    <span className="font-mono font-bold text-white">
                      Exposed: {event.riskValue}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
