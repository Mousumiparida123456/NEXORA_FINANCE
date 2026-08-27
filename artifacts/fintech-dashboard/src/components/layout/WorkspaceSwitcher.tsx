import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Check, ChevronDown, PieChart, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard-context";
import { MerchantAccessModal } from "./MerchantAccessModal";
import { api } from "@/lib/api";

const STORAGE_KEY = "nexora.active-workspace";

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();
  const { user } = useDashboard();
  const [showAccessModal, setShowAccessModal] = useState(false);
  const isMerchant = location === "/merchant" || location.startsWith("/merchant/");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, isMerchant ? "merchant" : "personal");
  }, [isMerchant]);

  const selectWorkspace = async (workspace: "personal" | "merchant") => {
    const targetRole = workspace === "merchant" ? "MERCHANT_USER" : "PERSONAL_USER";
    const currentRole = user?.role || "PERSONAL_USER";

    if (currentRole !== targetRole) {
      try {
        const res = await api.switchWorkspace(targetRole);
        if (res && res.success) {
          localStorage.setItem(STORAGE_KEY, workspace);
          window.location.href = workspace === "merchant" ? "/merchant" : "/dashboard";
          return;
        }
      } catch (e) {
        console.warn("Seamless workspace switch fallback:", e);
      }

      if (workspace === "merchant") {
        setShowAccessModal(true);
        return;
      }
    }

    localStorage.setItem(STORAGE_KEY, workspace);
    setLocation(workspace === "merchant" ? "/merchant" : "/dashboard");
  };

  const activeLabel = isMerchant ? "Nexora Sentinel" : "Personal Finance";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors",
              isMerchant
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                : "border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15",
              className,
            )}
            aria-label="Select workspace"
          >
            {isMerchant ? <ShieldCheck className="h-4 w-4 flex-shrink-0" /> : <PieChart className="h-4 w-4 flex-shrink-0" />}
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Workspace</span>
              <span className="block truncate text-xs font-semibold">{activeLabel}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 p-2" align="start">
          <DropdownMenuLabel className="px-3 text-xs uppercase tracking-wider text-slate-500">Switch workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => selectWorkspace("personal")} className="mt-1 cursor-pointer items-start gap-3 rounded-lg px-3 py-3">
            <span className="mt-0.5 rounded-lg bg-blue-500/10 p-2 text-blue-400"><PieChart className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between font-semibold">Personal Finance {!isMerchant ? <Check className="h-4 w-4 text-blue-400" /> : null}</span>
              <span className="mt-1 block whitespace-normal text-xs leading-relaxed text-slate-500">Manage your personal money, spending, budgets and goals.</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => selectWorkspace("merchant")} className="mt-1 cursor-pointer items-start gap-3 rounded-lg px-3 py-3">
            <span className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><ShieldCheck className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between font-semibold">Merchant Intelligence {isMerchant ? <Check className="h-4 w-4 text-emerald-400" /> : null}</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Nexora Sentinel</span>
              <span className="mt-1 block whitespace-normal text-xs leading-relaxed text-slate-500">Detect, investigate and prevent merchant financial risk.</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MerchantAccessModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
      />
    </>
  );
}
