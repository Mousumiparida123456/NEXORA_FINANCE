import React from "react";
import { useLocation } from "wouter";
import { Wallet, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "nexora.active-workspace";

export interface WorkspacePillSwitcherProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WorkspacePillSwitcher({ className, size = "md" }: WorkspacePillSwitcherProps) {
  const [location, setLocation] = useLocation();
  const isMerchant = location === "/merchant" || location.startsWith("/merchant/");

  const selectWorkspace = (workspace: "personal" | "merchant") => {
    localStorage.setItem(STORAGE_KEY, workspace);
    if (workspace === "merchant" && !isMerchant) {
      setLocation("/merchant");
    } else if (workspace === "personal" && isMerchant) {
      setLocation("/dashboard");
    }
  };

  const isSm = size === "sm";

  return (
    <div className={cn("grid grid-cols-2 gap-1.5 sm:gap-2.5 w-full", className)}>
      {/* Box 1: Personal Finance Mode */}
      <button
        type="button"
        onClick={() => selectWorkspace("personal")}
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border text-left transition-all duration-200 shadow-sm cursor-pointer select-none",
          isSm ? "p-1.5" : "p-3 rounded-2xl gap-3",
          !isMerchant
            ? "border-blue-500/50 bg-blue-500/15 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-2 ring-blue-500/30"
            : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:bg-slate-900/90 hover:text-slate-200"
        )}
      >
        {/* Icon & Active Indicator */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "flex items-center justify-center transition-all",
              isSm ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl",
              !isMerchant
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
            )}
          >
            <Wallet className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </div>
          {/* Active status pulse dot */}
          {!isMerchant && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
          )}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className={cn(
                "block truncate font-bold tracking-tight",
                isSm ? "text-[11px]" : "text-xs",
                !isMerchant ? "text-blue-300 font-extrabold" : "text-slate-300"
              )}
            >
              Personal
            </span>
            {!isMerchant && <CheckCircle2 className="h-3 w-3 text-blue-400 flex-shrink-0" />}
          </div>
          {!isSm && (
            <span className="block truncate text-[10px] text-slate-400 mt-0.5">
              Manage my money
            </span>
          )}
        </div>
      </button>

      {/* Box 2: Merchant Account / Sentinel Mode */}
      <button
        type="button"
        onClick={() => selectWorkspace("merchant")}
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border text-left transition-all duration-200 shadow-sm cursor-pointer select-none",
          isSm ? "p-1.5" : "p-3 rounded-2xl gap-3",
          isMerchant
            ? "border-emerald-500/50 bg-emerald-500/15 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-2 ring-emerald-500/30"
            : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:bg-slate-900/90 hover:text-slate-200"
        )}
      >
        {/* Icon & Active Indicator */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "flex items-center justify-center transition-all",
              isSm ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl",
              isMerchant
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
            )}
          >
            <ShieldCheck className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </div>
          {/* Active status pulse dot */}
          {isMerchant && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className={cn(
                "block truncate font-bold tracking-tight",
                isSm ? "text-[11px]" : "text-xs",
                isMerchant ? "text-emerald-300 font-extrabold" : "text-slate-300"
              )}
            >
              Merchant
            </span>
            {isMerchant && <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />}
          </div>
          {!isSm && (
            <span className="block truncate text-[10px] text-slate-400 mt-0.5">
              Protect merchant money
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
