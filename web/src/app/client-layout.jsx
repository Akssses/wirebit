"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function LayoutContent({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  // Страницы, где не нужно показывать navbar
  const authPages = ["/login", "/register"];
  const isAuthPage = authPages.includes(pathname);

  // Показываем navbar только если:
  // 1. Пользователь авторизован
  // 2. Это не страница аутентификации
  // 3. Не идет загрузка проверки авторизации
  const shouldShowNavbar = isAuthenticated && !isAuthPage && !loading;

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {children}
    </>
  );
}

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
