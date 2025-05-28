"use client";

import React from "react";
import s from "@/styles/RatesPage.module.scss";

const MOCK_RATES = [
  {
    from_currency: "BTC",
    to_currency: "USDT",
    rate_in: 1,
    rate_out: 43000,
    available_amount: 10,
    min_amount: "0.001 BTC",
    max_amount: "10 BTC",
    is_manual: false
  },
  {
    from_currency: "ETH",
    to_currency: "USDT",
    rate_in: 1,
    rate_out: 2200,
    available_amount: 100,
    min_amount: "0.01 ETH",
    max_amount: "100 ETH",
    is_manual: false
  },
  {
    from_currency: "USDT",
    to_currency: "BTC",
    rate_in: 43000,
    rate_out: 1,
    available_amount: 500000,
    min_amount: "100 USDT",
    max_amount: "500000 USDT",
    is_manual: true
  },
  {
    from_currency: "USDT",
    to_currency: "ETH",
    rate_in: 2200,
    rate_out: 1,
    available_amount: 500000,
    min_amount: "100 USDT",
    max_amount: "500000 USDT",
    is_manual: false
  }
];

export default function RatesPage() {
  return (
    <main className={s.wrapper}>
      <h1 className={s.pageTitle}>Курсы обмена</h1>

      <div className={s.grid}>
        {MOCK_RATES.map((rate, index) => (
          <article key={index} className={s.card}>
            <h2 className={s.pair}>
              {rate.from_currency}{" "}
              <span className={s.arrow}>→</span> {rate.to_currency}
            </h2>

            <p className={s.rate}>
              Коэффициент:&nbsp;
              <strong>{rate.rate_in}</strong>
              &nbsp;→&nbsp;
              <strong>{rate.rate_out}</strong>
            </p>

            <p className={s.available}>
              Доступно:&nbsp;
              <span>
                {Intl.NumberFormat("ru-RU").format(rate.available_amount)}
              </span>
            </p>

            <p className={s.limits}>
              Мин: {rate.min_amount},&nbsp; Макс:&nbsp;
              {rate.max_amount}
            </p>

            {rate.is_manual && (
              <span className={s.manual}>Ручной обмен</span>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
