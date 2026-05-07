const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, "")
  : "http://localhost:9999";

const hasVersionedPrefix = /\/api\/v1$/i.test(apiBaseUrl);
const hasApiPrefix = /\/api$/i.test(apiBaseUrl);
export const API_URL = hasVersionedPrefix
  ? apiBaseUrl
  : hasApiPrefix
    ? `${apiBaseUrl}/v1`
    : `${apiBaseUrl}/api/v1`;
console.log("NEXORA_ENGINE_ACTIVE:", API_URL);

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
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

class ApiClient {
  public baseUrl: string = API_URL;
  private tokenKey = "nexora_access_token";

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = window.localStorage.getItem(this.tokenKey);
    
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
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

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const data = await this.get<{ user: AuthUser }>("/auth/user");
      return data.user;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  async login(data: any): Promise<{ user: AuthUser; accessToken?: string }> {
    return this.post("/auth/login", data);
  }

  async register(data: any): Promise<{ user: AuthUser; accessToken?: string }> {
    return this.post("/auth/register", data);
  }

  async logout(): Promise<void> {
    try {
      await this.get("/auth/logout");
    } catch {
      // ignore errors, still clear token and redirect
    }
    window.localStorage.removeItem(this.tokenKey);
    window.location.href = "/login";
  }

  setAccessToken(token: string) {
    window.localStorage.setItem(this.tokenKey, token);
  }

  clearAccessToken() {
    window.localStorage.removeItem(this.tokenKey);
  }

  getAccessToken() {
    return window.localStorage.getItem(this.tokenKey);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
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
}

export const api = new ApiClient();

export async function fetchApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  const healthUrl = `${apiBaseUrl}/api/healthz`;
  const response = await fetch(healthUrl, { signal });
  return response.json();
}
