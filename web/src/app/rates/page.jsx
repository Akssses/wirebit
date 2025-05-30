"use client";

import React, { useState, useEffect } from "react";
import s from "@/styles/RatesPage.module.scss";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLanguage } from "@/contexts/LanguageContext";

async function fetchRates() {
  try {
    const response = await fetch("/api/rates");
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch rates");
    }
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");

    return Array.from(items).map((item) => ({
      from_currency: item.getElementsByTagName("from")[0].textContent,
      to_currency: item.getElementsByTagName("to")[0].textContent,
      rate_in: parseFloat(item.getElementsByTagName("in")[0].textContent),
      rate_out: parseFloat(item.getElementsByTagName("out")[0].textContent),
      available_amount: parseFloat(
        item.getElementsByTagName("amount")[0].textContent
      ),
      min_amount: item.getElementsByTagName("minamount")[0].textContent,
      max_amount: item.getElementsByTagName("maxamount")[0].textContent,
      is_manual:
        item.getElementsByTagName("param")[0]?.textContent === "manual",
    }));
  } catch (error) {
    console.error("Error fetching rates:", error);
    throw error;
  }
}

function RatesPageContent() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadRates();
  }, []);

  async function loadRates() {
    try {
      const data = await fetchRates();
      setRates(data);
    } catch (err) {
      setError(t("rates.error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className={s.loading}>{t("common.loading")}</div>;
  }

  if (error) {
    return <div className={s.error}>{error}</div>;
  }

  return (
    <main className={s.wrapper}>
      <h1 className={s.pageTitle}>{t("rates.title")}</h1>

      <div className={s.grid}>
        {rates.map((rate, index) => (
          <article key={index} className={s.card}>
            <h2 className={s.pair}>
              {rate.from_currency} <span className={s.arrow}>→</span>{" "}
              {rate.to_currency}
            </h2>

            <p className={s.rate}>
              {t("rates.coefficient")}:&nbsp;
              <strong>{rate.rate_in}</strong>
              &nbsp;→&nbsp;
              <strong>{rate.rate_out}</strong>
            </p>

            <p className={s.available}>
              {t("rates.available")}:&nbsp;
              <span>
                {Intl.NumberFormat("ru-RU").format(rate.available_amount)}
              </span>
            </p>

            <p className={s.limits}>
              {t("rates.min")}: {rate.min_amount},&nbsp; {t("rates.max")}:&nbsp;
              {rate.max_amount}
            </p>

            {rate.is_manual && (
              <span className={s.manual}>{t("rates.manualExchange")}</span>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

export default function RatesPage() {
  return (
    <ProtectedRoute>
      <RatesPageContent />
    </ProtectedRoute>
  );
}
