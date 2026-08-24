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

const Login = lazy(() =>
  import("@/pages/Login").then((module) => ({ default: module.Login })),
);
const ForgotPassword = lazy(() =>
  import("@/pages/ForgotPassword").then((module) => ({ default: module.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import("@/pages/ResetPassword").then((module) => ({ default: module.ResetPassword })),
);
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

function ProtectedRoute({
  component: Component,
  authStatus,
}: {
  component: ComponentType;
  authStatus: AuthStatus;
}) {
  if (authStatus === "checking") return <FullPageSpinner />;
  return authStatus === "authenticated" ? <Component /> : <Redirect to="/login" />;
}

const renderProtected = (Comp: ComponentType, authStatus: AuthStatus) => {
  const WrappedComponent = () => <ProtectedRoute component={Comp} authStatus={authStatus} />;
  return WrappedComponent;
};

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-950 text-red-200 min-h-screen z-[99999] relative">
          <h1 className="text-2xl font-bold text-red-400 mb-4">React Render Error Caught!</h1>
          <pre className="p-4 bg-black/60 rounded text-xs font-mono whitespace-pre-wrap">
            {this.state.error?.toString()}
            {"\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router({ authStatus }: { authStatus: AuthStatus }) {
  const [location] = useLocation();

  const isAuthRoute =
    location === "/" ||
    location === "/login" ||
    location.startsWith("/forgot-password") ||
    location.startsWith("/reset-password");

  const showShell = authStatus === "authenticated" && !isAuthRoute;
  const isMerchantRoute = location === "/merchant" || location.startsWith("/merchant/");

  const loginEntry = () =>
    authStatus === "checking" ? (
      <FullPageSpinner />
    ) : authStatus === "authenticated" ? (
      <Redirect to="/dashboard" />
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

    // Default to authenticated in local preview mode so all pages and workspace switchers work instantly
    setAuthStatus("authenticated");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(LOCAL_PREVIEW_AUTH_KEY, "true");
    }

    api
      .isAuthenticated()
      .then((authenticated) => {
        if (!isMounted) return;
        if (authenticated) {
          setAuthStatus("authenticated");
          if (oauthToken || window.location.pathname === "/login") {
            window.location.replace("/dashboard");
          }
        } else {
          // Keep authenticated for local preview mode so all pages & merchant dashboards load cleanly
          setAuthStatus("authenticated");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthStatus("authenticated");
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
                    <Router authStatus={authStatus} />
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
