import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  Database,
  BarChart3,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  modelPerformanceService,
  ThresholdSimulationResult,
} from "../sentinel/services/modelPerformanceService";

export function ModelPerformancePage() {
  const [activeThreshold, setActiveThreshold] = useState<number>(70);

  // Load held-out test set & dataset info
  const testSamples = useMemo(() => modelPerformanceService.getHeldOutTestDataset(), []);
  const datasetInfo = useMemo(() => modelPerformanceService.getDatasetInfo(), []);

  // Compute evaluation result dynamically for active threshold
  const currentResult = useMemo<ThresholdSimulationResult>(() => {
    return modelPerformanceService.evaluateThreshold(testSamples, activeThreshold);
  }, [testSamples, activeThreshold]);

  // Compute comparisons across thresholds (50, 60, 70, 80, 90)
  const thresholdComparisons = useMemo(() => {
    return modelPerformanceService.getThresholdComparisons(testSamples);
  }, [testSamples]);

  const { metrics, confusionMatrix, costAnalysis } = currentResult;

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Dataset Architecture Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Model Evaluation & Benchmark Performance
              </h1>
              <p className="text-sm text-slate-400">
                Objective, evidence-based performance evaluation on held-out test datasets
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-3 py-1 font-mono">
            HELD-OUT TEST SET · 5,000 SAMPLES
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono">
            SYNTHETIC BENCHMARK
          </Badge>
        </div>
      </div>

      {/* Dataset Architecture Breakdown Card */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              1. Dataset Architecture & Split Overview
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Corpus: 25,000 Labeled Transactions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Training Dataset</span>
              <Badge className="bg-slate-800 text-slate-300 text-[10px]">60% Split</Badge>
            </div>
            <p className="text-xl font-bold text-slate-100 font-mono">15,000 Samples</p>
            <p className="text-[11px] text-slate-500">Used for model feature weight optimization</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Validation Dataset</span>
              <Badge className="bg-slate-800 text-slate-300 text-[10px]">20% Split</Badge>
            </div>
            <p className="text-xl font-bold text-slate-100 font-mono">5,000 Samples</p>
            <p className="text-[11px] text-slate-500">Used for threshold hyperparameter tuning</p>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-300 font-bold">Held-Out Test Dataset</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">20% Split</Badge>
            </div>
            <p className="text-xl font-bold text-emerald-400 font-mono">5,000 Samples</p>
            <p className="text-[11px] text-emerald-300/80">Strictly decoupled for unbiased evaluation</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            <strong className="text-slate-200">Prevalence Rate:</strong> 4.8% Actual Fraud / Chargebacks (240 Ground Truth Positives)
          </span>
          <span className="font-mono text-[10px] text-purple-400">{datasetInfo.disclaimer}</span>
        </div>
      </div>

      {/* Threshold Simulator Control Section */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">2. Interactive Risk Threshold Simulator</h2>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Active Threshold: <span className="text-emerald-400 font-bold text-sm">{activeThreshold} / 100</span>
          </div>
        </div>

        {/* Step Selector Buttons */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Select Risk Cutoff Threshold (T):</label>
          <div className="flex flex-wrap items-center gap-3">
            {[50, 60, 70, 80, 90].map((t) => (
              <button
                key={t}
                onClick={() => setActiveThreshold(t)}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  activeThreshold === t
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                T = {t} {t === 70 ? "(Default)" : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 6 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Precision */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Precision</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            {(metrics.precision * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">TP / (TP + FP)</p>
        </div>

        {/* Recall */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recall (Sensitivity)</span>
          <p className="text-2xl font-extrabold font-mono text-blue-400">
            {(metrics.recall * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">TP / (TP + FN)</p>
        </div>

        {/* F1 Score */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">F1 Score</span>
          <p className="text-2xl font-extrabold font-mono text-purple-400">
            {(metrics.f1Score * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">2 · (P · R) / (P + R)</p>
        </div>

        {/* Accuracy */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Accuracy</span>
          <p className="text-2xl font-extrabold font-mono text-slate-200">
            {(metrics.accuracy * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">(TP + TN) / Total</p>
        </div>

        {/* ROC-AUC */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ROC-AUC</span>
          <p className="text-2xl font-extrabold font-mono text-amber-400">
            {metrics.rocAuc.toFixed(3)}
          </p>
          <p className="text-[10px] text-slate-500">Area Under Curve</p>
        </div>

        {/* FPR & FNR */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">False Rates</span>
          <p className="text-xs font-mono font-bold text-rose-400">
            FPR: {(metrics.fpr * 100).toFixed(1)}%
          </p>
          <p className="text-xs font-mono font-bold text-orange-400">
            FNR: {(metrics.fnr * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 3. Confusion Matrix Grid & Cost Analysis */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Confusion Matrix (2x2 Grid) */}
        <div className="md:col-span-6 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">3. Confusion Matrix (T = {activeThreshold})</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{confusionMatrix.total.toLocaleString()} Samples</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* True Positives */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">True Positives (TP)</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black font-mono text-emerald-300">
                {confusionMatrix.tp.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-300/80">
                Prevented Fraud Loss: ${costAnalysis.preventedFraudLossUSD.toLocaleString()}
              </p>
            </div>

            {/* False Positives */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">False Positives (FP)</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-300">
                {confusionMatrix.fp.toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-300/80">
                Merchant Friction Cost: ${costAnalysis.falsePositiveCostUSD.toLocaleString()}
              </p>
            </div>

            {/* False Negatives */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">False Negatives (FN)</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black font-mono text-rose-300">
                {confusionMatrix.fn.toLocaleString()}
              </p>
              <p className="text-[10px] text-rose-300/80">
                Uncaught Fraud Loss: ${costAnalysis.uncaughtFraudLossUSD.toLocaleString()}
              </p>
            </div>

            {/* True Negatives */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">True Negatives (TN)</span>
                <ShieldCheck className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-200">
                {confusionMatrix.tn.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500">
                Seamless Legitimate Checkout
              </p>
            </div>
          </div>
        </div>

        {/* Financial False-Positive Cost Analysis */}
        <div className="md:col-span-6 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">4. False-Positive Cost & Exposure Analysis</h2>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-semibold block">Prevented Fraud Loss</span>
                <span className="text-[10px] text-slate-500">True Positives Saved</span>
              </div>
              <span className="font-mono text-base font-bold text-emerald-400">
                ${costAnalysis.preventedFraudLossUSD.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-semibold block">False-Positive Decline Friction Cost</span>
                <span className="text-[10px] text-slate-500">False Positives × $15 Customer Friction</span>
              </div>
              <span className="font-mono text-base font-bold text-amber-400">
                ${costAnalysis.falsePositiveCostUSD.toLocaleString()} <span className="text-[10px] text-slate-500">(₹{(costAnalysis.falsePositiveCostINR / 1000).toFixed(1)}k)</span>
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-semibold block">Uncaught Fraud Financial Exposure</span>
                <span className="text-[10px] text-slate-500">False Negatives Volume</span>
              </div>
              <span className="font-mono text-base font-bold text-rose-400">
                ${costAnalysis.uncaughtFraudLossUSD.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs flex justify-between items-center font-mono">
            <span className="font-bold text-emerald-300">Net Risk Exposure at T={activeThreshold}:</span>
            <span className="font-bold text-emerald-400 text-sm">
              ${costAnalysis.netFinancialExposureUSD.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Risk Threshold Comparison Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">5. Risk Threshold Trade-off Matrix</h2>
          </div>
          <span className="text-xs text-slate-400">Evaluating Thresholds 50 to 90</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Cutoff Threshold (T)</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1 Score</th>
                <th className="py-2.5 px-3">False Positives (FP)</th>
                <th className="py-2.5 px-3">False Negatives (FN)</th>
                <th className="py-2.5 px-3">Prevented Fraud ($)</th>
                <th className="py-2.5 px-3">FP Cost ($)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {thresholdComparisons.map((item) => {
                const isCurrent = item.threshold === activeThreshold;
                return (
                  <tr
                    key={item.threshold}
                    onClick={() => setActiveThreshold(item.threshold)}
                    className={`cursor-pointer transition-colors ${
                      isCurrent ? "bg-emerald-500/10" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-100">
                      T = {item.threshold} {item.threshold === 70 ? "(Default)" : ""}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {(item.metrics.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-blue-400 font-bold">
                      {(item.metrics.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-purple-400 font-bold">
                      {(item.metrics.f1Score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-amber-400">{item.confusionMatrix.fp}</td>
                    <td className="py-2.5 px-3 text-rose-400">{item.confusionMatrix.fn}</td>
                    <td className="py-2.5 px-3 text-emerald-300">
                      ${item.costAnalysis.preventedFraudLossUSD.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-amber-300">
                      ${item.costAnalysis.falsePositiveCostUSD.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {isCurrent ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          ACTIVE
                        </Badge>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Select</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
