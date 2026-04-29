const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, "")
  : "http://localhost:9999";

export const API_URL = `${apiBaseUrl}/api/v1`;
console.log("🚀 NEXORA_ENGINE_ACTIVE:", API_URL);

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  monthlyIncome?: string;
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
    window.localStorage.removeItem(this.tokenKey);
    window.location.href = `${this.baseUrl}/logout`;
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

  async updateUserData(data: { firstName: string; lastName: string; monthlyIncome: string }) {
    return this.post<{ user: AuthUser }>("/auth/user/update", data);
  }

  async getAIInsights(): Promise<{ advice: string }> {
    return this.post<{ advice: string }>("/ai/insights", {});
  }
}

export const api = new ApiClient();

export async function fetchApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  const response = await fetch("http://localhost:9999/api/healthz", { signal });
  return response.json();
}
