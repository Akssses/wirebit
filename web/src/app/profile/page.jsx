"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import s from "@/styles/ProfilePage.module.scss";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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

const getStatusMap = (t) => ({
  new: { label: t("profile.status.new"), color: "#ffb300" },
  pending: { label: t("profile.status.pending"), color: "#ffb300" },
  processing: { label: t("profile.status.processing"), color: "#4ade80" },
  completed: { label: t("profile.status.completed"), color: "#29b352" },
  cancelled: { label: t("profile.status.cancelled"), color: "#e53935" },
  rejected: { label: t("profile.status.rejected"), color: "#e53935" },
  failed: { label: t("profile.status.failed"), color: "#e53935" },
});

// Exchange Details Modal Component
function ExchangeDetailsModal({ exchange, onClose }) {
  const { t } = useLanguage();
  if (!exchange) return null;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusText = (status) => {
    const statusMap = getStatusMap(t);
    return statusMap[status]?.label || status;
  };

  const getStatusColor = (status) => {
    const statusMap = getStatusMap(t);
    return statusMap[status]?.color || "#ffb300";
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.detailsModal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h3>{t("profile.exchangeDetails.title", { id: exchange.id })}</h3>
          <button className={s.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={s.modalBody}>
          <div className={s.detailsGrid}>
            <div className={s.detailSection}>
              <h4>{t("profile.exchangeDetails.exchangeInfo")}</h4>
              {exchange.bid_id && (
                <div className={s.detailItem}>
                  <label>{t("profile.exchangeDetails.bidId")}</label>
                  <span>{exchange.bid_id}</span>
                </div>
              )}
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.direction")}</label>
                <span>
                  {exchange.from_currency} → {exchange.to_currency}
                </span>
              </div>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.sendAmount")}</label>
                <span>
                  {exchange.amount_give} {exchange.from_currency}
                </span>
              </div>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.receiveAmount")}</label>
                <span>
                  {exchange.amount_get.toFixed(6)} {exchange.to_currency}
                </span>
              </div>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.rate")}</label>
                <span>{exchange.exchange_rate}</span>
              </div>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.status")}</label>
                <span
                  className={s.statusBadge}
                  style={{ backgroundColor: getStatusColor(exchange.status) }}
                >
                  {getStatusText(exchange.status)}
                </span>
              </div>
            </div>

            <div className={s.detailSection}>
              <h4>{t("profile.exchangeDetails.transactionDetails")}</h4>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.email")}</label>
                <span>{exchange.email_used}</span>
              </div>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.receiveAddress")}</label>
                <span className={s.address}>{exchange.wallet_address}</span>
              </div>
              {exchange.payment_address && (
                <div className={s.detailItem}>
                  <label>{t("profile.exchangeDetails.paymentAddress")}</label>
                  <span className={s.address}>{exchange.payment_address}</span>
                </div>
              )}
            </div>

            <div className={s.detailSection}>
              <h4>{t("profile.exchangeDetails.timestamps")}</h4>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.created")}</label>
                <span>{formatDate(exchange.created_at)}</span>
              </div>
              <div className={s.detailItem}>
                <label>{t("profile.exchangeDetails.updated")}</label>
                <span>{formatDate(exchange.updated_at)}</span>
              </div>
            </div>

            {exchange.wirebit_url && (
              <div className={s.detailSection}>
                <h4>{t("profile.exchangeDetails.additional")}</h4>
                <div className={s.detailItem}>
                  <label>{t("profile.exchangeDetails.wirebitLink")}</label>
                  <a
                    href={exchange.wirebit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.wirebitLink}
                  >
                    {t("profile.exchangeDetails.openInWirebit")} →
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
  const { t } = useLanguage();
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
      setError(t("profile.errors.historyLoadFailed"));
      toast.error(t("profile.errors.historyLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    toast.success(t("profile.logoutSuccess"));
    router.push("/");
  }, [logout, router, t]);

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
          {t("profile.verification.loading")}
        </span>
      );
    }

    if (!verificationStatus) {
      return (
        <span className={`${s.verificationBadge} ${s.unverified}`}>
          <FiAlertCircle className={s.icon} />
          {t("profile.verification.notVerified")}
        </span>
      );
    }

    switch (verificationStatus.verification_status) {
      case "approved":
        return (
          <span className={`${s.verificationBadge} ${s.verified}`}>
            <FiCheckCircle className={s.icon} />
            {t("profile.verification.verified")}
          </span>
        );
      case "pending":
        return (
          <span className={`${s.verificationBadge} ${s.pending}`}>
            <FiClock className={s.icon} />
            {t("profile.verification.pending")}
          </span>
        );
      case "rejected":
        return (
          <span className={`${s.verificationBadge} ${s.rejected}`}>
            <FiAlertCircle className={s.icon} />
            {t("profile.verification.rejected")}
          </span>
        );
      default:
        return (
          <span className={`${s.verificationBadge} ${s.unverified}`}>
            <FiAlertCircle className={s.icon} />
            {t("profile.verification.notVerified")}
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
        title: t("profile.verification.checkingStatus"),
        description: t("profile.verification.loadingInfo"),
        buttonText: t("profile.verification.loading"),
        disabled: true,
      };
    }

    if (
      !verificationStatus ||
      verificationStatus.verification_status === "not_requested"
    ) {
      return {
        title: t("profile.verification.notVerifiedTitle"),
        description: t("profile.verification.notVerifiedDesc"),
        buttonText: t("profile.verification.verifyButton"),
        disabled: false,
      };
    }

    if (verificationStatus.verification_status === "pending") {
      return {
        title: t("profile.verification.pendingTitle"),
        description: t("profile.verification.pendingDesc"),
        buttonText: t("profile.verification.checkStatus"),
        disabled: false,
      };
    }

    if (verificationStatus.verification_status === "rejected") {
      return {
        title: t("profile.verification.rejectedTitle"),
        description: t("profile.verification.rejectedDesc"),
        buttonText: t("profile.verification.retryButton"),
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
            {user?.username || t("profile.defaultUsername")}
            {getVerificationBadge()}
          </div>
          <div className={s.email}>{user?.email || ""}</div>
        </div>
        <button
          className={s.logoutBtn}
          onClick={handleLogout}
          title={t("common.logout")}
        >
          <FiLogOut size={20} />
        </button>
      </div>

      {/* Admin Panel Buttons */}
      {isAdmin() && (
        <div className={s.adminPanel}>
          <h3>{t("profile.adminPanel")}</h3>
          <div className={s.adminButtons}>
            <button
              className={s.adminBtn}
              onClick={() => router.push("/admin")}
            >
              <FiSettings size={20} />
              <span>{t("profile.adminDashboard")}</span>
            </button>
            <button
              className={s.adminBtn}
              onClick={() => router.push("/admin/exchanges")}
            >
              <FiTrendingUp size={20} />
              <span>{t("profile.manageExchanges")}</span>
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
      <h1 className={s.title}>{t("profile.history")}</h1>

      {loading ? (
        <div className={s.loading}>{t("profile.loadingHistory")}</div>
      ) : error ? (
        <div className={s.error}>
          {error}
          <button onClick={handleRetry} className={s.retryButton}>
            {t("profile.retry")}
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className={s.emptyState}>
          <p>{t("profile.noHistory")}</p>
          <button onClick={handleNavigateToExchange} className={s.exchangeBtn}>
            {t("profile.createFirstExchange")}
          </button>
        </div>
      ) : (
        <ul className={s.list}>
          {history.map((item) => {
            const statusMap = getStatusMap(t);
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
