"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import s from "@/styles/ProfilePage.module.scss";
import { useAuth } from "@/contexts/AuthContext";
import historyApi from "@/services/historyApi";
import verificationApi from "@/services/verificationApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiLogOut,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import ProtectedRoute from "@/components/ProtectedRoute";

const statusMap = {
  new: { label: "Новая", color: "#ffb300" },
  pending: { label: "Ожидается", color: "#ffb300" },
  completed: { label: "Завершена", color: "#29b352" },
  cancelled: { label: "Отменена", color: "#e53935" },
  failed: { label: "Неудачная", color: "#e53935" },
};

function ProfilePageContent() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();
  const { user, logout } = useAuth();

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

  const loadVerificationStatus = useCallback(async () => {
    try {
      setVerificationLoading(true);
      const status = await verificationApi.getVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      console.error("Error loading verification status:", error);
    } finally {
      setVerificationLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadVerificationStatus();
  }, [loadHistory, loadVerificationStatus]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success("Вы успешно вышли из аккаунта");
    router.push("/");
  }, [logout, router]);

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

  const getShortCurrencyName = (fullName) => {
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

    if (currencyMap[fullName]) {
      return currencyMap[fullName];
    }

    const words = fullName.split(" ");
    return words[words.length - 1];
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return num.toFixed(2);
  };

  const getVerificationBadge = () => {
    if (verificationLoading) {
      return (
        <span className={s.verificationBadge}>
          <FiClock className={s.icon} />
          Загрузка...
        </span>
      );
    }

    if (!verificationStatus) {
      return (
        <span className={`${s.verificationBadge} ${s.unverified}`}>
          <FiAlertCircle className={s.icon} />
          Не верифицирован
        </span>
      );
    }

    switch (verificationStatus.verification_status) {
      case "approved":
        return (
          <span className={`${s.verificationBadge} ${s.verified}`}>
            <FiCheckCircle className={s.icon} />
            Верифицирован
          </span>
        );
      case "pending":
        return (
          <span className={`${s.verificationBadge} ${s.pending}`}>
            <FiClock className={s.icon} />
            На рассмотрении
          </span>
        );
      case "rejected":
        return (
          <span className={`${s.verificationBadge} ${s.rejected}`}>
            <FiAlertCircle className={s.icon} />
            Отклонено
          </span>
        );
      default:
        return (
          <span className={`${s.verificationBadge} ${s.unverified}`}>
            <FiAlertCircle className={s.icon} />
            Не верифицирован
          </span>
        );
    }
  };

  const shouldShowVerificationBlock = () => {
    if (verificationLoading || !verificationStatus) return true;
    return verificationStatus.verification_status !== "approved";
  };

  const getVerificationBlockContent = () => {
    if (verificationLoading) {
      return {
        title: "Проверка статуса верификации...",
        description: "Загружаем информацию о верификации вашего аккаунта",
        buttonText: "Загрузка...",
        disabled: true,
      };
    }

    if (
      !verificationStatus ||
      verificationStatus.verification_status === "not_requested"
    ) {
      return {
        title: "Ваш аккаунт не верифицирован",
        description:
          "Для проведения операций с рублевыми платежными системами необходимо пройти верификацию. Это займёт всего пару минут.",
        buttonText: "Верифицировать аккаунт",
        disabled: false,
      };
    }

    if (verificationStatus.verification_status === "pending") {
      return {
        title: "Верификация на рассмотрении",
        description:
          "Ваша заявка на верификацию находится в обработке. Ожидайте рассмотрения администратором.",
        buttonText: "Перейти к верификации",
        disabled: false,
      };
    }

    if (verificationStatus.verification_status === "rejected") {
      return {
        title: "Верификация отклонена",
        description:
          "Ваша заявка на верификацию была отклонена. Обратитесь в службу поддержки или подайте новую заявку.",
        buttonText: "Повторить верификацию",
        disabled: false,
      };
    }

    return null;
  };

  const handleRetry = useCallback(() => {
    loadHistory();
  }, [loadHistory]);

  const handleNavigateToExchange = useCallback(() => {
    router.push("/exchange");
  }, [router]);

  const verificationBlockContent = getVerificationBlockContent();

  return (
    <div className={s.wrap}>
      {/* User Profile Section */}
      <div className={s.profile}>
        <div className={s.avatar}>
          <FiUser size={24} />
        </div>
        <div className={s.info}>
          <div className={s.username}>
            {user?.username || "Пользователь"}
            {getVerificationBadge()}
          </div>
          <div className={s.email}>{user?.email || ""}</div>
        </div>
        <button
          className={s.logoutBtn}
          onClick={handleLogout}
          title="Выйти из аккаунта"
        >
          <FiLogOut size={20} />
        </button>
      </div>

      {/* Verification Block */}
      {shouldShowVerificationBlock() && verificationBlockContent && (
        <div className={s.verifyBlock}>
          <div className={s.verifyText}>
            <h2>{verificationBlockContent.title}</h2>
            <p>{verificationBlockContent.description}</p>
          </div>
          <button
            className={s.verifyBtn}
            onClick={() => router.push("/verification")}
            disabled={verificationBlockContent.disabled}
          >
            {verificationBlockContent.buttonText}
          </button>
        </div>
      )}

      {/* Exchange History Section */}
      <h1 className={s.title}>История обменов</h1>

      {loading ? (
        <div className={s.loading}>Загрузка истории...</div>
      ) : error ? (
        <div className={s.error}>
          {error}
          <button onClick={handleRetry} style={{ marginLeft: "10px" }}>
            Попробовать снова
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className={s.emptyState}>
          <p>У вас пока нет истории обменов</p>
          <button onClick={handleNavigateToExchange} className={s.exchangeBtn}>
            Создать первый обмен
          </button>
        </div>
      ) : (
        <ul className={s.list}>
          {history.map((item) => {
            const status = statusMap[item.status] || statusMap.new;
            return (
              <li key={item.id} className={s.card}>
                <div
                  className={s.statusLine}
                  style={{ backgroundColor: status.color }}
                />
                <div className={s.amountBlock}>
                  <div className={s.row}>
                    <span className={s.amount}>
                      {formatAmount(item.amount_give)}{" "}
                      {getShortCurrencyName(item.from_currency)}
                    </span>
                    <span className={s.arrow}>→</span>
                    <span className={s.amount}>
                      {formatAmount(item.amount_get)}{" "}
                      {getShortCurrencyName(item.to_currency)}
                    </span>
                  </div>
                  <div className={s.meta}>
                    <span className={s.date}>
                      {formatDate(item.created_at)}
                    </span>
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
      )}

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

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
