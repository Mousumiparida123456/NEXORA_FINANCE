import { useDashboard } from "@/lib/dashboard-context";
import { InsightsSection } from "@/components/dashboard/InsightsSection";

export function Insights() {
  const { theme } = useDashboard();

  return (
    <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 max-w-6xl">
      <div className="mb-8">
        <h1 className={theme === "dark" ? "text-3xl font-bold text-slate-50 tracking-tight" : "text-3xl font-bold text-slate-950 tracking-tight"}>Insights</h1>
        <p className={theme === "dark" ? "mt-1.5 max-w-2xl text-sm font-medium text-slate-400" : "mt-1.5 max-w-2xl text-sm font-medium text-slate-500"}>
          Understand your spending patterns and financial trends.
        </p>
      </div>
      <InsightsSection />
    </main>
  );
}
