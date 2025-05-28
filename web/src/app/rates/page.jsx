"use client";

import React, { useState, useEffect } from "react";
import s from "@/styles/RatesPage.module.scss";

async function fetchRates() {
  try {
    const response = await fetch('/api/rates');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch rates');
    }
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const items = xmlDoc.getElementsByTagName('item');
    
    return Array.from(items).map(item => ({
      from_currency: item.getElementsByTagName('from')[0].textContent,
      to_currency: item.getElementsByTagName('to')[0].textContent,
      rate_in: parseFloat(item.getElementsByTagName('in')[0].textContent),
      rate_out: parseFloat(item.getElementsByTagName('out')[0].textContent),
      available_amount: parseFloat(item.getElementsByTagName('amount')[0].textContent),
      min_amount: item.getElementsByTagName('minamount')[0].textContent,
      max_amount: item.getElementsByTagName('maxamount')[0].textContent,
      is_manual: item.getElementsByTagName('param')[0]?.textContent === 'manual'
    }));
  } catch (error) {
    console.error('Error fetching rates:', error);
    throw error;
  }
}

export default function RatesPage() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRates()
      .then(data => {
        setRates(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className={s.wrapper}>
        <h1 className={s.pageTitle}>Курсы обмена</h1>
        <div className={s.loading}>
          <div className={s.spinner}></div>
          Загрузка курсов...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={s.wrapper}>
        <h1 className={s.pageTitle}>Курсы обмена</h1>
        <div className={s.error}>Ошибка загрузки курсов: {error}</div>
      </main>
    );
  }

  return (
    <main className={s.wrapper}>
      <h1 className={s.pageTitle}>Курсы обмена</h1>

      <div className={s.grid}>
        {rates.map((rate, index) => (
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
