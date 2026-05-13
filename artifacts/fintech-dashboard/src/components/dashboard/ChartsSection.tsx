import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/lib/dashboard-context";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  const { formatCurrency, theme } = useDashboard();

  if (active && payload && payload.length) {
    return (
      <div className={cn("rounded-xl border p-3 shadow-xl backdrop-blur-md", theme === "dark" ? "border-slate-700/50 bg-slate-900/90" : "border-slate-200 bg-white/90")}>
        <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wider", theme === "dark" ? "text-slate-300" : "text-slate-600")}>{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full ring-2", theme === "dark" ? "ring-slate-900" : "ring-white")} style={{ backgroundColor: entry.color, boxShadow: `0 0 0 1px ${entry.color}` }} />
                <span className={cn("font-medium", theme === "dark" ? "text-slate-400" : "text-slate-600")}>{entry.name}</span>
              </div>
              <span className={cn("font-bold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>{formatCurrency(Number(entry.value))}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function DonutChart() {
  const { theme } = useDashboard();
  const { expenseBreakdown, summary } = useTransactions();
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 88;
  const innerRadius = 58;
  const strokeWidth = outerRadius - innerRadius;
  const r = (outerRadius + innerRadius) / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;
  const total = expenseBreakdown.reduce((s, d) => s + d.amount, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {expenseBreakdown.map((item) => {
        const pct = total > 0 ? item.amount / total : 0;
        const dash = pct * circumference - (pct < 1 ? 2 : 0);
        const offset = -cumulative * circumference;
        cumulative += pct;
        return (
          <circle
            key={item.name}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={theme === "dark" ? "#e2e8f0" : "#1e293b"} fontSize="22" fontWeight="700">{summary.healthScore}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={theme === "dark" ? "#64748b" : "#64748b"} fontSize="11">health score</text>
    </svg>
  );
}

export function ChartsSection() {
  const { convertFromINR, formatCompactCurrency, theme } = useDashboard();
  const { monthlyChartData, expenseBreakdown } = useTransactions();

  const chartData = monthlyChartData.map((row) => ({
    ...row,
    income: convertFromINR(row.income),
    expenses: convertFromINR(row.expenses),
  }))

  return (
    <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7 mt-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="md:col-span-4 lg:col-span-5"
      >
        <Card className={cn("h-full hover:border-slate-600/50 transition-colors", theme === "dark" ? "bg-[#1e293b]/80 border-slate-700/50" : "bg-white border-slate-200")}>
          <CardHeader className="pb-4">
            <CardTitle className={cn("text-base font-semibold", theme === "dark" ? "text-slate-200" : "text-slate-900")}>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="h-[300px] w-full overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'thin' }}>
              <div style={{ minWidth: '700px', height: '100%', paddingRight: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={theme === "dark" ? "#334155" : "#e2e8f0"} vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === "dark" ? "#64748b" : "#64748b"} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      tick={{ fill: theme === "dark" ? '#64748b' : '#64748b' }}
                    />
                    <YAxis 
                      stroke={theme === "dark" ? "#64748b" : "#64748b"} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => formatCompactCurrency(Number(value))}
                      tick={{ fill: theme === "dark" ? '#64748b' : '#64748b' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500, color: '#94a3b8' }} 
                      iconType="circle"
                    />
                    <Area 
                      type="monotone" 
                      name="Income"
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorIncome)"
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#0f172a", strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      name="Expenses"
                      dataKey="expenses" 
                      stroke="#f43f5e" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorExpenses)"
                      activeDot={{ r: 6, fill: "#f43f5e", stroke: "#0f172a", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="md:col-span-3 lg:col-span-2"
      >
        <Card className={cn("h-full hover:border-slate-600/50 transition-colors", theme === "dark" ? "bg-[#1e293b]/80 border-slate-700/50" : "bg-white border-slate-200")}>
          <CardHeader className="pb-0">
            <CardTitle className={cn("text-base font-semibold", theme === "dark" ? "text-slate-200" : "text-slate-900")}>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2 pb-4">
            <div className="flex justify-center w-full mt-2">
              <DonutChart />
            </div>
            
            <div className={cn("w-full mt-3 rounded-xl p-3 border", theme === "dark" ? "bg-slate-900/40 border-slate-800/50" : "bg-slate-50 border-slate-200")}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                {expenseBreakdown.length === 0 && (
                  <div className="col-span-2 text-center text-slate-500 py-2">No expenses recorded yet.</div>
                )}
                {expenseBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className={cn("truncate flex-1 font-medium", theme === "dark" ? "text-slate-400" : "text-slate-600")}>{item.name}</span>
                    <span className={cn("font-bold", theme === "dark" ? "text-slate-200" : "text-slate-900")}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
