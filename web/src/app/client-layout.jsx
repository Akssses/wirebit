"use client";

import Navbar from "@/components/layout/Navbar/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      {children}
      <Navbar />
    </AuthProvider>
  );
} 