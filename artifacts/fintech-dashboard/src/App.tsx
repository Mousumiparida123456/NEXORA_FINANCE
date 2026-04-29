import { Suspense, lazy, useEffect, useState } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { DashboardProvider } from "@/lib/dashboard-context";

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

function ProtectedRoute({
  component: Component,
  authStatus,
}: {
  component: React.ComponentType;
  authStatus: AuthStatus;
}) {
  if (authStatus === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Verifying secure session...
      </div>
    );
  }

  return authStatus === "authenticated" ? <Component /> : <Redirect to="/login" />;
}

function Router({ authStatus }: { authStatus: AuthStatus }) {
  const loginEntry =
    authStatus === "checking" ? (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
        Verifying secure session...
      </div>
    ) : authStatus === "authenticated" ? (
      <Redirect to="/dashboard" />
    ) : (
      <Login />
    );

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-400">
            Loading Nexora workspace...
          </div>
        }
      >
        <Switch>
          <Route path="/">{loginEntry}</Route>
          <Route path="/login">{loginEntry}</Route>
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} authStatus={authStatus} />
          </Route>
          <Route path="/insights">
            <ProtectedRoute component={Insights} authStatus={authStatus} />
          </Route>
          <Route path="/transactions" component={() => <ProtectedRoute component={Transactions} authStatus={authStatus} />} />
          <Route path="/bills" component={() => <ProtectedRoute component={Bills} authStatus={authStatus} />} />
          <Route path="/recurring" component={() => <ProtectedRoute component={Recurring} authStatus={authStatus} />} />
          <Route path="/credit-score" component={() => <ProtectedRoute component={CreditScore} authStatus={authStatus} />} />
          <Route path="/invest">
            <ProtectedRoute component={Investment} authStatus={authStatus} />
          </Route>
          <Route path="/goals">
            <ProtectedRoute component={Goals} authStatus={authStatus} />
          </Route>
          <Route path="/ai-assistant">
            <ProtectedRoute component={AIAssistant} authStatus={authStatus} />
          </Route>
          <Route path="/notifications">
            <ProtectedRoute component={Notifications} authStatus={authStatus} />
          </Route>
          <Route path="/settings">
            <ProtectedRoute component={Settings} authStatus={authStatus} />
          </Route>
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
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

    // Only treat ?token= as OAuth login token on login routes.
    if (oauthToken && isLoginRoute) {
      api.setAccessToken(oauthToken);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    if (oauthError) {
      api.clearAccessToken();
    }

    if (
      import.meta.env.DEV &&
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(LOCAL_PREVIEW_AUTH_KEY) === "true"
    ) {
      setAuthStatus("authenticated");
      return () => {
        isMounted = false;
      };
    }

    api
      .isAuthenticated()
      .then((authenticated) => {
        if (!isMounted) return;
        setAuthStatus(authenticated ? "authenticated" : "unauthenticated");
        if (!authenticated) {
          api.clearAccessToken();
        }
        if (authenticated && (oauthToken || window.location.pathname === "/login")) {
          window.location.replace("/dashboard");
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
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}> 
            <Router authStatus={authStatus} />
          </WouterRouter>
        </DashboardProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
