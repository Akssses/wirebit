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

      // Get user data from server
      const userData = await authApi.getCurrentUser(token);
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      authApi.removeToken();
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { access_token } = response;

      authApi.saveToken(access_token);

      // Get full user data from server
      const userData = await authApi.getCurrentUser(access_token);
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
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authApi.removeToken();
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
