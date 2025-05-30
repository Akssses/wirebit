// src/components/LanguageModal/LanguageModal.jsx
"use client";

import React, { useEffect } from "react";
import s from "./LanguageModal.module.scss";
import { useLanguage } from "@/contexts/LanguageContext";

const languages = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LanguageModal({ isOpen, onClose, onSelect }) {
  // Блокируем скролл фона, когда модалка открыта
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />

      <div className={`${s.sheet} ${s.open}`}>
        <div className={s.handle} />
        <ul className={s.list}>
          {languages.map(({ code, label, flag }) => (
            <li key={code}>
              <button
                className={s.item}
                onClick={() => {
                  onSelect(code);
                  onClose();
                }}
              >
                <span className={s.flag}>{flag}</span>
                <span className={s.label}>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
