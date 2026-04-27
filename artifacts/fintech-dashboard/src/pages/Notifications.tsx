import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, TrendingUp, CreditCard, Bell,
  ChevronRight, X, CheckCheck, ShieldAlert,
  Target, Repeat2, Wallet, Filter, BellOff,
  ArrowUpRight, RefreshCw,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AlertType = "overspend" | "investment" | "subscription" | "bill" | "savings";
type Priority  = "high" | "medium" | "low";

interface Alert {
  id: string;
  type: AlertType;
  priority: Priority;
  title: string;
  body: string;
  action: string;
  time: string;
  read: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: Alert[] = [
  {
    id: "1",
    type: "overspend",
    priority: "high",
    title: "Food & Dining Budget Exceeded",
    body: "You've spent ₹40,400 this month on dining — 62% over your ₹25,000 budget. Your monthly goal is at risk.",
    action: "Review Spending",
    time: "Just now",
    read: false,
  },
  {
    id: "2",
    type: "bill",
    priority: "high",
    title: "Credit Card Payment Due in 3 Days",
    body: "Your credit card balance of ₹1,03,000 is due on April 4. Missing it could hurt your credit score.",
    action: "Pay Now",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "overspend",
    priority: "high",
    title: "Entertainment Overspend Alert",
    body: "Entertainment spend is ₹26,500 this month — 2.1× your usual average of ₹12,500. Consider pausing discretionary purchases.",
    action: "See Breakdown",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "investment",
    priority: "medium",
    title: "Monthly SIP Reminder",
    body: "Your ₹25,000 SIP in HDFC Balanced Fund is due tomorrow. Ensure your linked account has sufficient balance.",
    action: "Review SIP",
    time: "Yesterday",
    read: false,
  },
  {
    id: "5",
    type: "subscription",
    priority: "medium",
    title: "Netflix Subscription Renewing",
    body: "Your Netflix plan (₹1,299/month) renews in 2 days. You haven't streamed in 18 days — consider pausing.",
    action: "Manage Plan",
    time: "Yesterday",
    read: true,
  },
  {
    id: "6",
    type: "investment",
    priority: "medium",
    title: "Portfolio Rebalancing Suggested",
    body: "Your equity allocation has grown to 68% — above your target of 50%. Consider rebalancing to reduce risk.",
    action: "View Portfolio",
    time: "2 days ago",
    read: true,
  },
  {
    id: "7",
    type: "subscription",
    priority: "low",
    title: "Unused Spotify Subscription Detected",
    body: "Spotify (₹399/month) has had 0 plays in the last 45 days. Cancelling could save you ₹4,999/year.",
    action: "Cancel Now",
    time: "3 days ago",
    read: true,
  },
  {
    id: "8",
    type: "subscription",
    priority: "low",
    title: "Adobe Creative Cloud Annual Renewal",
    body: "Your ₹49,900/year Adobe subscription auto-renews in 14 days. Do you still need all apps?",
    action: "Review Plan",
    time: "3 days ago",
    read: true,
  },
  {
    id: "9",
    type: "savings",
    priority: "low",
    title: "Emergency Fund Milestone Reached",
    body: "You've saved ₹7,80,000 — that's 50% of your 6-month emergency fund goal. Keep it up!",
    action: "View Progress",
    time: "4 days ago",
    read: true,
  },
  {
    id: "10",
    type: "investment",
    priority: "low",
    title: "Dividend Credited to Account",
    body: "A dividend of ₹3,500 from your Mutual Fund holdings was credited. Consider reinvesting for compounding.",
    action: "Reinvest",
    time: "5 days ago",
    read: true,
  },
];

// ─── Config per type ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AlertType, {
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBar: string;
}> = {
  overspend: {
    icon: AlertTriangle,
    label: "Overspending",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400",
    borderColor: "border-rose-500/20",
    accentBar: "bg-rose-500",
  },
  investment: {
    icon: TrendingUp,
    label: "Investment",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    borderColor: "border-blue-500/20",
    accentBar: "bg-blue-500",
  },
  subscription: {
    icon: Repeat2,
    label: "Subscription",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/20",
    accentBar: "bg-amber-500",
  },
  bill: {
    icon: CreditCard,
    label: "Bill Due",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400",
    borderColor: "border-rose-500/20",
    accentBar: "bg-rose-500",
  },
  savings: {
    icon: Target,
    label: "Savings",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    accentBar: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; ring: string }> = {
  high:   { label: "High",   dot: "bg-rose-500",   ring: "ring-rose-500/20" },
  medium: { label: "Medium", dot: "bg-amber-400",   ring: "ring-amber-400/20" },
  low:    { label: "Low",    dot: "bg-slate-500",   ring: "ring-slate-500/20" },
};

type FilterTab = "all" | AlertType;

const FILTER_TABS: { id: FilterTab; label: string; icon: React.ElementType }[] = [
  { id: "all",          label: "All",          icon: Bell      },
  { id: "overspend",    label: "Overspending", icon: AlertTriangle },
  { id: "investment",   label: "Investment",   icon: TrendingUp },
  { id: "subscription", label: "Subscription", icon: Repeat2   },
  { id: "bill",         label: "Bills",        icon: CreditCard },
  { id: "savings",      label: "Savings",      icon: Target    },
];

// ─── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onDismiss,
  onRead,
  onAction,
}: {
  alert: Alert;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
  onAction: (id: string) => void;
}) {
  const cfg  = TYPE_CONFIG[alert.type];
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
        ${alert.priority === "high" ? "border-slate-700/70 shadow-lg" : "border-slate-800/60"}
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
                <span className="text-slate-400">{pri.label} Priority</span>
              </span>
            )}
          </div>

          {/* Timestamp + dismiss */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-slate-600 font-medium">{alert.time}</span>
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
        <p className="text-xs text-slate-500 leading-relaxed mb-3">{alert.body}</p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(alert.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95
              ${alert.type === "overspend" || alert.type === "bill"
                ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/25"
                : alert.type === "investment"
                ? "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/25"
                : alert.type === "subscription"
                ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/25"
                : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/25"
              }`}
          >
            {alert.action}
            <ArrowUpRight className="h-3 w-3" />
          </button>

          {!alert.read && (
            <button
              onClick={() => onRead(alert.id)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all border border-transparent hover:border-slate-700/60"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function Notifications() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const unread = alerts.filter((a) => !a.read);
  const countByType = (type: AlertType) => alerts.filter((a) => a.type === type).length;

  const filtered = alerts
    .filter((a) => activeFilter === "all" || a.type === activeFilter)
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      return pOrder[a.priority] - pOrder[b.priority];
    });

  function dismiss(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function markRead(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  }

  function handleAction(id: string) {
    markRead(id);
  }

  function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }

  function dismissAll() {
    setAlerts([]);
  }

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
            {unread.length > 0 && (
              <span className="flex items-center justify-center h-7 min-w-7 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 text-sm font-bold text-rose-400">
                {unread.length}
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1.5 font-medium">
            {unread.length > 0
              ? `${unread.length} unread alert${unread.length !== 1 ? "s" : ""} need your attention`
              : "You're all caught up — no unread alerts"}
          </p>
        </div>

        {alerts.length > 0 && (
          <div className="flex items-center gap-2">
            {unread.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={dismissAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
            >
              <X className="h-3.5 w-3.5" />
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
        {[
          {
            label: "Overspending",
            count: alerts.filter(a => a.type === "overspend" || a.type === "bill").length,
            unreadCount: alerts.filter(a => (a.type === "overspend" || a.type === "bill") && !a.read).length,
            icon: ShieldAlert,
            color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20",
          },
          {
            label: "Investments",
            count: countByType("investment"),
            unreadCount: alerts.filter(a => a.type === "investment" && !a.read).length,
            icon: TrendingUp,
            color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
          },
          {
            label: "Subscriptions",
            count: countByType("subscription"),
            unreadCount: alerts.filter(a => a.type === "subscription" && !a.read).length,
            icon: Repeat2,
            color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
          },
        ].map((s) => (
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
            ? alerts.length
            : alerts.filter(a => a.type === tab.id).length;

          if (tab.id !== "all" && count === 0) return null;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
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
          {filtered.length === 0 ? (
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
                  ? "You've cleared all notifications — great job!"
                  : `No ${activeFilter} alerts at the moment`}
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
              {filtered.some(a => !a.read) && (
                <motion.div key="unread-header" layout>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unread</p>
                  </div>
                  <div className="space-y-3">
                    {filtered.filter(a => !a.read).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={dismiss}
                        onRead={markRead}
                        onAction={handleAction}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Read section */}
              {filtered.some(a => a.read) && (
                <motion.div key="read-header" layout>
                  {filtered.some(a => !a.read) && (
                    <div className="flex items-center gap-2 mt-6 mb-2 px-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Earlier</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {filtered.filter(a => a.read).map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={dismiss}
                        onRead={markRead}
                        onAction={handleAction}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

    </main>
  );
}
