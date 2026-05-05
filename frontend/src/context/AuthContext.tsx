import React, { createContext, useContext, useState, useCallback } from "react";

interface AuthUser {
  userId: string;
  role: string;
  token: string;
  username: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, userId: string, role: string, username: string) => void;
  logout: () => void;
  updateUsername: (username: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  if (token && userId && role) return { token, userId, role, username };
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);

  const login = useCallback((token: string, userId: string, role: string, username: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
    setUser({ token, userId, role, username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUser(null);
  }, []);

  const updateUsername = useCallback((username: string) => {
    localStorage.setItem("username", username);
    setUser((u) => (u ? { ...u, username } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
