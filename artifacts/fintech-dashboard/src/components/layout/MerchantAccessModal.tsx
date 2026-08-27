import React from "react";
import { useLocation } from "wouter";
import { ShieldAlert, ArrowRight, UserPlus, LogIn, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDashboard } from "@/lib/dashboard-context";

interface MerchantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MerchantAccessModal({ isOpen, onClose }: MerchantAccessModalProps) {
  const [, setLocation] = useLocation();
  const { user } = useDashboard();

  const handleCreateMerchantAccount = () => {
    onClose();
    const userEmail = user?.email ? `&email=${encodeURIComponent(user.email)}` : "";
    window.location.href = `/register?role=merchant${userEmail}`;
  };

  const handleSignInMerchantAccount = () => {
    onClose();
    const userEmail = user?.email ? `&email=${encodeURIComponent(user.email)}` : "";
    window.location.href = `/login?workspace=merchant&switch=true${userEmail}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border border-slate-800 bg-[#070e24]/95 backdrop-blur-2xl text-slate-100 p-6 rounded-2xl shadow-2xl shadow-black/80">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Sentinel Access Policy
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-white pt-2">
            Merchant Sentinel Access Required
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-300 leading-relaxed pt-1">
            Your current account is a Personal account. Create or use a Merchant Sentinel account to access merchant protection, risk monitoring and audit intelligence.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-3">
          {/* Action 1: Create Merchant Account */}
          <button
            type="button"
            onClick={handleCreateMerchantAccount}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="h-4 w-4" />
              <span>Create Merchant Account</span>
            </div>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Action 2: Sign in with Merchant Account */}
          <button
            type="button"
            onClick={handleSignInMerchantAccount}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <LogIn className="h-4 w-4 text-emerald-400" />
              <span>Sign in with Merchant Account</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Action 3: Stay in Personal */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Stay in Personal
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
