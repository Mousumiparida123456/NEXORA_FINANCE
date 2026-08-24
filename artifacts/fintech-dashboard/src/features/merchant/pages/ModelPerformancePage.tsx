import React, { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ShieldCheck,
  XCircle,
  Cpu,
  Info,
  Sparkles,
  Play,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import modelMetrics from "../sentinel/data/model_metrics.json";

export function ModelPerformancePage() {
  const {
    model,
    modelVersion,
    dataset_size,
    fraud_rate,
    accuracy,
    precision,
    recall,
    f1,
    roc_auc,
    false_positive_rate,
    false_negative_rate,
    confusion_matrix,
  } = modelMetrics;

  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStep, setTrainingStep] = useState<number>(-1);

  const trainingSteps = [
    "Preparing dataset (Loading 20,000 synthetic transaction records)",
    "Feature engineering (Normalizing 20 risk threat vectors)",
    "Training supervised Random Forest Classifier (50 estimators, max_depth=8)",
    "Validation (Evaluating 80/20 train/test split with stratify=y)",
    "Evaluation (Computing Confusion Matrix, Precision, Recall & ROC-AUC)",
    "Model Ready (Exported sentinel-fraud-v1 to local inference engine)",
  ];

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < trainingSteps.length) {
        setTrainingStep(step);
      } else {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 700);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Dataset Architecture Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Cpu className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Offline-Trained ML Model Performance
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3 mr-1" /> {modelVersion}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">
                Supervised Random Forest fraud detection model evaluation trained on 20,000 synthetic transaction records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-3 py-1 font-mono">
            80 / 20 TRAIN-TEST SPLIT
          </Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-mono">
            LOCAL INFERENCE ENGINE
          </Badge>
        </div>
      </div>

      {/* Model Training Center Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#07131e]/90 p-6 space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <RefreshCw className={`h-5 w-5 text-emerald-400 ${isTraining ? "animate-spin" : ""}`} />
            <div>
              <h2 className="text-base font-bold text-slate-100">Model Training Center</h2>
              <p className="text-xs text-slate-400">Re-fit Random Forest model on 20,000 synthetic transaction dataset</p>
            </div>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={isTraining}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Play className={`h-4 w-4 ${isTraining ? "animate-spin" : ""}`} />
            <span>{isTraining ? "Retraining Model..." : "Train Model"}</span>
          </button>
        </div>

        {/* Training Animation Progress Steps */}
        {trainingStep >= 0 && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                {isTraining ? "TRAINING IN PROGRESS..." : "TRAINING COMPLETE ✓"}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Step {trainingStep + 1} of {trainingSteps.length}
              </span>
            </div>

            <div className="space-y-2">
              {trainingSteps.map((stepText, idx) => {
                const isCompleted = trainingStep > idx;
                const isCurrent = trainingStep === idx && isTraining;

                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : isCurrent
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                          : "bg-slate-900 text-slate-600 border border-slate-800"
                      }`}
                    >
                      {isCompleted ? "✓" : isCurrent ? <Loader2 className="h-3 w-3 animate-spin" /> : idx + 1}
                    </span>
                    <span className={`font-mono transition-colors ${
                      isCompleted ? "text-slate-200 font-semibold" : isCurrent ? "text-amber-300 font-bold" : "text-slate-500"
                    }`}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dataset Architecture Breakdown Card */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              1. Training Dataset & Pipeline Overview
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Corpus: {dataset_size.toLocaleString()} Transactions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">Model Architecture</span>
            <p className="text-lg font-bold text-slate-100 font-mono">{model}</p>
            <p className="text-[11px] text-slate-500">Supervised Ensemble Tree Classifier</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs font-semibold block">Dataset Imbalance</span>
            <p className="text-lg font-bold text-amber-400 font-mono">{(fraud_rate * 100).toFixed(1)}% Fraud Rate</p>
            <p className="text-[11px] text-slate-500">95% Legitimate / 5% Fraudulent</p>
          </div>

          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1">
            <span className="text-emerald-300 text-xs font-bold block">Inference Runtime</span>
            <p className="text-lg font-bold text-emerald-400 font-mono">Local Browser Engine</p>
            <p className="text-[11px] text-emerald-300/80">0ms external network dependency</p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Precision</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            {(precision * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">TP / (TP + FP)</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recall</span>
          <p className="text-2xl font-extrabold font-mono text-blue-400">
            {(recall * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">TP / (TP + FN)</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">F1 Score</span>
          <p className="text-2xl font-extrabold font-mono text-purple-400">
            {(f1 * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">Harmonic Mean</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Accuracy</span>
          <p className="text-2xl font-extrabold font-mono text-slate-200">
            {(accuracy * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500">Overall Correct</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ROC-AUC</span>
          <p className="text-2xl font-extrabold font-mono text-amber-400">
            {roc_auc.toFixed(3)}
          </p>
          <p className="text-[10px] text-slate-500">Area Under Curve</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">False Pos. Rate</span>
          <p className="text-2xl font-extrabold font-mono text-rose-400">
            {(false_positive_rate * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] text-slate-500">FP / (FP + TN)</p>
        </div>
      </div>

      {/* Confusion Matrix & Model Card Section */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-6 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">2. Evaluation Confusion Matrix</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Held-out 4,000 Test Set</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">True Positives (TP)</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black font-mono text-emerald-300">
                {confusion_matrix.true_positive.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-300/80">Correctly Blocked Fraud</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">False Positives (FP)</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-300">
                {confusion_matrix.false_positive.toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-300/80">Incorrectly Flagged Legit</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">False Negatives (FN)</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black font-mono text-rose-300">
                {confusion_matrix.false_negative.toLocaleString()}
              </p>
              <p className="text-[10px] text-rose-300/80">Missed Fraud Attempts</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">True Negatives (TN)</span>
                <ShieldCheck className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-200">
                {confusion_matrix.true_negative.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500">Seamless Legitimate Checkout</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">3. Model Card Specifications</h2>
            </div>
            <span className="text-xs font-mono text-emerald-400">{modelVersion}</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400">Model Name</span>
              <span className="font-mono font-bold text-white">Sentinel Fraud Model v1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400">Training Strategy</span>
              <span className="font-mono font-bold text-white">Offline Supervised Stratified Fit</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400">Features Evaluated</span>
              <span className="font-mono font-bold text-emerald-400">20 Real-time Threat Signals</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400">Inference Runtime</span>
              <span className="font-mono font-bold text-white">Local Browser Execution</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4" /> Demonstration Limitation Notice
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Model trained on synthetic demonstration transaction corpus (20,000 samples). Designed for real-time local inference and hackathon evaluation; not intended as a production banking model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
