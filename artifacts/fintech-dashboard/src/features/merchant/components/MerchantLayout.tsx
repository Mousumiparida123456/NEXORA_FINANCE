import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X, ArrowLeft } from "lucide-react";
import { MerchantSidebar } from "./MerchantSidebar";
import { MERCHANT_NAV_ITEMS, MERCHANT_NAV_SECTIONS } from "../merchant-nav";
import { SentinelProvider } from "../context/SentinelContext";
import { WorkspacePillSwitcher } from "@/components/layout/WorkspacePillSwitcher";
import { cn } from "@/lib/utils";

export function MerchantLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = MERCHANT_NAV_ITEMS.find((item) =>
    item.href === "/merchant" ? location === item.href : location.startsWith(item.href),
  );

  // Close drawer on location change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <SentinelProvider>
      <div className="min-h-screen bg-[#040a17] font-sans text-slate-50 overflow-x-hidden">
        <div className="md:flex md:min-h-screen">
          {/* Desktop Left Sidebar */}
          <MerchantSidebar />

          {/* Main Layout Area */}
          <div className="min-w-0 flex-1 flex flex-col">
            {/* Top Responsive Header */}
            <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#07131e]/95 backdrop-blur">
              <div className="flex h-16 items-center justify-between px-3 sm:px-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mobile Hamburger Toggle */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white md:hidden"
                    aria-label="Open Navigation Drawer"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-emerald-400 uppercase truncate">
                      NEXORA SENTINEL
                    </p>
                    <p className="truncate text-xs sm:text-sm font-semibold text-slate-100">
                      {activeItem?.label ?? "Merchant Intelligence"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Compact Demo Badge for Mobile */}
                  <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>DEMO</span>
                  </div>

                  {/* Full Demo Badge for Desktop/Tablet */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>DEMO MODE ACTIVE · Synthetic Datasets</span>
                  </div>

                  <Link href="/dashboard">
                    <a className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-white transition-all">
                      <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Personal Finance</span>
                      <span className="sm:hidden">PF</span>
                    </a>
                  </Link>
                </div>
              </div>
            </header>

            {/* Mobile Navigation Drawer Overlay */}
            {drawerOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                  onClick={() => setDrawerOpen(false)}
                />

                {/* Drawer Menu Panel */}
                <div className="relative z-10 w-72 max-w-[85vw] bg-[#07131e] border-r border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                        <ShieldCheck className="h-5 w-5" />
                      </span>
                      <div>
                        <span className="block text-xs font-bold tracking-widest text-emerald-400">SENTINEL</span>
                        <span className="block text-[10px] text-slate-400">Merchant Protection</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-3 border-b border-slate-800">
                    <WorkspacePillSwitcher />
                  </div>

                  <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                    {MERCHANT_NAV_SECTIONS.map((section) => (
                      <div key={section.title}>
                        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">
                          {section.title}
                        </p>
                        {section.items.map(({ href, icon: Icon, label }) => {
                          const active = href === "/merchant" ? location === href : location.startsWith(href);

                          return (
                            <Link key={href} href={href}>
                              <a
                                onClick={() => setDrawerOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors mb-0.5",
                                  active
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                              </a>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </nav>

                  <div className="p-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
                    Nexora Sentinel Demo v2.0
                  </div>
                </div>
              </div>
            )}

            {/* Page Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-8 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SentinelProvider>
  );
}
