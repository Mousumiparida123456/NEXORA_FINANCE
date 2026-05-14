// ─── Notification Engine ─────────────────────────────────────────────────────
// Auto-generates smart notifications from financial activity across the app.

export type NotificationType =
  | "success"
  | "warning"
  | "alert"
  | "info"
  | "investment"
  | "bill"
  | "recurring"
  | "goal"
  | "ai_insight"
  | "credit"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type NotificationCategory =
  | "transaction"
  | "goal"
  | "bill"
  | "recurring"
  | "investment"
  | "credit"
  | "ai_insight"
  | "system";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string; // ISO string
  actionLink?: string;
  relatedId?: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "nexora.notifications";
const MAX_NOTIFICATIONS = 100;

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// ─── ID generator ────────────────────────────────────────────────────────────

let _counter = 0;
export function genId(): string {
  return `notif-${Date.now()}-${++_counter}`;
}

// ─── Browser Push ────────────────────────────────────────────────────────────

let _browserPermission: NotificationPermission = "default";

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  _browserPermission = await Notification.requestPermission();
  return _browserPermission === "granted";
}

export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: `nexora-${Date.now()}`,
    });
  } catch {
    // SW-required environment, silently fail
  }
}

// ─── Transaction Notifications ───────────────────────────────────────────────

export interface TransactionEvent {
  action: "add" | "edit" | "delete";
  description?: string;
  category?: string;
  amount?: number;
  type?: "income" | "expense";
}

export function generateTransactionNotification(
  event: TransactionEvent,
  formatCurrency: (v: number) => string,
): AppNotification | null {
  const { action, description, category, amount, type } = event;
  const amountStr = amount ? formatCurrency(amount) : "";
  const desc = description || category || "Transaction";

  if (action === "add" && type === "expense") {
    const isLarge = (amount ?? 0) >= 15000;
    return {
      id: genId(),
      title: isLarge ? `Large expense detected: ${amountStr}` : `${amountStr} expense added`,
      message: isLarge
        ? `A large expense of ${amountStr} was recorded under ${category || "uncategorized"}. Review your spending.`
        : `${desc} — ${amountStr} added to ${category || "expenses"}.`,
      type: isLarge ? "warning" : "info",
      category: "transaction",
      priority: isLarge ? "high" : "low",
      read: false,
      createdAt: new Date().toISOString(),
      actionLink: "/transactions",
    };
  }

  if (action === "add" && type === "income") {
    return {
      id: genId(),
      title: `Income received: ${amountStr}`,
      message: `${desc} — ${amountStr} credited to your account.`,
      type: "success",
      category: "transaction",
      priority: "medium",
      read: false,
      createdAt: new Date().toISOString(),
      actionLink: "/transactions",
    };
  }

  if (action === "edit") {
    return {
      id: genId(),
      title: "Transaction updated",
      message: `"${desc}" was modified${amountStr ? ` (${amountStr})` : ""}.`,
      type: "info",
      category: "transaction",
      priority: "low",
      read: false,
      createdAt: new Date().toISOString(),
      actionLink: "/transactions",
    };
  }

  if (action === "delete") {
    return {
      id: genId(),
      title: "Transaction deleted",
      message: `"${desc}"${amountStr ? ` (${amountStr})` : ""} was removed.`,
      type: "info",
      category: "transaction",
      priority: "low",
      read: false,
      createdAt: new Date().toISOString(),
      actionLink: "/transactions",
    };
  }

  return null;
}

// ─── Goal Notifications ──────────────────────────────────────────────────────

export function generateGoalNotifications(
  goals: { name: string; saved: number; target: number }[],
  formatCurrency: (v: number) => string,
): AppNotification[] {
  const results: AppNotification[] = [];
  const seenKey = "nexora.goal-milestones-seen";
  let seen: Record<string, number[]> = {};
  try {
    seen = JSON.parse(localStorage.getItem(seenKey) || "{}");
  } catch { /* ignore */ }

  const milestones = [25, 50, 75, 100];

  for (const goal of goals) {
    const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
    const goalSeen = seen[goal.name] || [];

    for (const m of milestones) {
      if (pct >= m && !goalSeen.includes(m)) {
        goalSeen.push(m);
        const isComplete = m === 100;
        results.push({
          id: genId(),
          title: isComplete ? `🎉 Goal completed: ${goal.name}` : `${goal.name} reached ${m}%`,
          message: isComplete
            ? `Congratulations! You've reached your ${formatCurrency(goal.target)} target for "${goal.name}".`
            : `You've saved ${formatCurrency(goal.saved)} of ${formatCurrency(goal.target)} for "${goal.name}".`,
          type: isComplete ? "success" : "info",
          category: "goal",
          priority: isComplete ? "high" : "medium",
          read: false,
          createdAt: new Date().toISOString(),
          actionLink: "/goals",
        });
      }
    }
    seen[goal.name] = goalSeen;
  }

  localStorage.setItem(seenKey, JSON.stringify(seen));
  return results;
}

// ─── Bill Notifications ──────────────────────────────────────────────────────

export function generateBillNotifications(
  bills: { title: string; amount: number; dueDate: string; status: string }[],
  formatCurrency: (v: number) => string,
): AppNotification[] {
  const results: AppNotification[] = [];
  const now = new Date();
  const seenKey = "nexora.bill-notifs-seen";
  let seen: string[] = [];
  try {
    seen = JSON.parse(localStorage.getItem(seenKey) || "[]");
  } catch { /* ignore */ }

  for (const bill of bills) {
    const due = new Date(bill.dueDate);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const key = `${bill.title}-${bill.dueDate}`;

    if (seen.includes(key)) continue;

    if (bill.status === "overdue" || daysLeft < 0) {
      seen.push(key);
      results.push({
        id: genId(),
        title: `⚠️ ${bill.title} payment overdue`,
        message: `Your ${bill.title} bill of ${formatCurrency(bill.amount)} was due on ${bill.dueDate}. Pay immediately to avoid penalties.`,
        type: "alert",
        category: "bill",
        priority: "critical",
        read: false,
        createdAt: new Date().toISOString(),
        actionLink: "/bills",
      });
    } else if (daysLeft <= 3 && daysLeft >= 0) {
      seen.push(key);
      results.push({
        id: genId(),
        title: `${bill.title} due ${daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`}`,
        message: `Your ${bill.title} bill of ${formatCurrency(bill.amount)} is due on ${bill.dueDate}.`,
        type: "warning",
        category: "bill",
        priority: "high",
        read: false,
        createdAt: new Date().toISOString(),
        actionLink: "/bills",
      });
    }
  }

  localStorage.setItem(seenKey, JSON.stringify(seen.slice(-200)));
  return results;
}

// ─── Recurring Notifications ─────────────────────────────────────────────────

export function generateRecurringNotification(
  title: string,
  amount: number,
  frequency: string,
  formatCurrency: (v: number) => string,
): AppNotification {
  return {
    id: genId(),
    title: `Recurring pattern detected: ${title}`,
    message: `${title} (${formatCurrency(amount)}/${frequency}) has been identified as a recurring expense.`,
    type: "info",
    category: "recurring",
    priority: "low",
    read: false,
    createdAt: new Date().toISOString(),
    actionLink: "/recurring",
  };
}

// ─── Investment Notifications ────────────────────────────────────────────────

export function generateInvestmentNotification(
  event: "gain" | "loss" | "milestone" | "sip",
  details: string,
): AppNotification {
  const config = {
    gain: { title: "Portfolio gain", type: "success" as NotificationType, priority: "medium" as NotificationPriority },
    loss: { title: "Portfolio alert", type: "warning" as NotificationType, priority: "high" as NotificationPriority },
    milestone: { title: "Investment milestone", type: "success" as NotificationType, priority: "medium" as NotificationPriority },
    sip: { title: "SIP reminder", type: "info" as NotificationType, priority: "medium" as NotificationPriority },
  };
  const c = config[event];
  return {
    id: genId(),
    title: c.title,
    message: details,
    type: c.type,
    category: "investment",
    priority: c.priority,
    read: false,
    createdAt: new Date().toISOString(),
    actionLink: "/invest",
  };
}

// ─── Credit Notifications ────────────────────────────────────────────────────

export function generateCreditNotification(
  event: "improved" | "declined" | "high_spending",
  details: string,
): AppNotification {
  const config = {
    improved: { title: "Credit health improved", type: "success" as NotificationType, priority: "medium" as NotificationPriority },
    declined: { title: "Credit health warning", type: "alert" as NotificationType, priority: "high" as NotificationPriority },
    high_spending: { title: "High spending affecting credit", type: "warning" as NotificationType, priority: "high" as NotificationPriority },
  };
  const c = config[event];
  return {
    id: genId(),
    title: c.title,
    message: details,
    type: c.type,
    category: "credit",
    priority: c.priority,
    read: false,
    createdAt: new Date().toISOString(),
    actionLink: "/credit-score",
  };
}

// ─── AI Insight Notifications ────────────────────────────────────────────────

export function generateAIInsightNotification(insight: string): AppNotification {
  return {
    id: genId(),
    title: "AI Financial Insight",
    message: insight,
    type: "info",
    category: "ai_insight",
    priority: "medium",
    read: false,
    createdAt: new Date().toISOString(),
    actionLink: "/ai-assistant",
  };
}

// ─── Spending Analysis ───────────────────────────────────────────────────────

export interface SpendingAnalysis {
  categoryOverspends: { category: string; current: number; average: number; pctIncrease: number }[];
  totalExpenses: number;
  totalIncome: number;
}

export function generateSpendingAlerts(
  analysis: SpendingAnalysis,
  formatCurrency: (v: number) => string,
): AppNotification[] {
  const results: AppNotification[] = [];

  // Category overspend alerts
  for (const item of analysis.categoryOverspends) {
    if (item.pctIncrease >= 20) {
      results.push({
        id: genId(),
        title: `${item.category} spending increased ${item.pctIncrease.toFixed(0)}%`,
        message: `You've spent ${formatCurrency(item.current)} on ${item.category} — that's ${item.pctIncrease.toFixed(0)}% above your ${formatCurrency(item.average)} average.`,
        type: "warning",
        category: "ai_insight",
        priority: item.pctIncrease >= 50 ? "high" : "medium",
        read: false,
        createdAt: new Date().toISOString(),
        actionLink: "/insights",
      });
    }
  }

  // Low savings warning
  if (analysis.totalIncome > 0) {
    const savingsRate = ((analysis.totalIncome - analysis.totalExpenses) / analysis.totalIncome) * 100;
    if (savingsRate < 10 && savingsRate >= 0) {
      results.push({
        id: genId(),
        title: "⚠️ Low savings rate warning",
        message: `Your savings rate is only ${savingsRate.toFixed(1)}%. Consider reducing discretionary spending.`,
        type: "alert",
        category: "ai_insight",
        priority: "critical",
        read: false,
        createdAt: new Date().toISOString(),
        actionLink: "/insights",
      });
    }
  }

  return results;
}

// ─── Time formatting ─────────────────────────────────────────────────────────

export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
