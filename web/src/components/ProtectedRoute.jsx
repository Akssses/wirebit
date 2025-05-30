"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Показываем загрузку, пока проверяется аутентификация
  if (loading) {
    return <div>Loading...</div>;
  }

  // Если пользователь аутентифицирован, показываем содержимое
  return isAuthenticated ? children : null;
}
