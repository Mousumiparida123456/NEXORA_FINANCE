import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  ShieldAlert,
  Send,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  FileText,
  Lock,
} from "lucide-react";

export function MerchantAgentPage() {
  const [selectedCase, setSelectedCase] = useState("INV-00291");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "agent"; text: string; time: string }>>([
    {
      sender: "agent",
      text: "Hello! I am your Autonomous Sentinel AI Agent. I have loaded Investigation #INV-00291 (TXN-10982 · ₹25,000 · Score 94/100). How can I assist with your risk assessment?",
      time: "13:42:25",
    },
  ]);

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg = { sender: "user" as const, text: promptText, time: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);

    setChatInput("");

    setTimeout(() => {
      let responseText = "";
      const lower = promptText.toLowerCase();

      if (lower.includes("why") || lower.includes("flagged") || lower.includes("reason")) {
        responseText =
          "⚡ **Investigation Signals for INV-00291:**\n" +
          "• **Recipient Threat Vector (+35 pts):** Recipient account `demo-risk-recipient@upi` is only 4 days old and flagged for synthetic pattern abuse.\n" +
          "• **Network Suspicious History (+25 pts):** 12 previous suspicious transfers linked across the network.\n" +
          "• **Chargeback Association (+15 pts):** 3 previous dispute claims associated with recipient wallet.\n" +
          "• **Unusual Amount (+12 pts):** ₹25,000 significantly exceeds customer's (CUS-182) average transaction value.\n" +
          "• **Velocity (+7 pts):** Rapid consecutive payment attempts within a 60-minute window.";
      } else if (lower.includes("do next") || lower.includes("action") || lower.includes("recommend")) {
        responseText =
          "🛡️ **Recommended Next Action:**\n" +
          "1. **Keep Payment on HOLD:** Do not authorize funds release to `demo-risk-recipient@upi`.\n" +
          "2. **Verify Recipient KYC:** Request identity verification for the newly created recipient account.\n" +
          "3. **Review Customer CUS-182:** Examine customer's dispute record (3 prior chargebacks) before deciding whether to Block & Refund.";
      } else {
        responseText =
          `AI Analysis for ${selectedCase}: Transaction TXN-10982 for ₹25,000 remains at CRITICAL risk (Score 94/100). The automated SafePay engine recommends holding funds pending merchant verification.`;
      }

      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: responseText, time: new Date().toLocaleTimeString() },
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-md font-bold">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">AI Risk Agent Workspace</h1>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 font-mono">
                Autonomous Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive evidence-grounded risk intelligence & investigative decision support
            </p>
          </div>
        </div>

        {/* Investigation Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Select Investigation:</label>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="h-9 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-mono text-emerald-400 font-bold focus:outline-none"
          >
            <option value="INV-00291">INV-00291 (TXN-10982 · ₹25,000 · Score 94)</option>
            <option value="INV-00288">INV-00288 (TXN-904812 · $2,450 · Score 91)</option>
            <option value="INV-00275">INV-00275 (TXN-883910 · $1,890 · Score 88)</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Risk Dossier Card (Step 7) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-red-500/30 bg-[#07131e]/95 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI RISK ANALYSIS</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-extrabold font-mono">
                CRITICAL · 94 / 100
              </span>
            </div>

            {/* Score & Confidence Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Level</span>
                <span className="text-sm font-black text-red-400 font-mono">CRITICAL</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Risk Score</span>
                <span className="text-sm font-black text-red-400 font-mono">94 / 100</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Confidence</span>
                <span className="text-sm font-black text-emerald-400 font-mono">HIGH (96%)</span>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">SUMMARY</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                This transaction contains multiple independent risk signals and should remain on hold pending review.
              </p>
            </div>

            {/* EVIDENCE Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">EVIDENCE</h4>
              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-start gap-2">
                  <span className="font-bold text-red-400">1.</span>
                  <span>Recipient has 12 previous suspicious activity records across network.</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-start gap-2">
                  <span className="font-bold text-red-400">2.</span>
                  <span>Recipient account (<span className="text-amber-300">demo-risk-recipient@upi</span>) is newly created (4 days old).</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-start gap-2">
                  <span className="font-bold text-amber-400">3.</span>
                  <span>Transaction amount (₹25,000) is outside customer's (CUS-182) normal spending range.</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 flex items-start gap-2">
                  <span className="font-bold text-amber-400">4.</span>
                  <span>Multiple transactions occurred within a short period (velocity flag).</span>
                </div>
              </div>
            </div>

            {/* RECOMMENDATION & NEXT ACTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 space-y-1">
                <span className="text-[10px] font-bold text-red-300 uppercase">RECOMMENDATION</span>
                <div className="text-sm font-extrabold text-red-200 font-mono flex items-center gap-1.5">
                  <Lock className="h-4 w-4" /> HOLD PAYMENT
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">NEXT ACTION</span>
                <div className="text-xs font-semibold text-slate-200">
                  Review recipient history & related transactions.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Chat Workspace */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#07131e]/95 p-5 shadow-xl min-h-[500px]">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Interactive AI Agent Q&A</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">● Active Session</span>
          </div>

          {/* Quick Prompt Chips */}
          <div className="pt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleSendPrompt("Why was this payment flagged?")}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-emerald-300 hover:bg-slate-800 transition-all text-left"
            >
              💬 "Why was this payment flagged?"
            </button>
            <button
              onClick={() => handleSendPrompt("What should I do next?")}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-emerald-300 hover:bg-slate-800 transition-all text-left"
            >
              🛡️ "What should I do next?"
            </button>
          </div>

          {/* Chat Messages Box */}
          <div className="my-4 flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "agent" && (
                  <span className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold">
                    AI
                  </span>
                )}

                <div
                  className={`p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-slate-900 border border-slate-800 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(chatInput);
            }}
            className="flex items-center gap-2 pt-3 border-t border-slate-800"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI agent about INV-00291 signals or recommendations..."
              className="flex-1 h-10 rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
