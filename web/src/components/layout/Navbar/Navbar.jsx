"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiHome, FiUser } from "react-icons/fi";
import { MdSwapHoriz, MdShowChart, MdHistory } from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import s from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
      router.push("/");
    } else {
      router.push("/login");
    }
  };

  const items = [
    { to: "/", Icon: FiHome, label: t("nav.home") },
    { to: "/exchange", Icon: MdSwapHoriz, label: t("nav.exchange") },
    { to: "/rates", Icon: MdShowChart, label: t("nav.rates") },
    {
      to: "/profile",
      Icon: FiUser,
      label: t("nav.profile"),
      requireAuth: true,
    },
  ];

  return (
    <nav className={s.navbar}>
      {items.map(({ to, Icon, label, requireAuth }) => {
        const isActive = pathname === to;

        // Hide history for non-authenticated users
        if (requireAuth && !isAuthenticated) {
          return null;
        }

        return (
          <Link
            key={to}
            href={to}
            className={`${s.navItem} ${isActive ? s.active : ""}`}
          >
            <div className={s.iconWrapper}>
              {/* динамически задаём цвет иконке */}
              <Icon size={24} color={isActive ? "#f6a016" : "#8a8a8a"} />
            </div>
            <span className={s.label}>{label}</span>
          </Link>
        );
      })}

      {/* User/Auth section */}
    </nav>
  );
}
