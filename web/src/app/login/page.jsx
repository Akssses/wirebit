"use client";

import React, { useState, useEffect } from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

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
      setError("Пожалуйста, заполните все поля");
      setLoading(false);
      return;
    }

    try {
      await login(formData);
      toast.success("Вход выполнен успешно!");
      router.push("/exchange");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Ошибка входа. Проверьте данные.");
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
          <h2>Вход</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label>Имя пользователя</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Введите имя пользователя"
              disabled={loading}
            />
          </div>

          <div className={s.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              disabled={loading}
            />
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button type="submit" className={s.loginBtn} disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className={s.noAccount}>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
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
