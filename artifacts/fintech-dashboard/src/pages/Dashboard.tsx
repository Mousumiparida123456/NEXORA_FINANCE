import { useEffect, useState } from "react";
import { ShieldAlert, Lightbulb, TrendingUp } from "lucide-react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { apiBaseUrl, fetchApiHealth } from "@/lib/api";
import { useDashboard } from "@/lib/dashboard-context";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { SecurityAudit } from "@/components/dashboard/SecurityAudit";
import { Download, FileText } from "lucide-react";
import { generateFinancialReport, ReportData } from "@/lib/pdf-export";
import { 
  calculateInvestmentAnalytics, 
  generateSmartInsights, 
  calculateMonthlyComparison,
  calculateNextMilestone 
} from "@/lib/insights-engine";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/lib/notification-context";
import { useTransactionsContext } from "@/lib/transactions-context";
import { useMemo } from "react";
import { subMonths, isSameMonth, parseISO, format } from "date-fns";

type ApiStatus = "checking" | "connected" | "error" | "missing";

export function Dashboard() {
  const { theme } = useDashboard();
  const [apiStatus, setApiStatus] = useState<ApiStatus>(
    apiBaseUrl ? "checking" : "missing",
  );
  const [apiMessage, setApiMessage] = useState(
    apiBaseUrl ? "Checking backend connection..." : "Set VITE_API_BASE_URL in Vercel.",
  );
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { checkSpending } = useNotifications();
  const { transactions, summary } = useTransactionsContext();
  const { formatCurrency } = useDashboard();

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast({ title: "Generating Report...", description: "Nexora AI is analyzing your data for the PDF." });
    
    try {
      // 1. Prepare data for the report
      const investAnalytics = calculateInvestmentAnalytics(transactions);
      const monthlyComparison = calculateMonthlyComparison(transactions);
      const aiInsights = generateSmartInsights(transactions, monthlyComparison);
      const milestone = calculateNextMilestone(transactions);
      
      const reportData: ReportData = {
        summary: {
          totalIncome: summary.totalIncome,
          totalExpenses: summary.totalExpenses,
          savings: summary.savings,
          healthScore: summary.healthScore
        },
        expenses: expenseBreakdown.map(eb => ({
          name: eb.name,
          amount: eb.amount,
          percentage: eb.value
        })),
        investments: {
          totalInvested: investAnalytics.totalInvested,
          netGain: investAnalytics.netGain,
          roiPercent: investAnalytics.roiPercent,
          breakdown: investAnalytics.categoryBreakdown.map(cb => ({
            name: cb.name,
            amount: cb.amount
          }))
        },
        insights: aiInsights,
        milestone: {
          title: milestone.title,
          remaining: milestone.remaining,
          progressPct: milestone.progressPct
        }
      };

      // 2. Generate PDF
      const success = await generateFinancialReport(reportData, `Nexora_Report_${format(new Date(), "MMM_yyyy")}.pdf`);
      
      setIsExporting(false);
      if (success) {
        toast({ title: "Report Ready", description: "Your professional financial summary has been downloaded." });
      } else {
        toast({ title: "Export Failed", description: "Could not generate PDF. Check console for details.", variant: "destructive" });
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      setIsExporting(false);
      toast({ title: "Error", description: "An unexpected error occurred during report generation.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!apiBaseUrl) return;

    const controller = new AbortController();

    fetchApiHealth(controller.signal)
      .then((data) => {
        setApiStatus(data.status === "ok" ? "connected" : "error");
        setApiMessage(
          data.status === "ok"
            ? `Connected to ${apiBaseUrl}`
            : `Unexpected API status: ${data.status}`,
        );
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setApiStatus("error");
        setApiMessage(
          error instanceof Error ? error.message : "Unable to reach backend.",
        );
      });

    return () => controller.abort();
  }, []);

  // AI Spending Analysis Trigger
  useEffect(() => {
    if (transactions.length < 5) return;

    // Calculate overspends
    const now = new Date();
    const currentMonthTxns = transactions.filter(t => t.date && isSameMonth(parseISO(t.date), now) && t.type === "expense");
    const last3Months = [subMonths(now, 1), subMonths(now, 2), subMonths(now, 3)];
    
    const categories = Array.from(new Set(transactions.map(t => t.category)));
    const overspends: any[] = [];

    categories.forEach(cat => {
      const current = currentMonthTxns.filter(t => t.category === cat).reduce((s, t) => s + Number(t.amount), 0);
      if (current === 0) return;

      let historyTotal = 0;
      let monthsWithData = 0;
      last3Months.forEach(m => {
        const monthAmt = transactions.filter(t => t.date && isSameMonth(parseISO(t.date), m) && t.category === cat && t.type === "expense")
          .reduce((s, t) => s + Number(t.amount), 0);
        if (monthAmt > 0) {
          historyTotal += monthAmt;
          monthsWithData++;
        }
      });

      const average = monthsWithData > 0 ? historyTotal / monthsWithData : 0;
      if (average > 0 && current > average * 1.2) {
        overspends.push({
          category: cat,
          current,
          average,
          pctIncrease: ((current - average) / average) * 100
        });
      }
    });

    checkSpending({
      categoryOverspends: overspends,
      totalExpenses: summary.totalExpenses,
      totalIncome: summary.totalIncome
    }, formatCurrency);
  }, [transactions, summary, checkSpending, formatCurrency]);

  const apiBadgeClassName =
    apiStatus === "connected"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : apiStatus === "checking"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-rose-500/30 bg-rose-500/10 text-rose-300";

  return (
    <main id="dashboard-content" className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className={theme === "dark" ? "text-3xl font-bold text-slate-50 tracking-tight" : "text-3xl font-bold text-slate-950 tracking-tight"}>Dashboard</h1>
            <p className={theme === "dark" ? "mt-1.5 font-medium text-slate-400" : "mt-1.5 font-medium text-slate-500"}>Here's your financial overview for October 2024.</p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 disabled:opacity-50 transition-all"
          >
            {isExporting ? <FileText className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
            {isExporting ? "Exporting..." : "Download Report"}
          </button>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${apiBadgeClassName}`}>
          <p className="font-semibold">
            {apiStatus === "connected"
              ? "Backend Connected"
              : apiStatus === "checking"
                ? "Checking Backend"
                : "Backend Not Ready"}
          </p>
          <p className="mt-1 text-xs opacity-80">{apiMessage}</p>
        </div>
      </div>
      <SummaryCards />

      <ChartsSection />

      <div className="mt-10">
        <ForecastChart />
      </div>

      <section className="mt-10 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={theme === "dark" ? "text-xl font-semibold text-slate-50" : "text-xl font-semibold text-slate-950"}>Nexora Intelligence</h2>
            <p className={theme === "dark" ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Real-time analysis powered by Gemini 1.5 Pro</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <AIInsights />
          </div>

          <SecurityAudit />
        </div>
      </section>
    </main>
  );
}
