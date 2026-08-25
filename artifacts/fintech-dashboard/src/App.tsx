import React, { Suspense, lazy, useEffect, useState, ComponentType } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { DashboardProvider } from "@/lib/dashboard-context";
import { TransactionsProvider } from "@/lib/transactions-context";
import { NotificationProvider } from "@/lib/notification-context";
import { AnalyticsStoreProvider } from "@/lib/analytics-store";
import { CurrencyProvider } from "@/lib/currency-context";
import { MerchantLayout } from "@/features/merchant/components/MerchantLayout";
import {
  MerchantAgentPage,
  MerchantAnalyticsPage,
  MerchantAuditPage,
  MerchantCustomersPage,
  MerchantInvestigationsPage,
  MerchantModelPerformancePage,
  MerchantOverviewPage,
  MerchantReturnsPage,
  MerchantRiskPage,
  MerchantRulesPage,
  MerchantSentinelIntelligencePage,
  MerchantTransactionsPage,
} from "@/features/merchant/pages";
import { SafePayPage } from "@/features/merchant/pages/SafePayPage";

const queryClient = new QueryClient();

const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Insights = lazy(() =>
  import("@/pages/Insights").then((module) => ({ default: module.Insights })),
);
const Transactions = lazy(() =>
  import("@/pages/Transactions").then((module) => ({
    default: module.Transactions,
  })),
);
const CreditScore = lazy(() =>
  import("@/pages/CreditScore").then((module) => ({
    default: module.CreditScore,
  })),
);
const Investment = lazy(() =>
  import("@/pages/Investment").then((module) => ({ default: module.Investment })),
);
const AIAssistant = lazy(() =>
  import("@/pages/AIAssistant").then((module) => ({
    default: module.AIAssistant,
  })),
);
const Goals = lazy(() =>
  import("@/pages/Goals").then((module) => ({
    default: module.Goals,
  })),
);
const Bills = lazy(() =>
  import("@/pages/Bills").then((module) => ({
    default: module.Bills,
  })),
);
const Notifications = lazy(() =>
  import("@/pages/Notifications").then((module) => ({
    default: module.Notifications,
  })),
);
const Recurring = lazy(() =>
  import("@/pages/Recurring").then((module) => ({ default: module.Recurring })),
);
const Settings = lazy(() =>
  import("@/pages/Settings").then((module) => ({ default: module.Settings })),
);
import { Merchant } from "@/pages/Merchant";
import { WorkspacesPage } from "@/pages/WorkspacesPage";
import { Login } from "@/pages/Login";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { Register } from "@/pages/Register";
const NotFound = lazy(() => import("@/pages/not-found"));

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
const LOCAL_PREVIEW_AUTH_KEY = "nexora.local-preview-auth";

const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#060c20]">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      <p className="text-sm font-medium text-slate-400">Verifying secure session...</p>
    </div>
  </div>
);

const Forbidden403 = () => (
  <div className="min-h-screen w-full bg-[#060c20] text-slate-100 flex items-center justify-center p-6">
    <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-red-500/30 text-center backdrop-blur-xl shadow-2xl">
      <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
        <span className="text-lg font-bold">403</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">403 Forbidden Access</h1>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
        Your role does not have authorization to view this protected Nexora Sentinel merchant area. Backend security policy enforced.
      </p>
      <button
        onClick={() => (window.location.href = "/dashboard")}
        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
      >
        Return to Personal Dashboard
      </button>
    </div>
  </div>
);

function ProtectedRoute({
  component: Component,
  authStatus,
  requiredRole,
  userRole,
}: {
  component: ComponentType;
  authStatus: AuthStatus;
  requiredRole?: "PERSONAL_USER" | "MERCHANT_USER" | "ADMIN";
  userRole?: string;
}) {
  if (authStatus === "checking") return <FullPageSpinner />;
  if (authStatus !== "authenticated") return <Redirect to="/login" />;

  // Enforce role-based authorization: reject personal user accessing merchant routes
  if (requiredRole === "MERCHANT_USER" && userRole === "PERSONAL_USER") {
    return <Forbidden403 />;
  }

  return <Component />;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("EXPLICIT ROUTE RENDER ERROR:", error, errorInfo);
    if (
      error?.toString()?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("dynamically imported module")
    ) {
      const refreshed = sessionStorage.getItem("nexora_chunk_refreshed");
      if (!refreshed) {
        sessionStorage.setItem("nexora_chunk_refreshed", "true");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.toString()?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("dynamically imported module");

      return (
        <div className="p-8 bg-[#060c20] text-slate-100 min-h-screen z-[99999] flex flex-col items-center justify-center relative font-sans">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl text-center shadow-2xl">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">⚡</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              {isChunkError ? "New Version Available" : "Application Update"}
            </h1>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isChunkError
                ? "The application was updated with a new version. Reloading to fetch the latest features."
                : "An unexpected runtime error occurred. Please reload to restore your session."}
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem("nexora_chunk_refreshed");
                window.location.reload();
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router({ authStatus, userRole }: { authStatus: AuthStatus; userRole: string }) {
  const [location] = useLocation();

  const isAuthRoute =
    location === "/" ||
    location === "/login" ||
    location === "/register" ||
    location.startsWith("/forgot-password") ||
    location.startsWith("/reset-password");

  const showShell = authStatus === "authenticated" && !isAuthRoute;
  const isMerchantRoute = location === "/merchant" || location.startsWith("/merchant/");

  // Redirect unauthenticated users attempting to access any protected route back to login
  if (authStatus === "unauthenticated" && !isAuthRoute) {
    return <Redirect to="/login" />;
  }

  // Enforce 403 Forbidden check on merchant routes for authenticated personal users (direct URL entry fallback)
  if (isMerchantRoute && userRole === "PERSONAL_USER") {
    return <Forbidden403 />;
  }

  const loginEntry = () =>
    authStatus === "checking" ? (
      <FullPageSpinner />
    ) : authStatus === "authenticated" ? (
      <Redirect to={userRole === "MERCHANT_USER" || userRole === "ADMIN" ? "/merchant" : "/dashboard"} />
    ) : (
      <Login />
    );

  const mainSwitch = (
    <Switch>
      {/* Workspace Priority Routes */}
      <Route path="/merchant" component={Merchant} />
      <Route path="/workspaces" component={WorkspacesPage} />

      {/* Personal Finance Protected Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/insights" component={Insights} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/bills" component={Bills} />
      <Route path="/recurring" component={Recurring} />
      <Route path="/credit-score" component={CreditScore} />
      <Route path="/invest" component={Investment} />
      <Route path="/goals" component={Goals} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />

      {/* Merchant Intelligence Sub-routes */}
      <Route path="/sentinel" component={() => <Redirect to="/merchant" />} />
      <Route path="/sentinel/dashboard" component={() => <Redirect to="/merchant" />} />
      <Route path="/sentinel-dashboard" component={() => <Redirect to="/merchant" />} />
      <Route path="/merchant/safepay" component={SafePayPage} />
      <Route path="/merchant/risk" component={MerchantRiskPage} />
      <Route path="/merchant/transactions" component={MerchantTransactionsPage} />
      <Route path="/merchant/customers" component={MerchantCustomersPage} />
      <Route path="/merchant/investigations" component={MerchantInvestigationsPage} />
      <Route path="/merchant/returns" component={MerchantReturnsPage} />
      <Route path="/merchant/analytics" component={MerchantAnalyticsPage} />
      <Route path="/merchant/agent" component={MerchantAgentPage} />
      <Route path="/merchant/rules" component={MerchantRulesPage} />
      <Route path="/merchant/sentinel-intelligence" component={MerchantSentinelIntelligencePage} />
      <Route path="/merchant/model-performance" component={MerchantModelPerformancePage} />
      <Route path="/merchant/audit" component={MerchantAuditPage} />

      {/* Auth & Root */}
      <Route path="/login" component={loginEntry} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/" component={loginEntry} />
      <Route component={NotFound} />
    </Switch>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageSpinner />}>
        {isMerchantRoute ? (
          <MerchantLayout>{mainSwitch}</MerchantLayout>
        ) : (
          <Layout showShell={showShell}>{mainSwitch}</Layout>
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [userRole, setUserRole] = useState<string>("PERSONAL_USER");

  useEffect(() => {
    let isMounted = true;
    const url = new URL(window.location.href);
    const isLoginRoute = url.pathname === "/login" || url.pathname === "/";
    const oauthToken = url.searchParams.get("token");
    const oauthError = url.searchParams.get("error");

    if (oauthToken && isLoginRoute) {
      api.setAccessToken(oauthToken);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    if (oauthError) {
      api.clearAccessToken();
    }

    api
      .getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          setAuthStatus("authenticated");
          setUserRole(user.role || "PERSONAL_USER");
          if (oauthToken || window.location.pathname === "/login") {
            const dest = user.role === "MERCHANT_USER" || user.role === "ADMIN" ? "/merchant" : "/dashboard";
            window.location.replace(dest);
          }
        } else {
          setAuthStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthStatus("unauthenticated");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DashboardProvider>
          <TransactionsProvider>
            <NotificationProvider>
              <AnalyticsStoreProvider>
                <CurrencyProvider>
                  <WouterRouter>
                    <Router authStatus={authStatus} userRole={userRole} />
                  </WouterRouter>
                </CurrencyProvider>
              </AnalyticsStoreProvider>
            </NotificationProvider>
          </TransactionsProvider>
        </DashboardProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
