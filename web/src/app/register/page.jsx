import React from "react";
import s from "@/styles/Auth.module.scss";
import Link from "next/link";

export default function RegisterPage() {
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
          <button className={s.langSwitch}>🌐 Ru</button>
        </div>

        <div className={s.formGroup}>
          <label>Имя пользователя</label>
          <input type="text" placeholder="Введите имя" />
        </div>

        <div className={s.formGroup}>
          <label>Email</label>
          <input type="email" placeholder="Введите email" />
        </div>

        <div className={s.formGroup}>
          <label>Пароль</label>
          <input type="password" placeholder="Введите пароль" />
        </div>

        <div className={s.formGroup}>
          <label>Повторите пароль</label>
          <input type="password" placeholder="Повторите пароль" />
        </div>

        <button className={s.loginBtn}>Зарегистрироваться</button>

        <p className={s.noAccount}>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
