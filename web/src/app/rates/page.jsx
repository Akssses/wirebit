"use client";

import React from "react";
import Image from "next/image";
import s from "@/styles/RatesPage.module.scss";

const pairs = [
  {
    id: 1,
    from: "ZELLEUSD",
    to:   "ACRUB",
    rateFrom: 1,
    rateTo:   73.9228,
    available: 19156200,
    min: 500,
    max: 2029.1439,
  },
  {
    id: 2,
    from: "ZELLEUSD",
    to:   "TCSBRUB",
    rateFrom: 1,
    rateTo:   73.9228,
    available: 19156200,
    min: 500,
    max: 2029.1439,
  },
  {
    id: 3,
    from: "ZELLEUSD",
    to:   "SBERRUB",
    rateFrom: 1,
    rateTo:   73.92285,
    available: 19156200,
    min: 500,
    max: 2029.1425,
  },
  {
    id: 4,
    from: "ZELLEUSD",
    to:   "USDTTRC20",
    rateFrom: 1.0256,
    rateTo:   1,
    available: 4890000,
    min: 500,
    max: 15000,
  },
  {
    id: 5,
    from: "WIREUSD",
    to:   "USDTTRC20",
    rateFrom: 1.018,
    rateTo:   1,
    available: 9719075.8284,
    min: 6000,
    max: 3000000,
  },
  {
    id: 6,
    from: "BTC",
    to:   "USDTTRC20",
    rateFrom: 1,
    rateTo:   107376.44064,
    available: 9719075.8284,
    min: 0.00251452,
    max: 0.00931303,
  },
];

export default function RatesPage() {
  return (
    <main className={s.wrapper}>
      <h1 className={s.pageTitle}>Курсы обмена</h1>

      <div className={s.grid}>
        {pairs.map((p) => (
          <article key={p.id} className={s.card}>

            <h2 className={s.pair}>
              {p.from} <span className={s.arrow}>→</span> {p.to}
            </h2>

            <p className={s.rate}>
              Коэффициент:&nbsp;
              <strong>{p.rateFrom}</strong>
              &nbsp;→&nbsp;
              <strong>{p.rateTo}</strong>
            </p>

            <p className={s.available}>
              Доступно:&nbsp;
              <span>{Intl.NumberFormat("ru-RU").format(p.available)}</span>
            </p>

            <p className={s.limits}>
              Мин: {p.min}&nbsp;USD,&nbsp; Макс:&nbsp;
              {p.max}&nbsp;USD
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
