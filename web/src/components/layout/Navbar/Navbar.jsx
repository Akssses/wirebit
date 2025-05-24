// src/components/Navbar/Navbar.jsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome } from "react-icons/fi";
import { MdSwapHoriz, MdShowChart, MdHistory } from "react-icons/md";
import s from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();

  const items = [
    { to: "/", Icon: FiHome, label: "Главная" },
    { to: "/exchange", Icon: MdSwapHoriz, label: "Обмен" },
    { to: "/rates", Icon: MdShowChart, label: "Курс" },
    { to: "/history", Icon: MdHistory, label: "История" },
  ];

  return (
    <nav className={s.navbar}>
      {items.map(({ to, Icon, label }) => {
        const isActive = pathname === to;

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
    </nav>
  );
}
