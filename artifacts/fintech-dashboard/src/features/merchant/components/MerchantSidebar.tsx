import { Link, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import { MERCHANT_NAV_SECTIONS } from "../merchant-nav";
import { cn } from "@/lib/utils";
import { WorkspacePillSwitcher } from "@/components/layout/WorkspacePillSwitcher";

export function MerchantSidebar() {
  const [location] = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-[#07131e] md:flex">
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold tracking-[0.16em] text-emerald-400">NEXORA SENTINEL</span>
              <span className="block text-[11px] text-slate-400">Merchant Protection</span>
            </span>
        </div>
        <WorkspacePillSwitcher />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Merchant Intelligence navigation">
        {MERCHANT_NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">{section.title}</p>
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = href === "/merchant" ? location === href : location.startsWith(href);

              return (
                <Link key={href} href={href}>
                  <a aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors", active ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100")}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
        Merchant workspace
      </div>
    </aside>
  );
}
