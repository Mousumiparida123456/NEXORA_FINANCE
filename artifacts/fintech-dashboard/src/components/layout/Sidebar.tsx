import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PieChart,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BRAND, MAIN_NAV, TOOL_NAV } from "@/components/layout/nav";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard-context";

function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
  theme,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  active: boolean;
  theme: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <Link href={href}>
      <div
        title={collapsed ? label : undefined}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150",
          active
            ? isDark
              ? "bg-blue-500/20 text-blue-300 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.22)]"
              : "bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]"
            : isDark
              ? "text-slate-500 hover:bg-slate-800/60 hover:text-slate-100"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        )}
      >
        {active ? (
          <motion.div
            layoutId="sidebar-active-bar"
            className={cn(
              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full",
              isDark ? "bg-blue-400" : "bg-white/80",
            )}
          />
        ) : null}

        <Icon
          className={cn(
            "h-[18px] w-[18px] flex-shrink-0 transition-colors",
            active
              ? isDark
                ? "text-blue-300"
                : "text-white"
              : isDark
                ? "text-slate-500 group-hover:text-slate-300"
                : "text-slate-500 group-hover:text-slate-700",
          )}
        />

        {!collapsed ? (
          <span className="overflow-hidden whitespace-nowrap text-sm font-medium">{label}</span>
        ) : null}

        {collapsed ? (
          <div className="pointer-events-none absolute left-full z-50 ml-3 hidden items-center group-hover:flex">
            <div
              className={cn(
                "rounded-lg border px-3 py-1.5 shadow-xl",
                isDark ? "border-slate-700/60 bg-slate-800" : "border-slate-200 bg-white",
              )}
            >
              <span className={cn("whitespace-nowrap text-xs font-medium", isDark ? "text-slate-200" : "text-slate-700")}>
                {label}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, user } = useDashboard();
  const isDark = theme === "dark";

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  function handleLogout() {
    api.logout();
  }

  const displayName = user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : "John Doe";
  const initials = user?.firstName ? (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase() : "JD";

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative sticky top-0 z-40 hidden h-screen flex-shrink-0 flex-col overflow-hidden md:flex",
        isDark ? "border-r border-slate-800/60 bg-[#081126]" : "border-r border-slate-200 bg-white/95 backdrop-blur",
      )}
    >
      <div className={cn("flex items-center gap-3 border-b px-4 py-5", isDark ? "border-slate-800/60" : "border-slate-200", collapsed ? "justify-center px-0" : "")}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.28)]">
          <PieChart className="h-5 w-5 text-white" />
        </div>
        {!collapsed ? (
          <div>
            <p className={cn("leading-none tracking-tight text-base font-bold", isDark ? "text-slate-50" : "text-slate-950")}>{BRAND.name}</p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500">{BRAND.tagline}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div>
          {!collapsed ? (
            <p className={cn("mb-2 px-3 text-[10px] font-bold uppercase tracking-widest", isDark ? "text-slate-600" : "text-slate-400")}>
              Main Menu
            </p>
          ) : null}
          <div className="space-y-0.5">
            {MAIN_NAV.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} active={isActive(item.href)} theme={theme} />
            ))}
          </div>
        </div>

        <div>
          {!collapsed ? (
            <p className={cn("mb-2 px-3 text-[10px] font-bold uppercase tracking-widest", isDark ? "text-slate-600" : "text-slate-400")}>
              Tools
            </p>
          ) : null}
          <div className="space-y-0.5">
            {TOOL_NAV.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} active={isActive(item.href)} theme={theme} />
            ))}
          </div>
        </div>
      </nav>

      <div className={cn("space-y-0.5 border-t px-3 py-3", isDark ? "border-slate-800/60" : "border-slate-200")}>
        <NavItem href="/notifications" label="Notifications" icon={Bell} collapsed={collapsed} active={isActive("/notifications")} theme={theme} />
        <NavItem href="/settings" label="Settings" icon={Settings} collapsed={collapsed} active={isActive("/settings")} theme={theme} />

        <div className={cn("mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all", isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-100", collapsed ? "justify-center" : "")}>
          <Avatar className={cn("h-8 w-8 flex-shrink-0 border ring-2", isDark ? "border-slate-700 ring-blue-500/20" : "border-slate-200 ring-blue-500/15")}>
            <AvatarImage src={user?.profileImageUrl || `https://i.pravatar.cc/150?u=${user?.id || 'default'}`} />
            <AvatarFallback className={cn("text-xs", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700")}>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className={cn("truncate text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-900")}>{displayName}</p>
              <p className="truncate text-[10px] text-slate-500">{user?.email || "Free Plan"}</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn("group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 transition-all hover:bg-rose-500/10 hover:text-rose-300", collapsed ? "justify-center" : "")}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-slate-500 transition-colors group-hover:text-rose-300" />
          {!collapsed ? <span className="whitespace-nowrap text-sm font-medium">Logout</span> : null}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-[68px] z-50 flex h-8 w-8 items-center justify-center rounded-full border bg-white/95 text-slate-700 shadow-lg transition-all backdrop-blur-sm hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40",
          isDark
            ? "border-slate-700/80 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-100"
            : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950",
        )}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
      </button>
    </motion.aside>
  );
}
