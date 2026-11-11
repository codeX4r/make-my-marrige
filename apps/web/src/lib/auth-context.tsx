"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/api-client";

interface User {
  userId: string;
  email: string;
  displayName: string;
  emailVerificationStatus: "UNVERIFIED" | "VERIFIED";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  listSessions: () => Promise<Array<{ sessionId: string; issuedAt: string; lastUsedAt: string; expiresAt: string }>>;
  revokeSession: (sessionId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ data: { user: User } }>("/auth/me");
      setUser(data.data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ data: { user: User } }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setUser(data.data.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await apiRequest<{ data: { user: User } }>("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    setUser(data.data.user);
  };

  const logout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    setUser(null);
  };

  const refreshSession = async () => {
    await apiRequest("/auth/refresh", { method: "POST" });
  };

  const verifyEmail = async (token: string) => {
    await apiRequest("/auth/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    await refreshUser();
  };

  const resendVerification = async (email: string) => {
    await apiRequest("/auth/email/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  };

  const forgotPassword = async (email: string) => {
    await apiRequest("/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await apiRequest("/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
  };

  const listSessions = async () => {
    const data = await apiRequest<{ data: { sessions: Array<{ sessionId: string; issuedAt: string; lastUsedAt: string; expiresAt: string }> } }>("/auth/sessions");
    return data.data.sessions;
  };

  const revokeSession = async (sessionId: string) => {
    await apiRequest(`/auth/sessions/${sessionId}/revoke`, { method: "POST" });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshSession,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        refreshUser,
        listSessions,
        revokeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}