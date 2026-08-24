import React, { useState } from "react";
import {
  Workflow,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Bot,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  Database,
  Search,
  FileCheck,
  UserCheck,
  ClipboardList,
  Sparkles,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSentinelState } from "../context/SentinelContext";

interface SimulationScenario {
  id: string;
  name: string;
  badge: string;
  color: string;
  txnId: string;
  amount: number;
  customerName: string;
  recipient: string;
  velocity: number;
  distance: number;
  deviceTrust: number;
  failedCount: number;
  chargebackCount: number;
  prevFraud: boolean;
  mlProb: number;
  riskScore: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: "ALLOW" | "REVIEW" | "BLOCK";
  signals: Array<{ name: string; score: number; desc: string }>;
  explanation: string;
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: "SAFE",
    name: "Scenario A: Safe Payment",
    badge: "SAFE (₹1,250)",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    txnId: "TXN-901021",
    amount: 1250,
    customerName: "Aarav Sharma",
    recipient: "grocery-mart@upi",
    velocity: 1,
    distance: 1.2,
    deviceTrust: 98,
    failedCount: 0,
    chargebackCount: 0,
    prevFraud: false,
    mlProb: 0.024,
    riskScore: 12,
    level: "LOW",
    recommendation: "ALLOW",
    signals: [
      { name: "Trusted Device Fingerprint", score: 2, desc: "Matched known iPhone hardware ID" },
      { name: "Regular Geolocation", score: 1, desc: "Within 2 miles of primary home billing address" },
      { name: "Low Velocity", score: 1, desc: "1 transaction in last 24 hours" },
    ],
    explanation: "Transaction exhibits normal purchasing pattern from a trusted device and verified domestic location. No threat vectors detected.",
  },
  {
    id: "SUSPICIOUS",
    name: "Scenario B: Suspicious Payment",
    badge: "SUSPICIOUS (₹18,500)",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    txnId: "TXN-904112",
    amount: 18500,
    customerName: "Priya Patel",
    recipient: "tech-bazaar@upi",
    velocity: 4,
    distance: 180,
    deviceTrust: 45,
    failedCount: 1,
    chargebackCount: 0,
    prevFraud: false,
    mlProb: 0.518,
    riskScore: 54,
    level: "MEDIUM",
    recommendation: "REVIEW",
    signals: [
      { name: "Elevated Transaction Amount", score: 18, desc: "₹18,500 exceeds 30-day average by 2.4x" },
      { name: "Distance Mismatch", score: 16, desc: "Payment initiated 180 miles from billing address" },
      { name: "New Device Hardware", score: 12, desc: "First time seen Android Chrome fingerprint" },
    ],
    explanation: "Higher than average order magnitude coupled with an unrecognized device fingerprint and location offset warrant manual merchant review.",
  },
  {
    id: "FRAUDULENT",
    name: "Scenario C: Fraudulent Payment",
    badge: "CRITICAL FRAUD (₹45,000)",
    color: "border-red-500/40 bg-red-500/10 text-red-400",
    txnId: "TXN-904812",
    amount: 45000,
    customerName: "Rohan Gupta",
    recipient: "crypto-exchange-risk@upi",
    velocity: 8,
    distance: 2450,
    deviceTrust: 12,
    failedCount: 3,
    chargebackCount: 1,
    prevFraud: true,
    mlProb: 0.917,
    riskScore: 94,
    level: "CRITICAL",
    recommendation: "BLOCK",
    signals: [
      { name: "High Velocity Spike", score: 28, desc: "8 high-value attempts in past 10 minutes" },
      { name: "Unusual Geo Mismatch", score: 24, desc: "IP geo located 2,450 miles away from billing country" },
      { name: "Untrusted Device Fingerprint", score: 19, desc: "Tor exit node proxy fingerprint detected" },
      { name: "High Risk BIN Category", score: 15, desc: "High-risk prepaid virtual card BIN" },
      { name: "Prior Chargeback Record", score: 8, desc: "Associated with 1 prior fraud dispute" },
    ],
    explanation: "Multiple critical risk vectors detected simultaneously: rapid payment velocity, offshore proxy IP, untrusted device, and high-risk prepaid BIN.",
  },
  {
    id: "VELOCITY",
    name: "Scenario D: High Velocity Attack",
    badge: "VELOCITY ATTACK (14 txns/10m)",
    color: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    txnId: "TXN-909283",
    amount: 8900,
    customerName: "Botnet Cluster #4",
    recipient: "giftcard-store@upi",
    velocity: 14,
    distance: 450,
    deviceTrust: 22,
    failedCount: 5,
    chargebackCount: 0,
    prevFraud: false,
    mlProb: 0.884,
    riskScore: 88,
    level: "CRITICAL",
    recommendation: "BLOCK",
    signals: [
      { name: "Automated Velocity Burst", score: 38, desc: "14 rapid checkout requests in 6 minutes" },
      { name: "Multiple Authorization Failures", score: 26, desc: "5 consecutive failed PIN attempts" },
      { name: "Bot Fingerprint Profile", score: 24, desc: "Headless browser user-agent detected" },
    ],
    explanation: "Automated card testing bot behavior detected via rapid sequence authorization attempts and headless browser telemetry.",
  },
  {
    id: "CHARGEBACK",
    name: "Scenario E: Chargeback Risk",
    badge: "CHARGEBACK DISPUTE (₹32,000)",
    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
    txnId: "TXN-902184",
    amount: 32000,
    customerName: "Vikram Malhotra",
    recipient: "luxury-electronics@upi",
    velocity: 2,
    distance: 15,
    deviceTrust: 60,
    failedCount: 0,
    chargebackCount: 3,
    prevFraud: true,
    mlProb: 0.892,
    riskScore: 91,
    level: "CRITICAL",
    recommendation: "BLOCK",
    signals: [
      { name: "Serial Chargeback Record", score: 42, desc: "Customer has 3 prior forced bank chargebacks on record" },
      { name: "High Ticket Physical Goods", score: 28, desc: "₹32,000 easily resold consumer electronics" },
      { name: "Previous Fraud Flag", score: 21, desc: "Blacklisted in merchant collaborative database" },
    ],
    explanation: "High risk of friendly fraud dispute due to 3 past chargebacks and repeat merchant policy violation history.",
  },
];

export function SentinelIntelligencePage() {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(SCENARIOS[2]); // Default Scenario C
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(8); // Show full pipeline by default
  const [overrideDecision, setOverrideDecision] = useState<string | null>(null);

  const { recordAuditLog } = useSentinelState() as any;

  const runSimulation = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setOverrideDecision(null);
    setIsSimulating(true);
    setActiveStage(0);

    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      if (stage < 9) {
        setActiveStage(stage);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 600);
  };

  const STAGES = [
    {
      id: 1,
      title: "1. Transaction Event Ingestion",
      icon: Zap,
      status: activeStage >= 0 ? "DONE" : "WAITING",
      time: "1ms",
      input: `Payload: { txnId: "${selectedScenario.txnId}", amount: ₹${selectedScenario.amount.toLocaleString()}, recipient: "${selectedScenario.recipient}" }`,
      output: `Event Ingested into Real-Time Stream Ticker`,
    },
    {
      id: 2,
      title: "2. Feature Extraction",
      icon: Database,
      status: activeStage >= 1 ? "DONE" : "WAITING",
      time: "4ms",
      input: "13 Vector Features: amount, velocity, accountAge, ipDistance, deviceTrust, failedCount, chargebacks...",
      output: `Velocity: ${selectedScenario.velocity}/hr · Distance: ${selectedScenario.distance}mi · Device Trust: ${selectedScenario.deviceTrust}%`,
    },
    {
      id: 3,
      title: "3. Risk Signal Generation",
      icon: SlidersHorizontal,
      status: activeStage >= 2 ? "DONE" : "WAITING",
      time: "2ms",
      input: "Feature Delta Normalization against Customer Baseline Profile",
      output: `${selectedScenario.signals.length} Normalized Anomaly Signals Triggered`,
    },
    {
      id: 4,
      title: "4. ML Fraud Risk Model",
      icon: Cpu,
      status: activeStage >= 3 ? "DONE" : "WAITING",
      time: "6ms",
      input: "Supervised Random Forest Classifier (sentinel-fraud-v1)",
      output: `fraud_probability: ${selectedScenario.mlProb} (${(selectedScenario.mlProb * 100).toFixed(1)}%)`,
    },
    {
      id: 5,
      title: "5. Risk Fusion Engine",
      icon: Layers,
      status: activeStage >= 4 ? "DONE" : "WAITING",
      time: "3ms",
      input: "ML Probability (60% weight) + Rule Engine Adjustments (40% weight)",
      output: `Final Bounded Risk Score: ${selectedScenario.riskScore} / 100 (${selectedScenario.level})`,
    },
    {
      id: 6,
      title: "6. AI Investigation",
      icon: Bot,
      status: activeStage >= 5 ? "DONE" : "WAITING",
      time: "8ms",
      input: "Feature Signal Weight Vector Analysis",
      output: `${selectedScenario.signals[0]?.name || "Signal"} (+${selectedScenario.signals[0]?.score || 0}) · ${selectedScenario.explanation}`,
    },
    {
      id: 7,
      title: "7. Decision Engine",
      icon: FileCheck,
      status: activeStage >= 6 ? "DONE" : "WAITING",
      time: "1ms",
      input: `Policy Threshold Evaluation (Score: ${selectedScenario.riskScore})`,
      output: `Recommended Decision: ${selectedScenario.recommendation}`,
    },
    {
      id: 8,
      title: "8. Human Approval / Override",
      icon: UserCheck,
      status: activeStage >= 7 ? "DONE" : "WAITING",
      time: overrideDecision ? "Human Action" : "Automated Queue",
      input: overrideDecision ? `Merchant Override: ${overrideDecision}` : "Automated Recommended Action Standing",
      output: overrideDecision ? `Overridden to: ${overrideDecision}` : `Executing: ${selectedScenario.recommendation}`,
    },
    {
      id: 9,
      title: "9. Audit Trail",
      icon: ClipboardList,
      status: activeStage >= 8 ? "DONE" : "WAITING",
      time: "2ms",
      input: "Event Cryptographic Signing",
      output: `Recorded to Immutable Operational Audit Log (TXN-${selectedScenario.txnId})`,
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Workflow className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Sentinel Risk Intelligence Architecture
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5 font-mono">
                  <Sparkles className="h-3 w-3 mr-1" /> 9-Stage AI/ML Pipeline
                </Badge>
              </div>
              <p className="text-sm text-slate-400">
                End-to-end transparent transaction flow from event ingestion to feature extraction, ML probability, fusion, AI investigation, human override & audit trail.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => runSimulation(selectedScenario)}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Play className={`h-4 w-4 ${isSimulating ? "animate-spin" : ""}`} />
          <span>{isSimulating ? "Simulating Pipeline..." : "Run Risk Simulation"}</span>
        </button>
      </div>

      {/* Scenario Selector */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Simulation Scenario
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            Active: {selectedScenario.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => runSimulation(sc)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-500/15 text-white ring-2 ring-emerald-500/30"
                    : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{sc.name.split(":")[0]}</span>
                  <span className="text-xs font-bold text-slate-100 block mt-0.5">{sc.name.split(":")[1]}</span>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${sc.color}`}>
                  Score: {sc.riskScore} · {sc.level}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Pipeline Summary Badge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Transaction</span>
          <p className="text-lg font-bold text-slate-100 font-mono">{selectedScenario.txnId}</p>
          <p className="text-xs text-emerald-400 font-bold">₹{selectedScenario.amount.toLocaleString()}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">ML Fraud Probability</span>
          <p className="text-lg font-bold text-purple-400 font-mono">
            {(selectedScenario.mlProb * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">sentinel-fraud-v1</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Fused Risk Score</span>
          <p className={`text-lg font-extrabold font-mono ${
            selectedScenario.riskScore >= 80 ? "text-red-400" : selectedScenario.riskScore >= 50 ? "text-amber-400" : "text-emerald-400"
          }`}>
            {selectedScenario.riskScore} / 100
          </p>
          <p className="text-[10px] text-slate-500">Level: {selectedScenario.level}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Decision Recommendation</span>
          <p className={`text-lg font-extrabold font-mono ${
            selectedScenario.recommendation === "BLOCK" ? "text-red-400" : selectedScenario.recommendation === "REVIEW" ? "text-amber-400" : "text-emerald-400"
          }`}>
            {overrideDecision || selectedScenario.recommendation}
          </p>
          <p className="text-[10px] text-slate-500">{overrideDecision ? "Human Overridden" : "Automated Policy"}</p>
        </div>
      </div>

      {/* 9-Stage Interactive Pipeline Flow */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Workflow className="h-5 w-5 text-emerald-400" />
          <span>Complete 9-Stage Risk Inspection Pipeline Execution</span>
        </h2>

        <div className="space-y-3">
          {STAGES.map((stage, idx) => {
            const IconComponent = stage.icon;
            const isCompleted = activeStage >= idx;
            const isActive = activeStage === idx && isSimulating;

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40"
                    : isCompleted
                    ? "border-slate-800 bg-slate-900/90"
                    : "border-slate-900 bg-slate-950/40 opacity-50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-lg border ${
                      isCompleted ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-500 border-slate-700"
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold text-slate-100">{stage.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">{stage.time}</span>
                    <Badge className={`text-[10px] font-mono px-2 py-0.5 ${
                      isCompleted ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-500"
                    }`}>
                      {isCompleted ? "EXECUTED ✓" : "WAITING"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-sans block font-semibold mb-0.5">INPUT DATA</span>
                    <span className="text-slate-300">{stage.input}</span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-sans block font-semibold mb-0.5">STAGE OUTPUT</span>
                    <span className="text-emerald-400 font-semibold">{stage.output}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Human Override Controls Section */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Stage 8: Human Approval / Merchant Override
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Current Status: {overrideDecision || selectedScenario.recommendation}</span>
        </div>

        <p className="text-xs text-slate-400">
          As a merchant risk operator, you have full authority to override automated system recommendations. Every override decision is cryptographically signed and logged into the audit trail.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setOverrideDecision("APPROVED_BY_MERCHANT");
              recordAuditLog?.({
                type: "HUMAN_OVERRIDE",
                actor: "Merchant Operator",
                details: `Manually APPROVED transaction ${selectedScenario.txnId} (Overrode ${selectedScenario.recommendation})`,
              });
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            ✓ Force Approve Order
          </button>

          <button
            onClick={() => {
              setOverrideDecision("BLOCKED_AND_REFUNDED");
              recordAuditLog?.({
                type: "HUMAN_OVERRIDE",
                actor: "Merchant Operator",
                details: `Manually BLOCKED & REFUNDED transaction ${selectedScenario.txnId}`,
              });
            }}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow-md transition-all"
          >
            🛑 Force Block & Refund
          </button>

          {overrideDecision && (
            <button
              onClick={() => setOverrideDecision(null)}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-mono text-xs hover:bg-slate-800"
            >
              Reset to Automated Recommendation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
