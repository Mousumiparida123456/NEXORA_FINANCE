import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCcw, BrainCircuit } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function AIInsights() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const data = await api.getAIInsights();
      setInsight(data.advice);
    } catch (error) {
      console.error("Failed to fetch AI insights", error);
      setInsight("Unable to generate insights right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          AI Financial Intelligence
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchInsight} 
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-primary/10" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-primary/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-primary/10" />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
            >
              {insight || "Analyzing your spending patterns to provide elite financial advice..."}
            </motion.div>
          )}
          
          <div className="pt-2 flex items-center gap-2 text-[10px] text-primary/60 font-mono">
            <Sparkles className="h-3 w-3" />
            POWERED BY GEMINI 1.5 PRO • REAL-TIME ANALYSIS
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
