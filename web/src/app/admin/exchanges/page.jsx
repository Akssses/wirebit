"use client";

import { useState, useEffect } from "react";
import {
  FiEye,
  FiEdit3,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiUser,
} from "react-icons/fi";
import cx from "classnames";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import s from "@/styles/AdminExchanges.module.scss";
import adminApi from "@/services/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

function StatusModal({ exchange, onClose, onStatusUpdate }) {
  const [newStatus, setNewStatus] = useState(exchange?.status || "");
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: "new", label: "Новая заявка" },
    { value: "pending", label: "В обработке" },
    { value: "processing", label: "Обрабатывается" },
    { value: "completed", label: "Выполнена" },
    { value: "cancelled", label: "Отменена" },
    { value: "rejected", label: "Отклонена" },
  ];

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === exchange.status) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await adminApi.updateExchangeStatus(exchange.id, { status: newStatus });
      toast.success(`Статус обмена #${exchange.id} обновлен`);
      onStatusUpdate(exchange.id, newStatus);
      onClose();
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    } finally {
      setLoading(false);
    }
  };

  if (!exchange) return null;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.statusModal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h3>Изменить статус обмена #{exchange.id}</h3>
          <button className={s.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={s.modalBody}>
          <div className={s.exchangeInfo}>
            <p>
              <strong>Пользователь:</strong> {exchange.username}
            </p>
            <p>
              <strong>Обмен:</strong> {exchange.amount_give}{" "}
              {exchange.from_currency} → {exchange.amount_get.toFixed(6)}{" "}
              {exchange.to_currency}
            </p>
            <p>
              <strong>Текущий статус:</strong> {exchange.status}
            </p>
          </div>

          <div className={s.statusSelect}>
            <label>Новый статус:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={s.modalActions}>
            <button
              className={s.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              className={s.updateBtn}
              onClick={handleUpdateStatus}
              disabled={loading || newStatus === exchange.status}
            >
              {loading ? "Обновление..." : "Обновить статус"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
              <div className={s.detailItem}>
                <label>ID заявки Wirebit</label>
                <span>{exchange.bid_id || "—"}</span>
              </div>
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
            </div>

            <div className={s.detailSection}>
              <h4>Информация о пользователе</h4>
              <div className={s.detailItem}>
                <label>Пользователь</label>
                <span>{exchange.username}</span>
              </div>
              <div className={s.detailItem}>
                <label>Email пользователя</label>
                <span>{exchange.user_email}</span>
              </div>
              <div className={s.detailItem}>
                <label>Email для обмена</label>
                <span>{exchange.email_used}</span>
              </div>
              <div className={s.detailItem}>
                <label>Адрес получения</label>
                <span className={s.address}>{exchange.wallet_address}</span>
              </div>
            </div>

            <div className={s.detailSection}>
              <h4>Дополнительные данные</h4>
              {exchange.payment_address && (
                <div className={s.detailItem}>
                  <label>Адрес для оплаты</label>
                  <span className={s.address}>{exchange.payment_address}</span>
                </div>
              )}
              {exchange.wirebit_url && (
                <div className={s.detailItem}>
                  <label>Ссылка Wirebit</label>
                  <a
                    href={exchange.wirebit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Открыть в Wirebit
                  </a>
                </div>
              )}
              <div className={s.detailItem}>
                <label>Создан</label>
                <span>{formatDate(exchange.created_at)}</span>
              </div>
              <div className={s.detailItem}>
                <label>Обновлен</label>
                <span>{formatDate(exchange.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminExchangesContent() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [statusModalExchange, setStatusModalExchange] = useState(null);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (!user) return;

    const adminEmails = ["admin@gmail.com"];
    const adminUsernames = ["admin", "administrator", "wirebit_admin"];

    if (
      !adminEmails.includes(user.email) &&
      !adminUsernames.includes(user.username)
    ) {
      toast.error("Доступ запрещен. Требуются права администратора.");
      router.push("/");
      return;
    }

    loadExchanges();
  }, [user, router, statusFilter]);

  const loadExchanges = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllExchanges({
        status_filter: statusFilter,
      });
      setExchanges(data);
    } catch (error) {
      toast.error("Ошибка загрузки обменов");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (exchangeId, newStatus) => {
    setExchanges((prev) =>
      prev.map((exchange) =>
        exchange.id === exchangeId
          ? { ...exchange, status: newStatus }
          : exchange
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "new":
        return <FiClock className={s.statusIcon} />;
      case "pending":
        return <FiAlertTriangle className={s.statusIcon} />;
      case "processing":
        return <FiAlertTriangle className={s.statusIcon} />;
      case "completed":
        return <FiCheckCircle className={s.statusIcon} />;
      case "cancelled":
      case "rejected":
        return <FiXCircle className={s.statusIcon} />;
      default:
        return <FiClock className={s.statusIcon} />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      new: "Новая заявка",
      pending: "В обработке",
      processing: "Обрабатывается",
      completed: "Выполнена",
      cancelled: "Отменена",
      rejected: "Отклонена",
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={s.loading}>
        <div className={s.spinner}></div>
        <p>Загрузка обменов...</p>
      </div>
    );
  }

  return (
    <>
      <div className={s.container}>
        <div className={s.header}>
          <h1 className={s.title}>Управление обменами</h1>
          <div className={s.adminInfo}>
            Администратор: <span>{user?.username}</span>
          </div>
        </div>

        <div className={s.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={s.statusFilter}
          >
            <option value="">Все статусы</option>
            <option value="new">Новые</option>
            <option value="pending">В обработке</option>
            <option value="processing">Обрабатываются</option>
            <option value="completed">Выполнены</option>
            <option value="cancelled">Отменены</option>
            <option value="rejected">Отклонены</option>
          </select>
        </div>

        {exchanges.length === 0 ? (
          <div className={s.empty}>
            <p>Обменов не найдено</p>
          </div>
        ) : (
          <div className={s.exchangesTable}>
            {exchanges.map((exchange) => (
              <div
                key={exchange.id}
                className={s.tableRow}
                data-status={exchange.status}
              >
                <div className={s.cardHeader}>
                  <span className={s.exchangeId}>#{exchange.id}</span>
                  <div className={s.actions}>
                    <button
                      className={s.viewBtn}
                      onClick={() => setSelectedExchange(exchange)}
                      title="Просмотр деталей"
                    >
                      <FiEye />
                    </button>
                    <button
                      className={s.editBtn}
                      onClick={() => setStatusModalExchange(exchange)}
                      title="Изменить статус"
                    >
                      <FiEdit3 />
                    </button>
                  </div>
                </div>

                <div className={s.userInfo}>
                  <div className={s.userIcon}>
                    <FiUser />
                  </div>
                  <div className={s.userDetails}>
                    <div className={s.username}>{exchange.username}</div>
                    <div className={s.email}>{exchange.user_email}</div>
                  </div>
                </div>

                <div className={s.exchangeDetails}>
                  <div className={s.exchangeRoute}>
                    <div className={s.amounts}>
                      <span>
                        {exchange.amount_give} {exchange.from_currency}
                      </span>
                      <span>→</span>
                      <span>
                        {exchange.amount_get.toFixed(4)} {exchange.to_currency}
                      </span>
                    </div>
                  </div>
                  <div className={s.rate}>Курс: {exchange.exchange_rate}</div>
                </div>

                <div className={s.cardFooter}>
                  <div className={s.statusContainer}>
                    <div className={cx(s.status, s[exchange.status])}>
                      {getStatusIcon(exchange.status)}
                      <span>{getStatusText(exchange.status)}</span>
                    </div>
                    <span className={s.date}>
                      {formatDate(exchange.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedExchange && (
        <ExchangeDetailsModal
          exchange={selectedExchange}
          onClose={() => setSelectedExchange(null)}
        />
      )}

      {statusModalExchange && (
        <StatusModal
          exchange={statusModalExchange}
          onClose={() => setStatusModalExchange(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default function AdminExchangesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "#fff",
          fontSize: "18px",
        }}
      >
        Проверка авторизации...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AdminExchangesContent />;
}
