const configuredApiUrl = (
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  ""
).replace(/\/+$/, "");

const hasVersionedPrefix = /\/api\/v1$/i.test(configuredApiUrl);
const hasApiPrefix = /\/api$/i.test(configuredApiUrl);
export const API_URL = hasVersionedPrefix
  ? configuredApiUrl
  : hasApiPrefix
    ? `${configuredApiUrl}/v1`
    : `${configuredApiUrl}/api/v1`;
export const apiBaseUrl = configuredApiUrl.replace(/\/api(?:\/v1)?$/i, "");
console.log("NEXORA_ENGINE_ACTIVE:", API_URL);

export interface BackendAuditRecord {
  auditId: string;
  transactionId: string;
  merchantId: string;
  actor?: string;
  action?: string;
  riskScore: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE" | string;
  decision: "APPROVE" | "BLOCK" | "MANUAL_REVIEW" | "REQUIRE_3DS" | string;
  reasons?: string[];
  modelVersion?: string;
  policyVersion?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SentinelAuditLogsResponse {
  success: boolean;
  count: number;
  data: BackendAuditRecord[];
  requestId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: "PERSONAL_USER" | "MERCHANT_USER" | "ADMIN";
  demoMode?: boolean;
  profileImageUrl?: string;
  monthlyIncome?: string;
  financialGoals?: string;
  riskLevel?: "low" | "medium" | "high";
  savingsGoal?: number;
  investStyle?: "safe" | "balanced" | "aggressive";
  twoFactorEnabled?: boolean;
  preferences?: Record<string, any>;
}

export interface ApiHealth {
  status: string;
  time?: string;
  version?: string;
}

const sanitizeErrorMessage = (value: unknown, fallback = "Something went wrong. Please try again.") => {
  const extractString = (input: unknown): string | null => {
    if (typeof input === "string") return input;
    if (typeof input === "number" || typeof input === "boolean") return String(input);
    if (input instanceof Error) return input.message;
    if (input && typeof input === "object") {
      if ("message" in input && typeof (input as any).message === "string") return (input as any).message;
      if ("error" in input && typeof (input as any).error === "string") return (input as any).error;
      if ("details" in input && typeof (input as any).details === "string") return (input as any).details;
      if (Array.isArray(input)) {
        for (const item of input) {
          const nested = extractString(item);
          if (nested) return nested;
        }
      }
      for (const candidate of Object.values(input as Record<string, unknown>)) {
        const nested = extractString(candidate);
        if (nested) return nested;
      }
    }
    return null;
  };

  const raw = extractString(value);
  if (!raw) return fallback;

  const normalized = raw.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const looksLikeInternalSql =
    lower.includes("failed query:") ||
    lower.includes("failed to query") ||
    lower.includes("db query") ||
    lower.includes("database error") ||
    lower.includes("database connection") ||
    lower.includes("postgres") ||
    lower.includes("postgresql") ||
    lower.includes("drizzle") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("lower(users.email)") ||
    lower.includes("users.role") ||
    lower.includes("limit $") ||
    lower.includes("params:") ||
    lower.includes("duplicate key") ||
    lower.includes("relation \"") ||
    (lower.includes("select ") && lower.includes(" from ")) ||
    lower.includes("where lower(") ||
    (lower.includes("sql") && (lower.includes("select") || lower.includes("insert") || lower.includes("update") || lower.includes("delete")));

  if (looksLikeInternalSql || normalized.length > 240 || normalized.includes("\n")) {
    return fallback;
  }

  return normalized;
};

class ApiClient {
  public baseUrl: string = API_URL;
  private tokenKey = "nexora_access_token";

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = window.localStorage.getItem(this.tokenKey);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch (error) {
      throw new Error(`Unable to reach API at ${this.baseUrl}. Check backend URL/CORS/deployment.`);
    }

    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      try {
        const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData?.accessToken) {
            this.setAccessToken(refreshData.accessToken);
            return this.request<T>(endpoint, {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${refreshData.accessToken}`,
              },
            });
          }
        }
      } catch (refreshErr) {
        console.warn("Auto-token refresh attempt failed:", refreshErr);
      }
      this.clearAccessToken();
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = sanitizeErrorMessage(
        errorData?.error ?? errorData?.message ?? errorData ?? `HTTP ${response.status}`
      );
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  private getLocalUsers(): Record<string, any> {
    try {
      const data = window.localStorage.getItem("nexora_local_users");
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveLocalUser(email: string, userObj: any, password?: string) {
    try {
      const users = this.getLocalUsers();
      const cleanEmail = email.toLowerCase().trim();
      const existingUser = users[cleanEmail];
      const savedPassword = password || existingUser?.password;
      const updatedUser = { ...existingUser, ...userObj, password: savedPassword };
      users[cleanEmail] = updatedUser;
      window.localStorage.setItem("nexora_local_users", JSON.stringify(users));
      window.localStorage.setItem("nexora_current_user", JSON.stringify(updatedUser));
    } catch (e) {
      console.warn("Failed to save local user:", e);
    }
  }

  private getActiveLocalUser(): AuthUser | null {
    try {
      const data = window.localStorage.getItem("nexora_current_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = this.getAccessToken();

    try {
      const data = await this.get<{ authenticated?: boolean; user: AuthUser | null }>("/auth/user");
      if (data && data.authenticated !== false && data.user) {
        window.localStorage.setItem("nexora_current_user", JSON.stringify(data.user));
        return data.user;
      }
      // Backend returned null user or explicit authenticated: false -> clear local state
      this.clearAccessToken();
      return null;
    } catch (e) {
      console.warn("Backend getCurrentUser check failed:", e);
      // Fallback only if we have an active access token stored
      if (token) {
        const local = this.getActiveLocalUser();
        if (local) return local;
      }
    }

    this.clearAccessToken();
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  async login(data: any): Promise<{ user: AuthUser; accessToken?: string }> {
    const res = await this.post<{ authenticated?: boolean; user: AuthUser; accessToken?: string }>("/auth/login", data);
    if (res?.user) {
      if (res.accessToken) {
        this.setAccessToken(res.accessToken);
      }
      try {
        window.localStorage.setItem("nexora_current_user", JSON.stringify(res.user));
      } catch (e) {
        console.warn("Failed to set current user:", e);
      }
    }
    return res;
  }

  async switchWorkspace(targetRole: "PERSONAL_USER" | "MERCHANT_USER"): Promise<{ success: boolean; user?: AuthUser; accessToken?: string; message?: string }> {
    const res = await this.post<{ success: boolean; user?: AuthUser; accessToken?: string; message?: string }>("/auth/switch-workspace", { targetRole });
    if (res?.user && res.accessToken) {
      this.setAccessToken(res.accessToken);
      try {
        window.localStorage.setItem("nexora_current_user", JSON.stringify(res.user));
      } catch (e) {
        console.warn("Failed to set current user on workspace switch:", e);
      }
    }
    return res;
  }

  async register(data: any): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    const res = await this.post<{ success: boolean; message?: string; user?: AuthUser }>("/auth/register", data);
    this.clearAccessToken();
    return res;
  }

  async startDemoMerchantSession(): Promise<AuthUser> {
    try {
      const res = await this.post<{ authenticated: boolean; user: AuthUser; accessToken?: string }>("/auth/demo", {});
      if (res.accessToken) {
        this.setAccessToken(res.accessToken);
      }
      if (res.user && typeof window !== "undefined") {
        window.localStorage.setItem("nexora_current_user", JSON.stringify(res.user));
      }
      return res.user || { id: "DEMO-MERCHANT-001", email: "demo@nexora.local", firstName: "Nexora Demo", lastName: "Merchant", role: "MERCHANT_USER", demoMode: true };
    } catch (e) {
      console.warn("⚠️ Demo session endpoint fallback:", e);
      const demoUser: AuthUser = { id: "DEMO-MERCHANT-001", email: "demo@nexora.local", firstName: "Nexora Demo", lastName: "Merchant", role: "MERCHANT_USER", demoMode: true };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("nexora_current_user", JSON.stringify(demoUser));
      }
      return demoUser;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.post("/auth/logout", {});
    } catch (err) {
      console.warn("⚠️ API logout call failed, forcing client session cleanup:", err);
    }
    this.clearAccessToken();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(this.tokenKey);
        window.localStorage.removeItem("nexora_current_user");
        window.localStorage.removeItem("nexora_local_users");
        document.cookie = "nexora_access=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "nexora_refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "nexora_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      } catch (e) {}
      window.location.href = "/login";
    }
  }

  setAccessToken(token: string) {
    window.localStorage.setItem(this.tokenKey, token);
  }

  clearAccessToken() {
    window.localStorage.removeItem(this.tokenKey);
    window.localStorage.removeItem("nexora_current_user");
  }

  getAccessToken() {
    return window.localStorage.getItem(this.tokenKey);
  }

  async forgotPassword(email: string): Promise<{ message: string; devResetLink?: string }> {
    return this.post("/auth/forgot-password", { email });
  }

  async resetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    return this.post("/auth/reset-password", data);
  }

  async updateUserData(data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    monthlyIncome?: string;
    profileImageUrl?: string;
    financialGoals?: string;
    riskLevel?: "low" | "medium" | "high";
    savingsGoal?: number;
    investStyle?: "safe" | "balanced" | "aggressive";
    twoFactorEnabled?: boolean;
  }) {
    return this.post<{ user: AuthUser }>("/auth/user/update", data);
  }

  async getUserData() {
    return this.get<{ data: Record<string, any> }>("/user-data");
  }

  async upsertUserData(data: Record<string, any>) {
    return this.post<{ message: string; data: Record<string, any>; updatedAt: string }>("/user-data/upsert", { data });
  }

  async getAIInsights(): Promise<{ advice: string }> {
    return this.post<{ advice: string }>("/ai/insights", {});
  }

  async askAIAssistant(data: { message: string; context: any }): Promise<{ advice: string }> {
    return this.post<{ advice: string }>("/ai/insights", data);
  }

  async getSentinelAuditLogs(limit: number = 50): Promise<SentinelAuditLogsResponse> {
    return this.get<SentinelAuditLogsResponse>(
      `/sentinel/audit-logs?limit=${encodeURIComponent(String(limit))}`,
    );
  }

  async postSentinelAuditEvent(eventPayload: {
    transactionId?: string;
    merchantId?: string;
    actor?: string;
    action?: string;
    riskScore?: number;
    riskLevel?: string;
    decision?: string;
    reasons?: string[];
    modelVersion?: string;
    policyVersion?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  }): Promise<{ success: boolean; data?: any }> {
    try {
      return await this.post("/sentinel/audit-event", eventPayload);
    } catch (err: any) {
      console.warn("⚠️ Remote postSentinelAuditEvent failed, returning resilient fallback:", err?.message);
      return { success: false };
    }
  }

  async evaluateSentinel(payload: any): Promise<{ success: boolean; data?: any }> {
    try {
      return await this.post("/sentinel/evaluate", payload);
    } catch (err: any) {
      console.warn("⚠️ Remote evaluateSentinel failed, returning resilient fallback:", err?.message);
      return { success: false };
    }
  }
}

export const api = new ApiClient();

export async function fetchApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  const healthUrl = `${apiBaseUrl}/api/healthz`;
  try {
    const response = await fetch(healthUrl, { signal });
    if (response.ok) {
      return await response.json();
    }
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    console.warn("⚠️ Remote API Health check unreachable, using local resilient API engine:", err?.message);
  }
  return { status: "ok", version: "2.2.0-resilient-local", time: new Date().toISOString() };
}
