import { useMemo } from "react"
import {
  Bell,
  ChevronDown,
  Download,
  FileText,
  Globe2,
  Menu,
  Moon,
  RefreshCcw,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useDashboard } from "@/lib/dashboard-context"
import { cn } from "@/lib/utils"

const exportRows = [
  ["Metric", "Value"],
  ["Total Income", "totalIncome"],
  ["Total Expenses", "totalExpenses"],
  ["Savings", "savings"],
]

function buildCSV(rows: string[][]) {
  return rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n")
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

export function Topbar() {
  const {
    selectedCurrency,
    currencyList,
    setSelectedCurrency,
    isRatesOffline,
    isRefreshingRates,
    refreshRates,
    role,
    setRole,
    canExport,
    notifications,
    unreadNotifications,
    markAllNotificationsRead,
    theme,
    toggleTheme,
    formatCurrency,
  } = useDashboard()
  const { toast } = useToast()

  const exportDisabled = !canExport
  const roleLabel = role === "admin" ? "Admin" : "Viewer"
  const isDark = theme === "dark"
  const shellBorder = isDark ? "border-slate-800/70" : "border-slate-200"
  const shellPanel = isDark ? "bg-slate-900/80 text-slate-100 hover:border-slate-700 hover:bg-slate-800/90" : "bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
  const iconMuted = isDark ? "text-slate-400" : "text-slate-500"
  const roleBadgeClass = role === "admin"
    ? isDark
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20"
      : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15"
    : isDark
      ? "bg-slate-600/15 text-slate-300 ring-slate-700/30"
      : "bg-slate-100 text-slate-600 ring-slate-200"
  const activeNotifications = useMemo(() => notifications, [notifications])

  const handleExport = (format: "csv" | "json") => {
    const rows = [
      ["Metric", "Value"],
      ["Total Income", formatCurrency(1033350)],
      ["Total Expenses", formatCurrency(789000)],
      ["Savings", formatCurrency(456000)],
    ]

    if (format === "csv") {
      downloadFile("nexora-dashboard.csv", buildCSV(rows), "text/csv;charset=utf-8")
    } else {
      const payload = rows.slice(1).map(([metric, value]) => ({ metric, value }))
      downloadFile("nexora-dashboard.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8")
    }
  }

  const handleCurrencySelect = (currencyCode: string) => {
    setSelectedCurrency(currencyCode)
    toast({
      title: "Currency updated",
      description: `Dashboard values are now shown in ${currencyCode}.`,
    })
  }

  const handleRoleSelect = (newRole: "viewer" | "admin") => {
    setRole(newRole)
    toast({
      title: `Role switched to ${newRole === "admin" ? "Admin" : "Viewer"}`,
      description:
        newRole === "admin"
          ? "Full access mode is enabled."
          : "Read-only viewer mode is active.",
    })
  }

  return (
    <header className={cn("sticky top-0 z-50 border-b backdrop-blur", isDark ? "border-slate-800/60 bg-[#081126]/90 supports-[backdrop-filter]:bg-[#081126]/90" : "border-slate-200 bg-white/90 supports-[backdrop-filter]:bg-white/85")}>
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("rounded-3xl p-2 ring-1", isDark ? "bg-gradient-to-br from-blue-500/20 via-slate-900/80 to-slate-950/90 shadow-[0_20px_50px_rgba(59,130,246,0.12)] ring-slate-800/60" : "bg-gradient-to-br from-blue-100 via-white to-slate-100 shadow-[0_18px_34px_rgba(148,163,184,0.18)] ring-slate-200")}>
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-3xl shadow-inner", isDark ? "bg-slate-950/90 text-blue-300 shadow-blue-500/10" : "bg-blue-600 text-white shadow-blue-600/20")}>
              <Globe2 className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.3em]", isDark ? "text-blue-300/80" : "text-blue-600")}>NEXORA</p>
            <h1 className={cn("truncate text-base font-semibold", isDark ? "text-slate-50" : "text-slate-950")}>Finance command center</h1>
          </div>
        </div>

        <div className="hidden sm:flex flex-wrap items-center gap-2 md:gap-3">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn("inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm transition", shellBorder, shellPanel)}
                    aria-label="Switch currency"
                  >
                    <span>{selectedCurrency.flag}</span>
                    <span className="hidden sm:inline-flex">{selectedCurrency.code}</span>
                    <ChevronDown className={cn("h-4 w-4", iconMuted)} />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Switch currency</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-[260px] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Global currency</p>
                  <p className="text-xs text-slate-500">Select your preferred money view.</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                  isRatesOffline ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300",
                )}>
                  {isRatesOffline ? "Offline" : "Live"}
                </span>
              </div>

              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {currencyList.map((currency) => (
                  <DropdownMenuItem
                    key={currency.code}
                    onSelect={() => handleCurrencySelect(currency.code)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80",
                      currency.code === selectedCurrency.code ? "bg-emerald-500/10 text-emerald-100" : "",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{currency.flag}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{currency.name}</p>
                        <p className="truncate text-xs text-slate-500">{currency.code}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{currency.code}</span>
                  </DropdownMenuItem>
                ))}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={refreshRates}
                className="inline-flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80"
              >
                <div className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  <span>Refresh rates</span>
                </div>
                <span className="text-xs text-slate-400">
                  {isRefreshingRates ? "Refreshing..." : "Update"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm transition",
                      exportDisabled
                        ? isDark
                          ? "border-slate-800/50 bg-slate-900/60 text-slate-500 cursor-not-allowed"
                          : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : `${shellBorder} ${shellPanel}`,
                    )}
                    aria-label="Export data"
                    disabled={exportDisabled}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline-flex">Export</span>
                    <ChevronDown className={cn("h-4 w-4", iconMuted)} />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Export data</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-[220px] p-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 text-slate-300">Download format</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => handleExport("csv")}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80"
                >
                  <FileText className="h-4 w-4 text-slate-300" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleExport("json")}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80"
                >
                  <Download className="h-4 w-4 text-slate-300" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn("inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm transition", shellBorder, shellPanel)}
                    aria-label="Change role"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline-flex">{roleLabel}</span>
                    <ChevronDown className={cn("h-4 w-4", iconMuted)} />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Switch role</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-[220px] p-2">
              <DropdownMenuRadioGroup value={role} onValueChange={(value) => handleRoleSelect(value as "viewer" | "admin") }>
                <DropdownMenuLabel className="px-3 text-slate-300">User role</DropdownMenuLabel>
                <DropdownMenuRadioItem value="viewer" className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80">
                  <User className="h-4 w-4" />
                  Viewer
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="admin" className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80">
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn("relative inline-flex items-center justify-center rounded-2xl border p-2 shadow-sm transition", shellBorder, shellPanel)}
                    aria-label="Open notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 ? (
                        <span className={cn("absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white ring-2", isDark ? "ring-slate-950" : "ring-white")}>
                        {unreadNotifications}
                      </span>
                    ) : null}
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>View notifications</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-[300px] p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">Notifications</p>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 transition hover:text-slate-300"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2">
                {activeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-2xl border border-slate-800/70 bg-slate-950/80 p-3",
                      notification.unread ? "ring-1 ring-emerald-500/20" : "opacity-90",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{notification.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{notification.description}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{notification.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleTheme}
                className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition", shellBorder, shellPanel)}
                aria-label="Toggle light or dark mode"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Switch to light" : "Switch to dark"}</TooltipContent>
          </Tooltip>

          <div className={cn("inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm shadow-sm", roleBadgeClass, isDark ? "border-slate-800/70" : "border-slate-200")}>
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            <span className="font-medium">{roleLabel}</span>
          </div>
        </div>

        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition", shellBorder, shellPanel)}
                aria-label="Open quick actions"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl bg-slate-950/95 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Quick controls</p>
                  <p className="text-xs text-slate-500">Currency, export, role, theme and alerts.</p>
                </div>
                <SheetClose asChild>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/80 text-slate-100 transition hover:border-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </SheetClose>
              </div>
              <div className="grid gap-3">
                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Currency</p>
                  <div className="mt-3 space-y-2">
                    {currencyList.map((currency) => (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => handleCurrencySelect(currency.code)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                          currency.code === selectedCurrency.code
                            ? "bg-emerald-500/10 text-emerald-100"
                            : "bg-slate-950 text-slate-200 hover:bg-slate-900/90",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{currency.flag}</span>
                          <span>{currency.name}</span>
                        </span>
                        <span className="text-xs text-slate-400">{currency.code}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={refreshRates}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-700 hover:bg-slate-800/90"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh rates
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Export</p>
                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => handleExport("csv")}
                      disabled={exportDisabled}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition",
                        exportDisabled
                          ? "bg-slate-900/60 text-slate-500 cursor-not-allowed"
                          : "bg-slate-950 text-slate-100 hover:bg-slate-900/90",
                      )}
                    >
                      <span>Export CSV</span>
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport("json")}
                      disabled={exportDisabled}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition",
                        exportDisabled
                          ? "bg-slate-900/60 text-slate-500 cursor-not-allowed"
                          : "bg-slate-950 text-slate-100 hover:bg-slate-900/90",
                      )}
                    >
                      <span>Export JSON</span>
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Role</p>
                  <div className="mt-3 grid gap-2">
                    {(["viewer", "admin"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleRoleSelect(option)}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
                          role === option
                            ? option === "admin"
                              ? "bg-emerald-500/10 text-emerald-100"
                              : "bg-slate-700/70 text-slate-100"
                            : "bg-slate-950 text-slate-200 hover:bg-slate-900/90",
                        )}
                      >
                        <span className="capitalize">{option}</span>
                        {role === option ? <span className="text-xs text-slate-400">Active</span> : null}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Display</p>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/90"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Alerts</p>
                    <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-300">
                      {unreadNotifications}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900/90"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
