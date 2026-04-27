import { Link, useLocation } from "wouter";
import { LogOut, Menu, PieChart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BRAND, MAIN_NAV, TOOL_NAV, BOTTOM_NAV } from "@/components/layout/nav";
import { api } from "@/lib/api";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

function MobileNavItem({
  href,
  label,
  icon: Icon,
  active,
  theme,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  theme: "light" | "dark";
}) {
  return (
    <SheetClose asChild>
      <Link href={href}>
        <a
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all border",
            active
              ? theme === "dark"
                ? "bg-blue-500/15 text-blue-300 border-blue-500/20"
                : "bg-blue-600 text-white border-blue-600"
              : theme === "dark"
                ? "text-slate-300 hover:bg-slate-800/60 border-transparent"
                : "text-slate-700 hover:bg-slate-100 border-transparent",
          )}
        >
          <Icon className={cn("h-4 w-4 flex-shrink-0", active ? (theme === "dark" ? "text-blue-300" : "text-white") : (theme === "dark" ? "text-slate-400" : "text-slate-500"))} />
          <span className="text-sm font-semibold">{label}</span>
        </a>
      </Link>
    </SheetClose>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const { theme } = useDashboard();
  const isDark = theme === "dark";

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  const currentLabel =
    [...MAIN_NAV, ...TOOL_NAV, ...BOTTOM_NAV].find((x) => isActive(x.href))?.label ?? BRAND.name;

  function handleLogout() {
    api.logout();
  }

  return (
    <div className={cn("md:hidden sticky top-0 z-50 border-b backdrop-blur", isDark ? "border-slate-800/60 bg-slate-950/80 supports-[backdrop-filter]:bg-slate-950/60" : "border-slate-200 bg-white/80 supports-[backdrop-filter]:bg-white/70")}>
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn("h-10 w-10 rounded-xl border flex items-center justify-center transition-all", isDark ? "border-slate-800/70 bg-slate-900/60 text-slate-200 hover:bg-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className={cn("w-[86vw] max-w-[320px] p-0", isDark ? "bg-slate-950 border-slate-800/70 text-slate-50" : "bg-white border-slate-200 text-slate-950")}
          >
            <div className={cn("flex items-center gap-3 px-4 py-5 border-b", isDark ? "border-slate-800/60" : "border-slate-200")}>
              <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.28)]">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-base font-bold tracking-tight leading-none truncate", isDark ? "text-slate-50" : "text-slate-950")}>
                  {BRAND.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                  {BRAND.tagline}
                </p>
              </div>
            </div>

            <ScrollArea className="h-[calc(100dvh-86px)] px-3 py-4">
              <div className="space-y-6">
                <div>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest px-2 mb-2", isDark ? "text-slate-600" : "text-slate-400")}>
                    Main Menu
                  </p>
                  <div className="space-y-1">
                    {MAIN_NAV.map((item) => (
                      <MobileNavItem key={item.href} {...item} active={isActive(item.href)} theme={theme} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest px-2 mb-2", isDark ? "text-slate-600" : "text-slate-400")}>
                    Tools
                  </p>
                  <div className="space-y-1">
                    {TOOL_NAV.map((item) => (
                      <MobileNavItem key={item.href} {...item} active={isActive(item.href)} theme={theme} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest px-2 mb-2", isDark ? "text-slate-600" : "text-slate-400")}>
                    More
                  </p>
                  <div className="space-y-1">
                    {BOTTOM_NAV.map((item) => (
                      <MobileNavItem key={item.href} {...item} active={isActive(item.href)} theme={theme} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest px-2 mb-2", isDark ? "text-slate-600" : "text-slate-400")}>
                    Session
                  </p>
                  <SheetClose asChild>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={cn("flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all hover:bg-rose-500/10 hover:text-rose-300", isDark ? "text-slate-300" : "text-slate-700")}
                    >
                      <LogOut className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-slate-400" : "text-slate-500")} />
                      <span className="text-sm font-semibold">Logout</span>
                    </button>
                  </SheetClose>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-500 truncate">{BRAND.name}</p>
          <p className={cn("text-sm font-bold truncate", isDark ? "text-slate-50" : "text-slate-950")}>{currentLabel}</p>
        </div>
      </div>
    </div>
  );
}
