"use client";

import React, { useState, useEffect } from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaGlobe } from "react-icons/fa";
import LanguageModal from "@/components/shared/LanguageModal/LanguageModal";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

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

  const validateForm = () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Пожалуйста, заполните все поля");
      return false;
    }

    if (formData.username.length < 3) {
      setError("Имя пользователя должно содержать минимум 3 символа");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Введите корректный email адрес");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      toast.success("Регистрация прошла успешно! Добро пожаловать!");
      router.push("/exchange");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Произошла ошибка при регистрации");
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
        <p className={s.slogan}>Обмен криптовалют на выгодных условиях</p>
      </div>

      <div className={s.authBox}>
        <div className={s.header}>
          <h2>Регистрация</h2>
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
          {error && <div className={s.error}>{error}</div>}

          <div className={s.formGroup}>
            <label>Имя пользователя</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Введите имя пользователя"
              disabled={loading}
              required
            />
          </div>

          <div className={s.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите email"
              disabled={loading}
              required
            />
          </div>

          <div className={s.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль (минимум 6 символов)"
              disabled={loading}
              required
            />
          </div>

          <div className={s.formGroup}>
            <label>Повторите пароль</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторите пароль"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={s.loginBtn} disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className={s.noAccount}>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
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
