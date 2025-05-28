"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import s from "@/styles/HistoryPage.module.scss";
import { useAuth } from "@/contexts/AuthContext";
import historyApi from "@/services/historyApi";
import { toast } from "react-toastify";

const icons = {
  USDT: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg",
  ETH: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg",
  DOGE: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg",
  BTC: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/btc.svg",
  LTC: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ltc.svg",
  XRP: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/xrp.svg",
  ADA: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ada.svg",
  TRX: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/trx.svg",
};

const statusMap = {
  new: { label: "Новая", color: "#ffb300" },
  pending: { label: "Ожидается", color: "#ffb300" },
  completed: { label: "Завершена", color: "#29b352" },
  cancelled: { label: "Отменена", color: "#e53935" },
  failed: { label: "Неудачная", color: "#e53935" },
};

// Fallback placeholder as data URL to avoid external dependencies
const FALLBACK_ICON =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNzc3Ii8+CjxwYXRoIGQ9Ik0xMCA2VjE0TTYgMTBIMTQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await historyApi.getHistory();
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Ошибка загрузки истории");
      toast.error("Не удалось загрузить историю обменов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, authLoading, loadHistory]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const getDefaultIcon = (currency) => {
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${currency.toLowerCase()}.svg`;
  };

  const handleImageError = (e) => {
    // Prevent infinite loop by checking if we're already showing fallback
    if (e.target.src !== FALLBACK_ICON) {
      e.target.src = FALLBACK_ICON;
    }
  };

  const getShortCurrencyName = (fullName) => {
    // Mapping for common currency shortcuts
    const currencyMap = {
      "Tether TRC20 USDT": "USDT",
      "Bitcoin BTC": "BTC",
      "Ethereum ETH": "ETH",
      "TRON TRX": "TRX",
      "Dogecoin DOGE": "DOGE",
      "Toncoin TON": "TON",
      "Notcoin NOT": "NOT",
      "USDCoin ERC20 USDC": "USDC",
      "Zelle USD": "USD",
      "Банковский счет Wire Transfer USD": "Wire USD",
      "Банковская карта RUB": "RUB",
      "СБП RUB": "СБП",
      "Сбербанк RUB": "Сбер",
      "Т-Банк RUB": "Т-Банк",
      "Альфа-Банк RUB": "Альфа",
    };

    // Return mapped name or extract last word (usually the ticker)
    if (currencyMap[fullName]) {
      return currencyMap[fullName];
    }

    // Extract last word which is usually the currency code
    const words = fullName.split(" ");
    return words[words.length - 1];
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;

    // Round to 2 decimal places
    return num.toFixed(2);
  };

  const handleRetry = useCallback(() => {
    loadHistory();
  }, [loadHistory]);

  const handleNavigateToExchange = useCallback(() => {
    router.push("/exchange");
  }, [router]);

  if (authLoading) {
    return (
      <div className={s.wrap}>
        <div className={s.loading}>Проверка авторизации...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className={s.wrap}>
        <h1 className={s.title}>История</h1>
        <div className={s.loading}>Загрузка истории...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.wrap}>
        <h1 className={s.title}>История</h1>
        <div className={s.error}>
          {error}
          <button onClick={handleRetry} style={{ marginLeft: "10px" }}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={s.wrap}>
        <h1 className={s.title}>История</h1>
        <div className={s.emptyState}>
          <p>У вас пока нет истории обменов</p>
          <button onClick={handleNavigateToExchange} className={s.exchangeBtn}>
            Создать первый обмен
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <h1 className={s.title}>История</h1>
      <ul className={s.list}>
        {history.map((item) => {
          const status = statusMap[item.status] || statusMap.new;
          const fromIcon =
            icons[item.from_currency] || getDefaultIcon(item.from_currency);
          const toIcon =
            icons[item.to_currency] || getDefaultIcon(item.to_currency);

          return (
            <li key={item.id} className={s.card}>
              <div
                className={s.statusLine}
                style={{ backgroundColor: status.color }}
              />
              <div className={s.amountBlock}>
                <div className={s.row}>
                  {/* <img
                    src={fromIcon}
                    width={20}
                    height={20}
                    alt=""
                    onError={handleImageError}
                  /> */}
                  <span className={s.amount}>
                    {formatAmount(item.amount_give)}{" "}
                    {getShortCurrencyName(item.from_currency)}
                  </span>
                  <span className={s.arrow}>→</span>
                  {/* <img
                    src={toIcon}
                    width={20}
                    height={20}
                    alt=""
                    onError={handleImageError}
                  /> */}
                  <span className={s.amount}>
                    {formatAmount(item.amount_get)}{" "}
                    {getShortCurrencyName(item.to_currency)}
                  </span>
                </div>
                <div className={s.meta}>
                  <span className={s.date}>{formatDate(item.created_at)}</span>
                  <span style={{ color: status.color }}>{status.label}</span>
                </div>
                {item.bid_id && (
                  <div className={s.bidId}>ID: {item.bid_id}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
