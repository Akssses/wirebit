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
  FiSettings,
  FiTrendingUp,
} from "react-icons/fi";
import ProtectedRoute from "@/components/ProtectedRoute";

const statusMap = {
  new: { label: "Новая", color: "#ffb300" },
  pending: { label: "Ожидается", color: "#ffb300" },
  processing: { label: "Обрабатывается", color: "#4ade80" },
  completed: { label: "Завершена", color: "#29b352" },
  cancelled: { label: "Отменена", color: "#e53935" },
  rejected: { label: "Отклонена", color: "#e53935" },
  failed: { label: "Неудачная", color: "#e53935" },
};

// Exchange Details Modal Component
function ExchangeDetailsModal({ exchange, onClose }) {
  if (!exchange) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status) => {
    return statusMap[status]?.label || status;
  };

  const getStatusColor = (status) => {
    return statusMap[status]?.color || "#ffb300";
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.detailsModal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h3>Детали обмена #{exchange.id}</h3>
          <button className={s.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={s.modalBody}>
          <div className={s.detailsGrid}>
            <div className={s.detailSection}>
              <h4>Информация об обмене</h4>
              {exchange.bid_id && (
                <div className={s.detailItem}>
                  <label>ID заявки</label>
                  <span>{exchange.bid_id}</span>
                </div>
              )}
              <div className={s.detailItem}>
                <label>Направление</label>
                <span>
                  {exchange.from_currency} → {exchange.to_currency}
                </span>
              </div>
              <div className={s.detailItem}>
                <label>Сумма отправки</label>
                <span>
                  {exchange.amount_give} {exchange.from_currency}
                </span>
              </div>
              <div className={s.detailItem}>
                <label>Сумма получения</label>
                <span>
                  {exchange.amount_get.toFixed(6)} {exchange.to_currency}
                </span>
              </div>
              <div className={s.detailItem}>
                <label>Курс обмена</label>
                <span>{exchange.exchange_rate}</span>
              </div>
              <div className={s.detailItem}>
                <label>Статус</label>
                <span
                  className={s.statusBadge}
                  style={{ backgroundColor: getStatusColor(exchange.status) }}
                >
                  {getStatusText(exchange.status)}
                </span>
              </div>
            </div>

            <div className={s.detailSection}>
              <h4>Детали транзакции</h4>
              <div className={s.detailItem}>
                <label>Email для обмена</label>
                <span>{exchange.email_used}</span>
              </div>
              <div className={s.detailItem}>
                <label>Адрес получения</label>
                <span className={s.address}>{exchange.wallet_address}</span>
              </div>
              {exchange.payment_address && (
                <div className={s.detailItem}>
                  <label>Адрес для оплаты</label>
                  <span className={s.address}>{exchange.payment_address}</span>
                </div>
              )}
            </div>

            <div className={s.detailSection}>
              <h4>Временные метки</h4>
              <div className={s.detailItem}>
                <label>Создан</label>
                <span>{formatDate(exchange.created_at)}</span>
              </div>
              <div className={s.detailItem}>
                <label>Обновлен</label>
                <span>{formatDate(exchange.updated_at)}</span>
              </div>
            </div>

            {exchange.wirebit_url && (
              <div className={s.detailSection}>
                <h4>Дополнительно</h4>
                <div className={s.detailItem}>
                  <label>Ссылка Wirebit</label>
                  <a
                    href={exchange.wirebit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.wirebitLink}
                  >
                    Открыть в Wirebit →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [selectedExchange, setSelectedExchange] = useState(null);
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

  // Check if user is admin
  const isAdmin = () => {
    if (!user) return false;
    const adminEmails = ["admin@gmail.com"];
    const adminUsernames = ["admin", "administrator", "wirebit_admin"];
    return (
      adminEmails.includes(user.email) || adminUsernames.includes(user.username)
    );
  };

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

      {/* Admin Panel Buttons */}
      {isAdmin() && (
        <div className={s.adminPanel}>
          <h3>Панель администратора</h3>
          <div className={s.adminButtons}>
            <button
              className={s.adminBtn}
              onClick={() => router.push("/admin")}
            >
              <FiSettings size={20} />
              <span>Админ-панель</span>
            </button>
            <button
              className={s.adminBtn}
              onClick={() => router.push("/admin/exchanges")}
            >
              <FiTrendingUp size={20} />
              <span>Управление обменами</span>
            </button>
          </div>
        </div>
      )}

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
              <li
                key={item.id}
                className={s.card}
                onClick={() => setSelectedExchange(item)}
                style={{ cursor: "pointer" }}
              >
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

      {/* Exchange Details Modal */}
      {selectedExchange && (
        <ExchangeDetailsModal
          exchange={selectedExchange}
          onClose={() => setSelectedExchange(null)}
        />
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
