"use client";

import React, { useState } from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.username && formData.password) {
      router.push("/");
    } else {
      setError("Пожалуйста, заполните все поля");
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
            />
          </div>

          {error && <div className={s.error}>{error}</div>}

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
