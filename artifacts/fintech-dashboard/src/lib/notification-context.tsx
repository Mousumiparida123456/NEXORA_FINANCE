import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  AppNotification,
  NotificationCategory,
  TransactionEvent,
  loadNotifications,
  saveNotifications,
  generateTransactionNotification,
  generateGoalNotifications,
  generateBillNotifications,
  generateSpendingAlerts,
  generateAIInsightNotification,
  sendBrowserNotification,
  requestBrowserNotificationPermission,
  formatRelativeTime,
  genId,
} from "./notification-engine";
import { useToast } from "@/hooks/use-toast";

// ─── Settings types ──────────────────────────────────────────────────────────

export interface NotificationSettings {
  enableTransactions: boolean;
  enableGoals: boolean;
  enableBills: boolean;
  enableRecurring: boolean;
  enableInvestments: boolean;
  enableCredit: boolean;
  enableAIInsights: boolean;
  enableSystem: boolean;
  enableSound: boolean;
  enableBrowserPush: boolean;
  enableEmailAlerts: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enableTransactions: true,
  enableGoals: true,
  enableBills: true,
  enableRecurring: true,
  enableInvestments: true,
  enableCredit: true,
  enableAIInsights: true,
  enableSystem: true,
  enableSound: false,
  enableBrowserPush: false,
  enableEmailAlerts: false,
};

const SETTINGS_KEY = "nexora.notification-settings";

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(s: NotificationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (n: AppNotification) => void;
  addNotifications: (ns: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
  formatTime: (iso: string) => string;
  handleTransactionEvent: (event: TransactionEvent, formatCurrency: (v: number) => string) => void;
  checkGoals: (goals: { name: string; saved: number; target: number }[], formatCurrency: (v: number) => string) => void;
  checkBills: (bills: { title: string; amount: number; dueDate: string; status: string }[], formatCurrency: (v: number) => string) => void;
  checkSpending: (analysis: any, formatCurrency: (v: number) => string) => void;
  handleEvent: (category: NotificationCategory, type: string, details: string) => void;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);
  const { toast } = useToast();

  // Persist on change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const isCategoryEnabled = useCallback((category: NotificationCategory): boolean => {
    const map: Record<NotificationCategory, keyof NotificationSettings> = {
      transaction: "enableTransactions",
      goal: "enableGoals",
      bill: "enableBills",
      recurring: "enableRecurring",
      investment: "enableInvestments",
      credit: "enableCredit",
      ai_insight: "enableAIInsights",
      system: "enableSystem",
    };
    return settings[map[category]] as boolean;
  }, [settings]);

  const pushAndToast = useCallback((n: AppNotification) => {
    // Toast for high/critical
    if (n.priority === "high" || n.priority === "critical") {
      toast({
        title: n.title,
        description: n.message,
        variant: n.priority === "critical" ? "destructive" : "default",
      });
    }
    // Browser push
    if (settings.enableBrowserPush && (n.priority === "high" || n.priority === "critical")) {
      sendBrowserNotification(n.title, n.message);
    }
    // Sound
    if (settings.enableSound && (n.priority === "high" || n.priority === "critical")) {
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19telefoXNlIGRhdGE=");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch { /* ignore */ }
    }
  }, [settings, toast]);

  const addNotification = useCallback((n: AppNotification) => {
    if (!isCategoryEnabled(n.category)) return;
    setNotifications((prev) => [n, ...prev]);
    pushAndToast(n);
  }, [isCategoryEnabled, pushAndToast]);

  const addNotifications = useCallback((ns: AppNotification[]) => {
    const filtered = ns.filter((n) => isCategoryEnabled(n.category));
    if (filtered.length === 0) return;
    setNotifications((prev) => [...filtered, ...prev]);
    filtered.forEach(pushAndToast);
  }, [isCategoryEnabled, pushAndToast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAsUnread = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: false } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleTransactionEvent = useCallback((event: TransactionEvent, formatCurrency: (v: number) => string) => {
    const notif = generateTransactionNotification(event, formatCurrency);
    if (notif) addNotification(notif);
  }, [addNotification]);

  const checkGoals = useCallback((goals: { name: string; saved: number; target: number }[], formatCurrency: (v: number) => string) => {
    const notifs = generateGoalNotifications(goals, formatCurrency);
    if (notifs.length > 0) addNotifications(notifs);
  }, [addNotifications]);

  const checkBills = useCallback((bills: { title: string; amount: number; dueDate: string; status: string }[], formatCurrency: (v: number) => string) => {
    const notifs = generateBillNotifications(bills, formatCurrency);
    if (notifs.length > 0) addNotifications(notifs);
  }, [addNotifications]);

  const checkSpending = useCallback((analysis: any, formatCurrency: (v: number) => string) => {
    const notifs = generateSpendingAlerts(analysis, formatCurrency);
    if (notifs.length > 0) addNotifications(notifs);
  }, [addNotifications]);

  const handleEvent = useCallback((category: NotificationCategory, type: string, details: string) => {
    // This can be used for general events like Investment SIPs, Credit Score changes, etc.
    // For now we use the ID generator and basic mapping.
    const n: AppNotification = {
      id: genId(),
      title: type,
      message: details,
      type: "info",
      category,
      priority: "medium",
      read: false,
      createdAt: new Date().toISOString(),
    };
    addNotification(n);
  }, [addNotification]);

  const requestPushPermission = useCallback(async () => {
    const granted = await requestBrowserNotificationPermission();
    if (granted) {
      updateSettings({ enableBrowserPush: true });
      toast({ title: "Browser notifications enabled", description: "You'll receive push alerts for important financial events." });
    }
    return granted;
  }, [updateSettings, toast]);

  const formatTime = useCallback((iso: string) => formatRelativeTime(iso), []);

  // Seed a welcome notification if first time
  useEffect(() => {
    const seeded = localStorage.getItem("nexora.notif-seeded");
    if (!seeded) {
      const welcome: AppNotification = {
        id: genId(),
        title: "Welcome to Nexora Notifications",
        message: "You'll receive smart alerts for transactions, bills, goals, investments, and AI insights — all in real time.",
        type: "info",
        category: "system",
        priority: "low",
        read: false,
        createdAt: new Date().toISOString(),
        actionLink: "/notifications",
      };
      setNotifications((prev) => [welcome, ...prev]);
      localStorage.setItem("nexora.notif-seeded", "true");
    }
  }, []);

  // Auto-listen for transaction events from TransactionsContext
  useEffect(() => {
    const basicFormat = (v: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        handleTransactionEvent(detail as TransactionEvent, basicFormat);
      }
    };
    window.addEventListener("nexora:transaction:notify", handler);
    return () => window.removeEventListener("nexora:transaction:notify", handler);
  }, [handleTransactionEvent]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        addNotification,
        addNotifications,
        markAsRead,
        markAsUnread,
        markAllRead,
        deleteNotification,
        clearAll,
        updateSettings,
        formatTime,
        handleTransactionEvent,
        checkGoals,
        checkBills,
        checkSpending,
        handleEvent,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

// Re-export types
export type { AppNotification, NotificationCategory, NotificationPriority, NotificationType } from "./notification-engine";
