import React from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";

export default function LoginPage() {
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

        <div className={s.formGroup}>
          <label>Логин</label>
          <input type="text" placeholder="Введите логин" />
        </div>

        <div className={s.formGroup}>
          <label>Пароль</label>
          <input type="password" placeholder="Введите пароль" />
        </div>

        <div className={s.forgotPassword}>
          <a href="#">Забыли пароль?</a>
        </div>

        <button className={s.loginBtn}>Войти</button>

        <p className={s.noAccount}>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
