import { useMemo } from "react";
import { useAnalyticsStore } from "@/lib/analytics-store";
import { Award, ShieldCheck, Flame, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function GamificationBadges() {
  const snapshot = useAnalyticsStore();

  const badges = useMemo(() => {
    const list = [];
    const health = snapshot.healthScore || 0;
    const savingsRate = snapshot.totals.savingsRate || 0;
    const transactions = snapshot.totals.expenseCount + snapshot.totals.incomeCount;

    if (health >= 80) {
      list.push({ id: "elite", name: "Financial Elite", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" });
    }
    if (savingsRate >= 30) {
      list.push({ id: "saver", name: "Super Saver", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" });
    }
    if (transactions > 10) {
      list.push({ id: "active", name: "Active Tracker", icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" });
    }
    if (health >= 60 && health < 80) {
      list.push({ id: "steady", name: "Steady Builder", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" });
    }

    if (list.length === 0) {
      list.push({ id: "starter", name: "Journey Begun", icon: Award, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" });
    }

    return list;
  }, [snapshot]);

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <motion.div
            key={badge.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-2 rounded-xl border ${badge.border} ${badge.bg} px-3 py-1.5`}
            title="Gamification Achievement Badge"
          >
            <Icon className={`h-4 w-4 ${badge.color}`} />
            <span className="text-xs font-semibold text-slate-200">{badge.name}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
