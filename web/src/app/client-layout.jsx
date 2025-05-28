"use client";

import Navbar from "@/components/layout/Navbar/Navbar";

export default function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
} 