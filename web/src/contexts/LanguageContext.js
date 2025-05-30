"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/i18n/locales/en";
import ru from "@/i18n/locales/ru";

const translations = { en, ru };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("ru");

  // Загружаем сохраненный язык при инициализации
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem("language", lang);
      // Add HTML lang attribute for accessibility
      document.documentElement.lang = lang;
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split(".");
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    if (typeof value === "string" && params) {
      return value.replace(
        /\{\{(\w+)\}\}/g,
        (_, key) => params[key] || `{{${key}}}`
      );
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
