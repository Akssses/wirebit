"use client";

import React, { useState } from "react";
import { FaGlobe, FaCommentDots } from "react-icons/fa";
import s from "@/styles/HomePage.module.scss";
import LanguageModal from "@/components/shared/LanguageModal/LanguageModal";

export default function Home() {
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [lang, setLang] = useState("ru");

  const handleSelectLang = (code) => {
    setLang(code);
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
          <h1 className={s.title}>Обмен криптовалют на выгодных условиях</h1>

          <div className={s.controls}>
            <button
              className={s.langButton}
              onClick={() => setLangModalOpen(true)}
            >
              <FaGlobe />
              <span>{lang.toUpperCase()}</span>
            </button>

            <LanguageModal
              isOpen={langModalOpen}
              onClose={() => setLangModalOpen(false)}
              onSelect={handleSelectLang}
            />
          </div>

          <p className={s.pairs}>zelle-usdt/rub, wire transfer-usdt/rub</p>
        </div>
      </section>

      <section className={s.support}>
        <div className={s.supportInfo}>
          <FaCommentDots size={24} className={s.supportIcon} />
          <div>
            <h2 className={s.supportTitle}>Техподдержка</h2>
            <p className={s.supportSubtitle}>Решим ваш вопрос</p>
          </div>
        </div>
        <a href="mailto:info@wirebit.net" className={s.supportButton}>
          Написать
        </a>
      </section>

      <section className={s.about}>
        <h2 className={s.aboutTitle}>
          О нас <span className={s.dot} />
        </h2>
        <p className={s.aboutText}>
          Wirebit.net — ваш надёжный партнёр в сфере обмена криптовалют и
          фиатных денег. Мы предлагаем выгодные курсы, большой выбор направлений
          для обмена и быстрые транзакции. Наша команда профессионалов всегда
          поможет вам с любым вопросом.
        </p>
      </section>
    </div>
  );
}
