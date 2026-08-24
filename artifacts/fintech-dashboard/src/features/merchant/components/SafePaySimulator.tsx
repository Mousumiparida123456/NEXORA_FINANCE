import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Lock,
  Search,
  Bot,
  RefreshCw,
  Loader2,
  DollarSign,
  Activity,
  User,
} from "lucide-react";
import { useSentinelState } from "../context/SentinelContext";

export function SafePaySimulator() {
  const [, setLocation] = useLocation();
  const { simulateDemoPayment } = useSentinelState() as any;

  const [recipient, setRecipient] = useState("demo-risk-recipient@upi");
  const [amount, setAmount] = useState("25000");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const [analysisState, setAnalysisState] = useState<"IDLE" | "ANALYZING" | "RESULT">("IDLE");
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Checking recipient threat database",
    "Checking transaction history",
    "Checking payment velocity",
    "Checking active risk rules",
    "Calculating risk score",
  ];

  const handleCheckAndPay = () => {
    setAnalysisState("ANALYZING");
    setActiveStep(0);

    // Step by step animation
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < steps.length) {
        setActiveStep(current);
      } else {
        clearInterval(interval);
        setAnalysisState("RESULT");
        if (simulateDemoPayment) {
          simulateDemoPayment();
        }
      }
    }, 450);
  };

  const handleReset = () => {
    setAnalysisState("IDLE");
    setActiveStep(0);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07131e]/95 p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">SafePay · Payment Risk Protection</h2>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono">
              Demo Story Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate payment requests to demonstrate real-time risk signal analysis, hold enforcement, and automated triage.
          </p>
        </div>

        {analysisState === "RESULT" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset Simulator
          </button>
        )}
      </div>

      {/* Simulator Main Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (Step 2) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" /> Payment Protection Form
            </h3>

            {/* Recipient Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Recipient UPI / VPA</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={analysisState !== "IDLE"}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={analysisState !== "IDLE"}
                  className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900/90 pl-8 pr-3.5 text-sm font-extrabold text-white font-mono focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={analysisState !== "IDLE"}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
              >
                <option value="UPI">UPI Instant Payment</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="NETBANKING">NetBanking Transfer</option>
              </select>
            </div>

            {/* CHECK & PAY Button */}
            <button
              onClick={handleCheckAndPay}
              disabled={analysisState !== "IDLE"}
              className="w-full h-11 mt-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs font-extrabold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analysisState === "ANALYZING" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing Payment...
                </>
              ) : analysisState === "RESULT" ? (
                "Payment Evaluated"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> CHECK & PAY
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Animation & Result (Steps 3 & 4) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {analysisState === "IDLE" && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/40 p-8 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                <ShieldCheck className="h-7 w-7 text-emerald-400/80" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">Ready to Analyze Transaction</h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Click <strong className="text-emerald-400 font-mono">CHECK & PAY</strong> to simulate real-time signal inspection, deterministic scoring, hold enforcement, and evidence extraction.
              </p>
            </div>
          )}

          {/* STEP 3: Detection Animation */}
          {analysisState === "ANALYZING" && (
            <div className="h-full min-h-[300px] rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col justify-center space-y-5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-amber-400 animate-spin flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wide">ANALYZING PAYMENT...</h4>
                  <p className="text-xs text-slate-400">Executing Nexora Sentinel multi-vector threat inspection engine</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {steps.map((stepText, idx) => {
                  const isDone = idx <= activeStep;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-slate-900 text-slate-600 border border-slate-800"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </span>
                      <span className={`font-mono transition-colors ${isDone ? "text-slate-200 font-semibold" : "text-slate-500"}`}>
                        {stepText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 & 4 WOW Result */}
          {analysisState === "RESULT" && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              {/* Critical Risk Banner */}
              <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-red-500/5">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold animate-pulse">
                    <ShieldAlert className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider text-red-400 uppercase">🚨 CRITICAL RISK DETECTED</span>
                      <span className="bg-red-500/30 text-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded border border-red-500/50">
                        CRITICAL
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">PAYMENT PLACED ON HOLD</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Risk Score</span>
                  <span className="text-2xl font-black text-red-400 font-mono">94 / 100</span>
                </div>
              </div>

              {/* STEP 4: WHY WAS THIS FLAGGED */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>WHY WAS THIS PAYMENT FLAGGED?</span>
                  <span className="text-red-400 font-mono font-extrabold">Score: 94</span>
                </h4>

                {/* Score Breakdown Table */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Recipient Risk</span>
                    <span className="text-red-400 font-bold">+35</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Previous Suspicious Activity</span>
                    <span className="text-red-400 font-bold">+25</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Chargeback History</span>
                    <span className="text-amber-400 font-bold">+15</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Unusual Amount</span>
                    <span className="text-amber-400 font-bold">+12</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Transaction Velocity</span>
                    <span className="text-amber-400 font-bold">+7</span>
                  </div>
                </div>

                {/* EVIDENCE bullets */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">EVIDENCE SIGNALS</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-red-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span>12 previous suspicious transactions detected across network</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span>3 chargeback associations linked to recipient wallet</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>Recipient account is only 4 days old</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>Amount (₹25,000) is significantly above customer average</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>Multiple high-velocity transactions in short time window</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 5: Click Open Investigation Button */}
              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={() => setLocation("/merchant/investigations")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-red-500/50 bg-red-500/20 text-xs font-black uppercase tracking-wider text-red-200 hover:bg-red-500/30 shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" /> Open Investigation (INV-00291) <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
