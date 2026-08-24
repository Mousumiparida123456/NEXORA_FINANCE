import { Link, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { MERCHANT_NAV_SECTIONS } from "../merchant-nav";
import { cn } from "@/lib/utils";
import { WorkspacePillSwitcher } from "@/components/layout/WorkspacePillSwitcher";

export function MerchantSidebar() {
  const [location] = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-[#07131e] md:flex">
      {/* Header & Switcher */}
      <div className="border-b border-slate-800 px-3 py-2.5">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30 font-bold">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[11px] font-bold tracking-[0.16em] text-emerald-400">NEXORA SENTINEL</span>
            <span className="block text-[10px] text-slate-400">Merchant Protection</span>
          </span>
        </div>
        <WorkspacePillSwitcher size="sm" />
      </div>

      {/* Navigation list - compact spacing */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-2 py-2 scrollbar-none" aria-label="Merchant Intelligence navigation">
        {MERCHANT_NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-0.5 mt-1 px-2.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500/80">
              {section.title}
            </p>
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = href === "/merchant" ? location === href : location.startsWith(href);

              return (
                <Link key={href} href={href}>
                  <a
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors mb-0.5",
                      active
                        ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-3 py-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>Nexora Sentinel</span>
        <span className="text-emerald-500/70 font-semibold">v2.0</span>
      </div>
    </aside>
  );
}
