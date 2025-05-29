"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Показываем загрузку во время проверки авторизации
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "#fff",
          fontSize: "18px",
        }}
      >
        Проверка авторизации...
      </div>
    );
  }

  // Если пользователь не авторизован, не рендерим содержимое
  // (перенаправление произойдет в useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Если пользователь авторизован, показываем содержимое
  return children;
}
