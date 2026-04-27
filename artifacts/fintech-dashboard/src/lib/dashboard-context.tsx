import * as React from "react"
import { api, type AuthUser } from "./api"

export type DashboardRole = "viewer" | "admin"
export type ThemeMode = "light" | "dark"

export type CurrencyDefinition = {
  code: string
  locale: string
  name: string
  flag: string
  rateToINR: number
}

const STORAGE_KEYS = {
  theme: "nexora.theme",
  currency: "nexora.currency",
  role: "nexora.role",
}

export const CURRENCIES: CurrencyDefinition[] = [
  { code: "INR", locale: "en-IN", name: "India", flag: "🇮🇳", rateToINR: 1 },
  { code: "USD", locale: "en-US", name: "United States", flag: "🇺🇸", rateToINR: 83.45 },
  { code: "EUR", locale: "de-DE", name: "Eurozone", flag: "🇪🇺", rateToINR: 90.12 },
  { code: "GBP", locale: "en-GB", name: "United Kingdom", flag: "🇬🇧", rateToINR: 103.17 },
  { code: "JPY", locale: "ja-JP", name: "Japan", flag: "🇯🇵", rateToINR: 0.62 },
  { code: "AED", locale: "en-AE", name: "UAE", flag: "🇦🇪", rateToINR: 22.72 },
  { code: "SGD", locale: "en-SG", name: "Singapore", flag: "🇸🇬", rateToINR: 61.88 },
  { code: "CAD", locale: "en-CA", name: "Canada", flag: "🇨🇦", rateToINR: 61.12 },
  { code: "AUD", locale: "en-AU", name: "Australia", flag: "🇦🇺", rateToINR: 53.90 },
  { code: "CNY", locale: "zh-CN", name: "China", flag: "🇨🇳", rateToINR: 11.47 },
]

const INITIAL_RATES = CURRENCIES.reduce<Record<string, number>>((acc, currency) => {
  acc[currency.code] = currency.rateToINR
  return acc
}, {})

type NotificationItem = {
  id: string
  title: string
  description: string
  timestamp: string
  unread: boolean
}

interface DashboardContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  role: DashboardRole
  setRole: (role: DashboardRole) => void
  selectedCurrency: CurrencyDefinition
  currencyList: CurrencyDefinition[]
  setSelectedCurrency: (code: string) => void
  rates: Record<string, number>
  isRatesOffline: boolean
  isRefreshingRates: boolean
  refreshRates: () => Promise<void>
  canExport: boolean
  notifications: NotificationItem[]
  unreadNotifications: number
  markAllNotificationsRead: () => void
  formatCurrency: (valueInINR: number) => string
  formatCompactCurrency: (valueInINR: number) => string
  convertFromINR: (valueInINR: number) => number
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

const DashboardContext = React.createContext<DashboardContextValue | undefined>(undefined)

const initialNotifications: NotificationItem[] = [
  {
    id: "reminder",
    title: "Investment reminder",
    description: "Your monthly SIP review is ready.",
    timestamp: "2m ago",
    unread: true,
  },
  {
    id: "report",
    title: "Monthly report ready",
    description: "October performance is available.",
    timestamp: "1h ago",
    unread: true,
  },
  {
    id: "goal",
    title: "Goal progress update",
    description: "You are 7% closer to your emergency fund goal.",
    timestamp: "3h ago",
    unread: true,
  },
]

function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark"
  return (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode) || "dark"
}

function getSavedCurrency(): string {
  if (typeof window === "undefined") return "INR"
  return localStorage.getItem(STORAGE_KEYS.currency) || "INR"
}

function getSavedRole(): DashboardRole {
  if (typeof window === "undefined") return "admin"
  return (localStorage.getItem(STORAGE_KEYS.role) as DashboardRole) || "admin"
}

function buildFormatter(code: string, locale: string, compact = false) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    notation: compact ? "compact" : "standard",
    compactDisplay: compact ? "short" : undefined,
    maximumFractionDigits: 0,
  })
}

function findCurrency(code: string) {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0]
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeMode>(getSavedTheme)
  const [role, setRole] = React.useState<DashboardRole>(getSavedRole)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = React.useState<string>(getSavedCurrency)
  const [rates, setRates] = React.useState<Record<string, number>>(INITIAL_RATES)
  const [isRatesOffline, setIsRatesOffline] = React.useState(false)
  const [isRefreshingRates, setIsRefreshingRates] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications)
  const [user, setUser] = React.useState<AuthUser | null>(null)

  React.useEffect(() => {
    api.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme)
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currency, selectedCurrencyCode)
  }, [selectedCurrencyCode])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.role, role)
  }, [role])

  const selectedCurrency = React.useMemo(
    () => findCurrency(selectedCurrencyCode),
    [selectedCurrencyCode],
  )

  const currencyList = React.useMemo(() => CURRENCIES, [])

  const toggleTheme = React.useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }, [])

  const setSelectedCurrency = React.useCallback((code: string) => {
    setSelectedCurrencyCode(code)
    setIsRatesOffline(false)
  }, [])

  const refreshRates = React.useCallback(async () => {
    if (isRefreshingRates) return
    setIsRefreshingRates(true)

    await new Promise((resolve) => window.setTimeout(resolve, 650))

    const offline = Math.random() < 0.18
    if (offline) {
      setIsRatesOffline(true)
      setIsRefreshingRates(false)
      return
    }

    setRates((currentRates) => {
      const nextRates = { ...currentRates }
      CURRENCIES.forEach((currency) => {
        if (currency.code === "INR") return
        const variation = 1 + (Math.random() * 0.04 - 0.02)
        nextRates[currency.code] = Math.max(0.3, Number((currentRates[currency.code] * variation).toFixed(2)))
      })
      return nextRates
    })
    setIsRatesOffline(false)
    setIsRefreshingRates(false)
  }, [isRefreshingRates])

  const formatCurrency = React.useCallback(
    (valueInINR: number) => {
      const rate = rates[selectedCurrency.code] || selectedCurrency.rateToINR
      const converted = valueInINR / rate
      return buildFormatter(selectedCurrency.code, selectedCurrency.locale).format(converted)
    },
    [rates, selectedCurrency],
  )

  const formatCompactCurrency = React.useCallback(
    (valueInINR: number) => {
      const rate = rates[selectedCurrency.code] || selectedCurrency.rateToINR
      const converted = valueInINR / rate
      return buildFormatter(selectedCurrency.code, selectedCurrency.locale, true).format(converted)
    },
    [rates, selectedCurrency],
  )

  const convertFromINR = React.useCallback(
    (valueInINR: number) => {
      const rate = rates[selectedCurrency.code] || selectedCurrency.rateToINR
      return Math.round(valueInINR / rate)
    },
    [rates, selectedCurrency],
  )

  const unreadNotifications = React.useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications],
  )

  const markAllNotificationsRead = React.useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })))
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        theme,
        toggleTheme,
        role,
        setRole,
        selectedCurrency,
        currencyList,
        setSelectedCurrency,
        rates,
        isRatesOffline,
        isRefreshingRates,
        refreshRates,
        canExport: role === "admin",
        notifications,
        unreadNotifications,
        markAllNotificationsRead,
        formatCurrency,
        formatCompactCurrency,
        convertFromINR,
        user,
        setUser,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = React.useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
