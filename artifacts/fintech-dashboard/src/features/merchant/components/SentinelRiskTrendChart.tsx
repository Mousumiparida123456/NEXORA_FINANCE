import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar, TrendingUp, Filter, ShieldAlert } from "lucide-react";

const DEMO_TREND_DATA_7D = [
  { date: "Aug 17", fraud: 8400, returnRisk: 4200, chargeback: 3100, abuse: 1800, total: 17500 },
  { date: "Aug 18", fraud: 9200, returnRisk: 5100, chargeback: 3800, abuse: 1900, total: 20000 },
  { date: "Aug 19", fraud: 7600, returnRisk: 4800, chargeback: 3500, abuse: 1600, total: 17500 },
  { date: "Aug 20", fraud: 11400, returnRisk: 6200, chargeback: 4900, abuse: 2200, total: 24700 },
  { date: "Aug 21", fraud: 13800, returnRisk: 7500, chargeback: 5600, abuse: 2800, total: 29700 },
  { date: "Aug 22", fraud: 10200, returnRisk: 6900, chargeback: 4200, abuse: 2400, total: 23700 },
  { date: "Aug 23", fraud: 12400, returnRisk: 7800, chargeback: 5100, abuse: 2600, total: 27900 },
];

const DEMO_TREND_DATA_30D = [
  { date: "W1 Jul", fraud: 28000, returnRisk: 14000, chargeback: 11000, abuse: 5400, total: 58400 },
  { date: "W2 Jul", fraud: 32000, returnRisk: 16500, chargeback: 12800, abuse: 6100, total: 67400 },
  { date: "W3 Jul", fraud: 41000, returnRisk: 21000, chargeback: 15400, abuse: 7900, total: 85300 },
  { date: "W4 Jul", fraud: 38000, returnRisk: 19500, chargeback: 14200, abuse: 7100, total: 78800 },
  { date: "W1 Aug", fraud: 45000, returnRisk: 24000, chargeback: 18100, abuse: 9200, total: 96300 },
  { date: "W2 Aug", fraud: 52000, returnRisk: 28500, chargeback: 21000, abuse: 11500, total: 113000 },
  { date: "W3 Aug", fraud: 62400, returnRisk: 38250, chargeback: 28100, abuse: 14100, total: 142850 },
];

export function SentinelRiskTrendChart() {
  const [timeframe, setTimeframe] = useState<"7D" | "30D">("7D");
  const [activeVector, setActiveVector] = useState<string>("ALL");

  const data = timeframe === "7D" ? DEMO_TREND_DATA_7D : DEMO_TREND_DATA_30D;

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md">
      {/* Chart Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Risk Exposure Over Time</h2>
          </div>
          <p className="text-xs text-slate-400">
            Historical aggregate financial risk trajectory across fraud, return, chargeback, and abuse vectors
          </p>
        </div>

        {/* Controls: Timeframe & Vector Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            {["ALL", "fraud", "returnRisk", "chargeback", "abuse"].map((key) => {
              const labelMap: Record<string, string> = {
                ALL: "All Vectors",
                fraud: "Fraud",
                returnRisk: "Return",
                chargeback: "Chargeback",
                abuse: "Abuse",
              };
              const active = activeVector === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveVector(key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                    active
                      ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {labelMap[key]}
                </button>
              );
            })}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setTimeframe("7D")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                timeframe === "7D"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe("30D")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                timeframe === "30D"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Chart Visual */}
      <div className="mt-5 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chargebackGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="abuseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#64748b"
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `$${v / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a1829",
                borderColor: "#1e293b",
                borderRadius: "0.75rem",
                color: "#f8fafc",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
            />
            <Legend
              wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
              iconType="circle"
            />

            {(activeVector === "ALL" || activeVector === "fraud") && (
              <Area
                type="monotone"
                dataKey="fraud"
                name="Fraud Risk"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fraudGrad)"
              />
            )}
            {(activeVector === "ALL" || activeVector === "returnRisk") && (
              <Area
                type="monotone"
                dataKey="returnRisk"
                name="Return Risk"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#returnGrad)"
              />
            )}
            {(activeVector === "ALL" || activeVector === "chargeback") && (
              <Area
                type="monotone"
                dataKey="chargeback"
                name="Chargeback Risk"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chargebackGrad)"
              />
            )}
            {(activeVector === "ALL" || activeVector === "abuse") && (
              <Area
                type="monotone"
                dataKey="abuse"
                name="Abuse Risk"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#abuseGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 block">Peak Risk Day</span>
          <span className="font-bold text-slate-200">Aug 21 ($29,700)</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 block">Avg Daily Risk</span>
          <span className="font-bold text-slate-200">$23,000 / day</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 block">Fastest Growing Vector</span>
          <span className="font-bold text-amber-400">Return Abuse (+18%)</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 block">Current Trajectory</span>
          <span className="font-bold text-red-400">Elevated Trend</span>
        </div>
      </div>
    </div>
  );
}
