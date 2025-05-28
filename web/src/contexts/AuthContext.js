"use client";

import { createContext, useContext, useState, useEffect } from "react";
import authApi from "@/services/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = authApi.getToken();
    if (token) {
      // Verify token is still valid
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = authApi.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // For now, just check if token exists
      // In a real app, you'd validate it with the server
      const userData = {
        token,
        // We could decode JWT to get user info, but for simplicity using localStorage
        username: localStorage.getItem("username") || "User",
        email: localStorage.getItem("email") || "",
      };

      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      authApi.removeToken();
      localStorage.removeItem("username");
      localStorage.removeItem("email");
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { access_token } = response;

      authApi.saveToken(access_token);

      // Save user info to localStorage for simplicity
      localStorage.setItem("username", credentials.username);
      // Email would come from registration, but for demo purposes
      localStorage.setItem("email", credentials.email || "");

      const userData = {
        token: access_token,
        username: credentials.username,
        email: credentials.email || "",
      };

      setUser(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);

      // After successful registration, automatically login
      await login({
        username: userData.username,
        password: userData.password,
        email: userData.email,
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authApi.removeToken();
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
