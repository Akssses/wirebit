import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import s from "@/styles/LanguageSwitcher.module.scss";
import { FiGlobe } from "react-icons/fi";

export default function LanguageSwitcher() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className={s.languageButton}
        onClick={() => setIsModalOpen(true)}
        title={t("common.changeLanguage")}
      >
        <FiGlobe className={s.globeIcon} />
        <span className={s.currentLang}>{language.toUpperCase()}</span>
      </button>

      {isModalOpen && (
        <div className={s.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{t("common.selectLanguage")}</h3>
            <div className={s.languageList}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`${s.languageOption} ${
                    language === lang.code ? s.active : ""
                  }`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className={s.flag}>{lang.flag}</span>
                  <span className={s.langName}>{lang.name}</span>
                  {language === lang.code && (
                    <span className={s.activeIndicator}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
