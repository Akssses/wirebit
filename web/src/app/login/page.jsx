"use client";

import React, { useState } from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(formData.username, formData.password);
    } catch (error) {
      setError(
        error.response?.data?.detail || "Произошла ошибка при входе в систему"
      );
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
          <h2>Авторизация</h2>
          <button className={s.langSwitch}>🌐 Ru</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={s.error}>{error}</div>}

          <div className={s.formGroup}>
            <label>Логин</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Введите логин"
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
              placeholder="Введите пароль"
              required
            />
          </div>

          <div className={s.forgotPassword}>
            <a href="#">Забыли пароль?</a>
          </div>

          <button type="submit" className={s.loginBtn}>
            Войти
          </button>
        </form>

        <p className={s.noAccount}>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
