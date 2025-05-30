"use client";

import React, { useState } from "react";
import { FaGlobe, FaCommentDots } from "react-icons/fa";
import s from "@/styles/HomePage.module.scss";
import LanguageModal from "@/components/shared/LanguageModal/LanguageModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLanguage } from "@/contexts/LanguageContext";

function HomePageContent() {
  const [langModalOpen, setLangModalOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();

  const handleSelectLang = (code) => {
    changeLanguage(code);
    setLangModalOpen(false);
  };

  return (
    <div className={s.container}>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <img
            src="/assets/images/logo-black.svg"
            alt="WireBit.net"
            width={200}
          />
          <h1 className={s.title}>{t("slogan")}</h1>

          <div className={s.controls}>
            <button
              className={s.langButton}
              onClick={() => setLangModalOpen(true)}
            >
              <FaGlobe />
              <span>{language.toUpperCase()}</span>
            </button>

            <LanguageModal
              isOpen={langModalOpen}
              onClose={() => setLangModalOpen(false)}
              onSelect={handleSelectLang}
            />
          </div>

          <p className={s.pairs}>{t("home.supportedPairs")}</p>
        </div>
      </section>

      <section className={s.support}>
        <div className={s.supportInfo}>
          <FaCommentDots size={24} className={s.supportIcon} />
          <div>
            <h2 className={s.supportTitle}>{t("home.support.title")}</h2>
            <p className={s.supportSubtitle}>{t("home.support.subtitle")}</p>
          </div>
        </div>
        <a href="mailto:info@wirebit.net" className={s.supportButton}>
          {t("home.support.button")}
        </a>
      </section>

      <section className={s.about}>
        <h2 className={s.aboutTitle}>
          {t("home.about.title")} <span className={s.dot} />
        </h2>
        <p className={s.aboutText}>{t("home.about.text")}</p>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
