import React, { useState, useEffect } from "react";
import { ShieldAlert, Building2, Clock, AlertTriangle, Info, Sparkles, ChevronDown, Check } from "lucide-react";
import { WorkspacePillSwitcher } from "@/components/layout/WorkspacePillSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MerchantOption {
  id: string;
  name: string;
  code: string;
  riskStatus: "CRITICAL" | "ELEVATED" | "STABLE";
  riskScore: number;
}

const MERCHANTS: MerchantOption[] = [
  { id: "1", name: "Apex Retail Group", code: "MER-89420", riskStatus: "ELEVATED", riskScore: 74 },
  { id: "2", name: "Nexus Digital Goods", code: "MER-41092", riskStatus: "CRITICAL", riskScore: 89 },
  { id: "3", name: "Vanguard Global Logistics", code: "MER-10293", riskStatus: "STABLE", riskScore: 28 },
];

export function SentinelHeader() {
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantOption>(MERCHANTS[0]);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Workspace Side-by-Side Pill Switcher (Personal Finance vs Merchant Sentinel) */}
      <div className="rounded-2xl border border-slate-800 bg-[#07131e]/90 p-4 shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Select Active Domain Workspace
        </p>
        <WorkspacePillSwitcher />
      </div>

      {/* Demo / Simulated Data Disclaimer Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span className="font-bold tracking-wide text-amber-300 uppercase bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            Demo Data Mode
          </span>
          <span>
            Simulated Risk Intelligence Engine active. All fraud scores, chargeback exposures, and transaction flags use realistic synthetic demo data.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-slate-950/60 px-3 py-1 rounded-md border border-emerald-500/30">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold">OFFLINE-TRAINED ML MODEL ACTIVE</span>
          <span className="hidden sm:inline text-slate-400 font-normal">| Local inference · Synthetic dataset · Rule Engine enabled</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-800 bg-[#07131e]/90 p-5 shadow-xl backdrop-blur-md">
        {/* Left: Branding & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-950/40 font-bold">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  NEXORA SENTINEL
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Risk Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time merchant protection against fraud, return abuse, chargebacks & policy exploitation
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls: Merchant Selector, Clock & Status Banner */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Merchant Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800/80 transition-all shadow-inner"
              >
                <Building2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-normal">Active Merchant</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-100">
                    {selectedMerchant.name}
                    <span className="text-[10px] text-slate-500 font-mono">({selectedMerchant.code})</span>
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-slate-800 bg-[#0a1829] text-slate-200">
              <DropdownMenuLabel className="text-[11px] text-slate-400 uppercase tracking-wider">
                Select Merchant Entity
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              {MERCHANTS.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => setSelectedMerchant(m)}
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-slate-800/80 rounded-md"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-100">{m.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{m.code}</p>
                  </div>
                  {selectedMerchant.id === m.id && <Check className="h-4 w-4 text-emerald-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date & Time */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-300 font-mono">
            <Clock className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{currentTime || "Loading clock..."}</span>
          </div>

          {/* Risk Status Indicator */}
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wider shadow-md ${
              selectedMerchant.riskStatus === "CRITICAL"
                ? "border-red-500/40 bg-red-500/15 text-red-400 animate-pulse"
                : selectedMerchant.riskStatus === "ELEVATED"
                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                : "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                selectedMerchant.riskStatus === "CRITICAL"
                  ? "bg-red-500 animate-ping"
                  : selectedMerchant.riskStatus === "ELEVATED"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
            />
            <span>{selectedMerchant.riskStatus} RISK STATUS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
