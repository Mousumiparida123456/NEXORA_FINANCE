import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, TrendingUp, CreditCard, Bell,
  X, CheckCheck, Target, Repeat2, BellOff,
  ArrowUpRight, RefreshCw, Sparkles, ShieldAlert,
  Wallet, Eye, EyeOff, Trash2,
} from "lucide-react";
import { useNotifications, type AppNotification, type NotificationCategory } from "@/lib/notification-context";
import { formatRelativeTime } from "@/lib/notification-engine";

// ─── Config per category ────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NotificationCategory, {
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBar: string;
}> = {
  transaction: {
    icon: Wallet, label: "Transaction",
    iconBg: "bg-blue-500/15", iconColor: "text-blue-400",
    badgeBg: "bg-blue-500/10", badgeText: "text-blue-400",
    borderColor: "border-blue-500/20", accentBar: "bg-blue-500",
  },
  goal: {
    icon: Target, label: "Goal",
    iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10", badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/20", accentBar: "bg-emerald-500",
  },
  bill: {
    icon: CreditCard, label: "Bill",
    iconBg: "bg-rose-500/15", iconColor: "text-rose-400",
    badgeBg: "bg-rose-500/10", badgeText: "text-rose-400",
    borderColor: "border-rose-500/20", accentBar: "bg-rose-500",
  },
  recurring: {
    icon: Repeat2, label: "Recurring",
    iconBg: "bg-amber-500/15", iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/10", badgeText: "text-amber-400",
    borderColor: "border-amber-500/20", accentBar: "bg-amber-500",
  },
  investment: {
    icon: TrendingUp, label: "Investment",
    iconBg: "bg-indigo-500/15", iconColor: "text-indigo-400",
    badgeBg: "bg-indigo-500/10", badgeText: "text-indigo-400",
    borderColor: "border-indigo-500/20", accentBar: "bg-indigo-500",
  },
  credit: {
    icon: ShieldAlert, label: "Credit",
    iconBg: "bg-purple-500/15", iconColor: "text-purple-400",
    badgeBg: "bg-purple-500/10", badgeText: "text-purple-400",
    borderColor: "border-purple-500/20", accentBar: "bg-purple-500",
  },
  ai_insight: {
    icon: Sparkles, label: "AI Insight",
    iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10", badgeText: "text-cyan-400",
    borderColor: "border-cyan-500/20", accentBar: "bg-cyan-500",
  },
  system: {
    icon: Bell, label: "System",
    iconBg: "bg-slate-500/15", iconColor: "text-slate-400",
    badgeBg: "bg-slate-500/10", badgeText: "text-slate-400",
    borderColor: "border-slate-500/20", accentBar: "bg-slate-500",
  },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", dot: "bg-rose-500", ring: "ring-rose-500/20" },
  high:     { label: "High",     dot: "bg-amber-400", ring: "ring-amber-400/20" },
  medium:   { label: "Medium",   dot: "bg-blue-400",  ring: "ring-blue-400/20" },
  low:      { label: "Low",      dot: "bg-slate-500", ring: "ring-slate-500/20" },
};

type FilterTab = "all" | NotificationCategory;

const FILTER_TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: "all",          label: "All",          icon: Bell },
  { id: "transaction",  label: "Transactions", icon: Wallet },
  { id: "goal",         label: "Goals",        icon: Target },
  { id: "bill",         label: "Bills",        icon: CreditCard },
  { id: "recurring",    label: "Recurring",    icon: Repeat2 },
  { id: "investment",   label: "Investment",   icon: TrendingUp },
  { id: "credit",       label: "Credit",       icon: ShieldAlert },
  { id: "ai_insight",   label: "AI Insights",  icon: Sparkles },
  { id: "system",       label: "System",       icon: Bell },
];

// ─── Alert Card ─────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onDismiss,
  onToggleRead,
}: {
  alert: AppNotification;
  onDismiss: (id: string) => void;
  onToggleRead: (id: string) => void;
}) {
  const cfg  = CATEGORY_CONFIG[alert.category];
  const pri  = PRIORITY_CONFIG[alert.priority];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`relative flex gap-4 rounded-2xl border bg-[#1e293b]/80 p-5 overflow-hidden
        ${alert.read ? "opacity-60" : ""}
        ${alert.priority === "critical" || alert.priority === "high" ? "border-slate-700/70 shadow-lg" : "border-slate-800/60"}
      `}
    >
      {/* Left priority accent bar */}
      {!alert.read && (
        <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${cfg.accentBar}`} />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 h-11 w-11 rounded-2xl ${cfg.iconBg} flex items-center justify-center mt-0.5`}>
        <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type badge */}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.borderColor}`}>
              {cfg.label}
            </span>

            {/* Priority indicator */}
            {!alert.read && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-800/60 ring-1 ${pri.ring}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
                <span className="text-slate-400">{pri.label}</span>
              </span>
            )}
          </div>

          {/* Timestamp + dismiss */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-slate-600 font-medium">{formatRelativeTime(alert.createdAt)}</span>
            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-700/50 transition-all"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h3 className={`text-sm font-semibold mb-1 ${alert.read ? "text-slate-400" : "text-slate-100"}`}>
          {alert.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">{alert.message}</p>

        <div className="flex items-center gap-2">
          {alert.actionLink && (
            <a
              href={alert.actionLink}
              onClick={() => onToggleRead(alert.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95
                ${alert.category === "bill" || alert.category === "credit"
                  ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/25"
                  : alert.category === "investment"
                  ? "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/25"
                  : alert.category === "goal"
                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/25"
                  : alert.category === "ai_insight"
                  ? "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/25"
                  : "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/25"
                }`}
            >
              View
              <ArrowUpRight className="h-3 w-3" />
            </a>
          )}

          <button
            onClick={() => onToggleRead(alert.id)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all border border-transparent hover:border-slate-700/60"
          >
            {alert.read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {alert.read ? "Mark unread" : "Mark read"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showCount, setShowCount] = useState(20);

  const countByCategory = (cat: NotificationCategory) => notifications.filter((a) => a.category === cat).length;

  const filtered = useMemo(() => {
    const list = notifications
      .filter((a) => activeFilter === "all" || a.category === activeFilter)
      .sort((a, b) => {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (!a.read && b.read) return -1;
        if (a.read && !b.read) return 1;
        return pOrder[a.priority] - pOrder[b.priority];
      });
    return list;
  }, [notifications, activeFilter]);

  const paginated = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  function toggleRead(id: string) {
    const n = notifications.find((a) => a.id === id);
    if (n?.read) markAsUnread(id);
    else markAsRead(id);
  }

  // Summary cards data
  const summaryCards = [
    {
      label: "Overspend & Bills",
      count: notifications.filter(a => a.category === "bill" || a.category === "credit").length,
      unreadCount: notifications.filter(a => (a.category === "bill" || a.category === "credit") && !a.read).length,
      icon: ShieldAlert,
      color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20",
    },
    {
      label: "Investments",
      count: countByCategory("investment"),
      unreadCount: notifications.filter(a => a.category === "investment" && !a.read).length,
      icon: TrendingUp,
      color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20",
    },
    {
      label: "AI Insights",
      count: countByCategory("ai_insight"),
      unreadCount: notifications.filter(a => a.category === "ai_insight" && !a.read).length,
      icon: Sparkles,
      color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20",
    },
  ];

  return (
    <main className="px-4 sm:px-6 py-6 sm:py-8 pb-20 max-w-3xl mx-auto">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center h-7 min-w-7 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 text-sm font-bold text-rose-400">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1.5 font-medium">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""} need your attention`
              : "You're all caught up — no unread alerts"}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
      >
        {summaryCards.map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} px-4 py-4`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            </div>
            <div className="flex items-end gap-1.5">
              <span className={`text-2xl font-black ${s.color}`}>{s.count}</span>
              {s.unreadCount > 0 && (
                <span className="text-[10px] font-semibold text-slate-500 mb-0.5">{s.unreadCount} unread</span>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex gap-1.5 flex-wrap mb-5"
      >
        {FILTER_TABS.map((tab) => {
          const count = tab.id === "all"
            ? notifications.length
            : notifications.filter(a => a.category === tab.id).length;

          if (tab.id !== "all" && count === 0) return null;

          return (
            <button
              key={tab.id}
              onClick={() => { setActiveFilter(tab.id); setShowCount(20); }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border
                ${activeFilter === tab.id
                  ? "bg-slate-700/60 text-slate-100 border-slate-600/60"
                  : "bg-transparent text-slate-500 border-slate-800/60 hover:text-slate-300 hover:border-slate-700/60"
                }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none
                ${activeFilter === tab.id ? "bg-slate-600 text-slate-200" : "bg-slate-800 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Alert list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {paginated.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                <BellOff className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-base font-semibold text-slate-500">No alerts here</p>
              <p className="text-sm text-slate-600 mt-1">
                {activeFilter === "all"
                  ? "You'll receive smart notifications as your financial activity grows."
                  : `No ${activeFilter.replace("_", " ")} alerts at the moment`}
              </p>
              {activeFilter !== "all" && (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  View all alerts
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {/* Unread section */}
              {paginated.some(a => !a.read) && (
                <motion.div key="unread-header" layout>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unread</p>
                  </div>
                  <div className="space-y-3">
                    {paginated.filter(a => !a.read).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={deleteNotification}
                        onToggleRead={toggleRead}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Read section */}
              {paginated.some(a => a.read) && (
                <motion.div key="read-header" layout>
                  {paginated.some(a => !a.read) && (
                    <div className="flex items-center gap-2 mt-6 mb-2 px-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Earlier</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {paginated.filter(a => a.read).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={deleteNotification}
                        onToggleRead={toggleRead}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Load More */}
              {hasMore && (
                <motion.div key="load-more" layout className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowCount((c) => c + 20)}
                    className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
                  >
                    Load more ({filtered.length - showCount} remaining)
                  </button>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
