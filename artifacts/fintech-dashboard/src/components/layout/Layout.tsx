import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme } = useDashboard();

  return (
    <div
      className={
        theme === "dark"
          ? "min-h-screen supports-[height:100dvh]:min-h-dvh bg-[#060c20] text-slate-50 font-sans selection:bg-blue-500/30 selection:text-blue-100"
          : "min-h-screen supports-[height:100dvh]:min-h-dvh bg-[#f8fafc] text-slate-950 font-sans selection:bg-blue-200 selection:text-slate-950"
      }
    >
      <div className="md:flex md:min-h-screen supports-[height:100dvh]:md:min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <MobileNav />
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isAuthRoute = location === "/login" || location.startsWith("/login/");

  if (isAuthRoute) {
    return (
      <div className="min-h-screen supports-[height:100dvh]:min-h-dvh bg-[#0f172a] text-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <div className="min-h-screen supports-[height:100dvh]:min-h-dvh">
          {children}
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
