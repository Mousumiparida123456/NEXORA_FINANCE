import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { MerchantSidebar } from "./MerchantSidebar";
import { MERCHANT_NAV_ITEMS } from "../merchant-nav";

export function MerchantLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const activeItem = MERCHANT_NAV_ITEMS.find((item) =>
    item.href === "/merchant" ? location === item.href : location.startsWith(item.href),
  );

  return (
    <div className="min-h-screen bg-[#040a17] font-sans text-slate-50">
      <div className="md:flex md:min-h-screen">
        <MerchantSidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#07131e]/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 md:hidden">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-emerald-400 md:hidden">NEXORA SENTINEL</p>
                  <p className="truncate text-sm font-semibold text-slate-100">{activeItem?.label ?? "Merchant Intelligence"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>DEMO MODE ACTIVE · Synthetic Datasets</span>
                </div>
                <Link href="/dashboard">
                  <a className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white sm:flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Personal Finance
                  </a>
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
