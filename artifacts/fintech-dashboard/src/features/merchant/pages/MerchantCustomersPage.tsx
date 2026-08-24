import React, { useState } from "react";
import { Users, ShieldAlert, ArrowRight, DollarSign, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export function MerchantCustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("CUS-182");

  const customers = [
    {
      id: "CUS-182",
      name: "Alex Rivera",
      email: "cus182.alex@techglobal.io",
      totalTxns: 42,
      totalSpend: "₹1,84,500",
      chargebacks: 3,
      failedPayments: 6,
      riskScore: 82,
      riskLevel: "HIGH",
      txns: [
        { id: "TXN-10982", amount: "₹25,000", date: "2026-08-24 13:42", status: "HOLD (INV-00291)", unusual: true },
        { id: "TXN-10981", amount: "₹2,900", date: "2026-08-24 13:40", status: "Completed", unusual: false },
        { id: "TXN-10978", amount: "₹1,850", date: "2026-08-24 13:10", status: "Completed", unusual: false },
        { id: "TXN-10950", amount: "₹3,400", date: "2026-08-23 18:22", status: "Completed", unusual: false },
        { id: "TXN-10901", amount: "₹2,100", date: "2026-08-22 11:05", status: "Completed", unusual: false },
      ],
    },
    {
      id: "CUS-140",
      name: "Sophia Chen",
      email: "sophia.c@example.com",
      totalTxns: 18,
      totalSpend: "₹88,200",
      chargebacks: 0,
      failedPayments: 1,
      riskScore: 32,
      riskLevel: "LOW",
      txns: [
        { id: "TXN-883910", amount: "₹12,850", date: "2026-08-24 10:20", status: "Completed", unusual: false },
      ],
    },
  ];

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white font-bold">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Customer Risk Intelligence</h1>
            <p className="text-xs text-slate-400">
              Evaluates historical customer behavior, dispute rates, and spending variance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Active Profile:</span>
          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            {activeCustomer.id} · {activeCustomer.name}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customer Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Customer Profile</h3>
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCustomerId(c.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                c.id === selectedCustomerId
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-amber-400">{c.id}</span>
                  <h4 className="text-sm font-bold text-white">{c.name}</h4>
                  <p className="text-xs text-slate-400">{c.email}</p>
                </div>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded border font-mono ${
                    c.riskLevel === "HIGH"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {c.riskScore} / {c.riskLevel}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: STEP 8 Customer Detail View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#07131e]/95 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">CUSTOMER PROFILE</span>
                <h2 className="text-xl font-black text-white">{activeCustomer.name} (<span className="font-mono text-amber-400">{activeCustomer.id}</span>)</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Assessment</span>
                <span className="text-xl font-black text-amber-400 font-mono">{activeCustomer.riskScore} / 100 ({activeCustomer.riskLevel})</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Transactions</span>
                <span className="text-lg font-black text-white font-mono">{activeCustomer.totalTxns}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Spend</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{activeCustomer.totalSpend}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Chargebacks</span>
                <span className="text-lg font-black text-red-400 font-mono">{activeCustomer.chargebacks}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Failed Payments</span>
                <span className="text-lg font-black text-amber-400 font-mono">{activeCustomer.failedPayments}</span>
              </div>
            </div>

            {/* STEP 8: CUSTOMER ACTIVITY & Unusual Transaction Highlight */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">CUSTOMER ACTIVITY · Transaction History</h3>

              <div className="space-y-2 font-mono text-xs">
                {activeCustomer.txns.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      t.unusual
                        ? "border-red-500/50 bg-red-500/15 shadow-lg shadow-red-500/5"
                        : "border-slate-800 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold">{t.id}</span>
                      <span className="text-slate-300">{t.date}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${t.unusual ? "text-red-400 text-base" : "text-white"}`}>
                        {t.amount} {t.unusual && "← UNUSUAL (5x average)"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.unusual ? "bg-red-500/30 text-red-200 border border-red-500/40" : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
