export interface User {
  uuid: string;
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  business?: any;
  summary?: any;
}

export interface Business {
  id: number;
  business_name: string;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  webhook_url: string | null;
  secrete_hash: string | null;
}

export interface AuthResponse {
  isAuthenticated: boolean;
  user: User | null;
  business?: Business | null;
  summary?: any;
  error?: string;
}

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async checkAuth(): Promise<AuthResponse> {
    try {
      // ✅ Call Next.js API route (not Laravel directly)
      const response = await fetch("/api/user", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isAuthenticated: true,
          user: data.user,
          business: data.business,
          summary: data.summary,
        };
      }

      return {
        isAuthenticated: false,
        user: null,
        business: null,
        error: "Unauthorized",
        summary: null,
      };
    } catch (error: any) {
      console.error("Auth check failed:", error);
      return {
        isAuthenticated: false,
        user: null,
        business: null,
        error: error.message || "Network error",
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // ✅ Call Next.js API route
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { isAuthenticated: true, user: data.user };
      }

      return {
        isAuthenticated: false,
        user: null,
        error: data.message || "Login failed",
      };
    } catch (error: any) {
      console.error("Login failed:", error);
      return {
        isAuthenticated: false,
        user: null,
        error: error.message || "Network error",
      };
    }
  }

  async logout(): Promise<boolean> {
    try {
      // ✅ Call Next.js API route
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("Logout failed:", error);
      return false;
    }
  }

  // ✅ No longer needed
  async getCsrfCookie(): Promise<void> {
    // API routes handle this
  }
}

export const authService = AuthService.getInstance();
