import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";
import { CinematicIntro } from "./CinematicIntro";
import { useDashboard } from "@/lib/dashboard-context";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme } = useDashboard();
  const [forcePlay, setForcePlay] = useState(false);
  const [hasCompletedIntro, setHasCompletedIntro] = useState(() => {
    return Boolean(sessionStorage.getItem("nexora_intro_shown"));
  });

  useEffect(() => {
    const handleReplay = () => {
      sessionStorage.removeItem("nexora_intro_shown");
      setHasCompletedIntro(false);
      setForcePlay(true);
    };

    window.addEventListener("nexora-replay-intro", handleReplay);
    return () => {
      window.removeEventListener("nexora-replay-intro", handleReplay);
    };
  }, []);

  return (
    <div
      className={
        theme === "dark"
          ? "min-h-screen supports-[height:100dvh]:min-h-dvh bg-[#060c20] text-slate-50 font-sans selection:bg-blue-500/30 selection:text-blue-100"
          : "min-h-screen supports-[height:100dvh]:min-h-dvh bg-[#f8fafc] text-slate-950 font-sans selection:bg-blue-200 selection:text-slate-950"
      }
    >
      <CinematicIntro
        forcePlay={forcePlay}
        onComplete={() => {
          setHasCompletedIntro(true);
          setForcePlay(false);
        }}
      />

      <div className="md:flex md:min-h-screen supports-[height:100dvh]:md:min-h-dvh">
        <div className={!hasCompletedIntro ? "nexora-entrance-sidebar" : ""}>
          <Sidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={!hasCompletedIntro ? "hidden md:block nexora-entrance-header" : "hidden md:block"}>
            <Topbar />
          </div>
          <div className={!hasCompletedIntro ? "md:hidden nexora-entrance-header" : "md:hidden"}>
            <MobileNav />
          </div>
          <main className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 ${!hasCompletedIntro ? 'nexora-entrance-content' : ''}`}>
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

