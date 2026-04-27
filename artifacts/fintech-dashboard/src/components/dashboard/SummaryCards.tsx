import { motion } from "framer-motion";
import { IndianRupee, CreditCard, PiggyBank, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";

const totals = {
  income: 12450 * 83,
  expenses: 7890 * 83,
  savings: 4560 * 83,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function SummaryCards() {
  const { formatCurrency } = useDashboard();

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <motion.div variants={item}>
        <Card className="border-slate-200/80 bg-white/90 transition-all duration-300 shadow-sm hover:shadow-md dark:border-slate-800/70 dark:bg-[#091227]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Income</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{formatCurrency(totals.income)}</div>
            <p className="mt-1 flex items-center text-xs font-medium text-emerald-400">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8.2% vs last month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-slate-200/80 bg-white/90 transition-all duration-300 shadow-sm hover:shadow-md dark:border-slate-800/70 dark:bg-[#091227]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{formatCurrency(totals.expenses)}</div>
            <p className="mt-1 flex items-center text-xs font-medium text-rose-400">
              <TrendingDown className="mr-1 h-3 w-3" />
              -3.1% vs last month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-slate-200/80 bg-white/90 transition-all duration-300 shadow-sm hover:shadow-md dark:border-slate-800/70 dark:bg-[#091227]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Savings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-teal-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{formatCurrency(totals.savings)}</div>
            <p className="mt-1 flex items-center text-xs font-medium text-teal-400">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.4% vs last month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="relative overflow-hidden border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-[0_0_15px_rgba(245,158,11,0.05)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] dark:border-slate-700 dark:from-[#091227] dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Financial Health</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">74</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/100</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 ring-1 ring-inset ring-amber-500/20 uppercase tracking-wider">
                  Average
                </span>
              </div>
            </div>
            
            <div className="relative h-14 w-14">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  strokeDasharray="100, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                />
                <path
                  className="text-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-out"
                  strokeDasharray="74, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
