"use client";

import React, { useState, useEffect } from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaGlobe } from "react-icons/fa";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageModal from "@/components/shared/LanguageModal/LanguageModal";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [langModalOpen, setLangModalOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();

  const handleSelectLang = (code) => {
    changeLanguage(code);
    setLangModalOpen(false);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError(t("auth.errors.required"));
      setLoading(false);
      return;
    }

    try {
      await login(formData);
      toast.success(t("auth.loginSuccess"));
      router.push("/exchange");
    } catch (error) {
      console.error("Login error:", error);
      setError(t("auth.errors.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.logoBlock}>
        <img
          src="./assets/images/logo.png"
          alt="WireBit Logo"
          className={s.logo}
        />
        <p className={s.slogan}>{t("slogan")}</p>
      </div>

      <div className={s.authBox}>
        <div className={s.header}>
          <h2>{t("auth.loginTitle")}</h2>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label>{t("common.username")}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={t("auth.errors.usernameRequired")}
              disabled={loading}
            />
          </div>

          <div className={s.formGroup}>
            <label>{t("common.password")}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("auth.errors.passwordRequired")}
              disabled={loading}
            />
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button type="submit" className={s.loginBtn} disabled={loading}>
            {loading ? t("common.loading") : t("auth.loginButton")}
          </button>
        </form>

        <p className={s.noAccount}>
          {t("auth.noAccount")}{" "}
          <Link href="/register">{t("common.register")}</Link>
        </p>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}
