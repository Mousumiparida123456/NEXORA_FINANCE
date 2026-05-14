import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";
import { useDashboard } from "@/lib/dashboard-context";

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
          <div className="hidden md:block">
            <Topbar />
          </div>
          <div className="md:hidden">
            <MobileNav />
          </div>
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function Layout({
  children,
  showShell = false,
}: {
  children: React.ReactNode;
  showShell?: boolean;
}) {
  if (!showShell) {
    // Auth pages and loading states: full-page dark background, no sidebar
    return (
      <div className="min-h-screen supports-[height:100dvh]:min-h-dvh bg-[#060c20] text-slate-50 font-sans">
        {children}
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
