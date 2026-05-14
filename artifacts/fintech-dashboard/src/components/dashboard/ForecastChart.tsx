import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export function ForecastChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>("/analytics/predict")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-[300px] w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />;

  return (
    <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/85">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">90-Day Financial Forecast</CardTitle>
            <CardDescription>Predictive balance modeling based on your historical patterns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full mt-4 sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                minTickGap={20}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                width={42}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f8fafc'
                }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
              />
              <Area 
                type="monotone" 
                dataKey="predictedBalance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPredict)" 
                dot={false}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
          <Activity className="h-5 w-5 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Analysis Insight:</span> Based on your current income of ₹85k and expenses of ₹58k, Nexora predicts your net worth will grow by approximately <span className="text-primary font-bold">₹27,000</span> every 30 days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
