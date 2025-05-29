"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import adminApi from "@/services/adminApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import s from "@/styles/AdminPage.module.scss";
import {
  FiUsers,
  FiUserCheck,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiEye,
} from "react-icons/fi";
import { MdSwapHoriz } from "react-icons/md";

function AdminPageContent() {
  const [activeTab, setActiveTab] = useState("pending");
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");

  const router = useRouter();
  const { user } = useAuth();

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

    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRequests, allRequestsData, usersData, statsData] =
        await Promise.all([
          adminApi.getVerificationRequests(),
          adminApi.getAllVerificationRequests(),
          adminApi.getUsers(),
          adminApi.getStats(),
        ]);

      setVerificationRequests(pendingRequests);
      setAllRequests(allRequestsData);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading admin data:", error);
      if (error.message.includes("Admin access required")) {
        toast.error("Доступ запрещен. Требуются права администратора.");
        router.push("/");
      } else {
        toast.error("Ошибка загрузки данных");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setModalAction("approve");
    setComment("");
    setShowModal(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setModalAction("reject");
    setComment("");
    setShowModal(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === "approve") {
        await adminApi.approveVerification(selectedRequest.id, comment);
        toast.success("Верификация одобрена");
      } else {
        await adminApi.rejectVerification(selectedRequest.id, comment);
        toast.success("Верификация отклонена");
      }

      setShowModal(false);
      setSelectedRequest(null);
      setComment("");
      loadData();
    } catch (error) {
      toast.error("Ошибка при обработке заявки");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className={`${s.badge} ${s.approved}`}>
            <FiCheckCircle /> Одобрено
          </span>
        );
      case "rejected":
        return (
          <span className={`${s.badge} ${s.rejected}`}>
            <FiXCircle /> Отклонено
          </span>
        );
      case "pending":
        return (
          <span className={`${s.badge} ${s.pending}`}>
            <FiClock /> Ожидает
          </span>
        );
      default:
        return (
          <span className={`${s.badge} ${s.unknown}`}>
            <FiAlertTriangle /> Неизвестно
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className={s.wrapper}>
        <div className={s.loading}>Загрузка админской панели...</div>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <div className={s.header}>
        <h1 className={s.title}>Админская панель</h1>
        <div className={s.userInfo}>Добро пожаловать, {user?.username}!</div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <FiUsers className={s.statIcon} />
            <div className={s.statInfo}>
              <span className={s.statNumber}>{stats.total_users}</span>
              <span className={s.statLabel}>Всего пользователей</span>
            </div>
          </div>
          <div className={s.statCard}>
            <FiUserCheck className={s.statIcon} />
            <div className={s.statInfo}>
              <span className={s.statNumber}>{stats.verified_users}</span>
              <span className={s.statLabel}>Верифицированных</span>
            </div>
          </div>
          <div className={s.statCard}>
            <FiClock className={s.statIcon} />
            <div className={s.statInfo}>
              <span className={s.statNumber}>
                {stats.pending_verifications}
              </span>
              <span className={s.statLabel}>Ожидают верификации</span>
            </div>
          </div>
          <div className={s.statCard}>
            <FiAlertTriangle className={s.statIcon} />
            <div className={s.statInfo}>
              <span className={s.statNumber}>{stats.unverified_users}</span>
              <span className={s.statLabel}>Не верифицированных</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={s.quickActions}>
        <h2 className={s.sectionTitle}>Быстрые действия</h2>
        <div className={s.actionsGrid}>
          <button
            className={s.actionCard}
            onClick={() => router.push("/admin/exchanges")}
          >
            <MdSwapHoriz className={s.actionIcon} />
            <span className={s.actionLabel}>Управление обменами</span>
            <span className={s.actionDescription}>
              Просмотр и изменение статусов обменов
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${activeTab === "pending" ? s.active : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Ожидают проверки ({verificationRequests.length})
        </button>
        <button
          className={`${s.tab} ${activeTab === "all" ? s.active : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Все заявки ({allRequests.length})
        </button>
        <button
          className={`${s.tab} ${activeTab === "users" ? s.active : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Пользователи ({users.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className={s.tabContent}>
        {activeTab === "pending" && (
          <div className={s.requestsList}>
            {verificationRequests.length === 0 ? (
              <div className={s.emptyState}>
                <p>Нет заявок, ожидающих проверки</p>
              </div>
            ) : (
              verificationRequests.map((request) => (
                <div key={request.id} className={s.requestCard}>
                  <div className={s.requestHeader}>
                    <div className={s.userInfo}>
                      <strong>{request.username}</strong>
                      <span>{request.email}</span>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className={s.requestDetails}>
                    <p>
                      <strong>Дата подачи:</strong>{" "}
                      {formatDate(request.created_at)}
                    </p>
                    <p>
                      <strong>Файл:</strong> {request.file_path}
                    </p>
                  </div>

                  <div className={s.requestActions}>
                    <button
                      className={`${s.actionBtn} ${s.approve}`}
                      onClick={() => handleApproveRequest(request)}
                    >
                      <FiCheckCircle /> Одобрить
                    </button>
                    <button
                      className={`${s.actionBtn} ${s.reject}`}
                      onClick={() => handleRejectRequest(request)}
                    >
                      <FiXCircle /> Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "all" && (
          <div className={s.requestsList}>
            {allRequests.map((request) => (
              <div key={request.id} className={s.requestCard}>
                <div className={s.requestHeader}>
                  <div className={s.userInfo}>
                    <strong>{request.username}</strong>
                    <span>{request.email}</span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className={s.requestDetails}>
                  <p>
                    <strong>Дата подачи:</strong>{" "}
                    {formatDate(request.created_at)}
                  </p>
                  {request.updated_at && (
                    <p>
                      <strong>Дата обработки:</strong>{" "}
                      {formatDate(request.updated_at)}
                    </p>
                  )}
                  <p>
                    <strong>Файл:</strong> {request.file_path}
                  </p>
                  {request.admin_comment && (
                    <p>
                      <strong>Комментарий:</strong> {request.admin_comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div className={s.usersList}>
            {users.map((user) => (
              <div key={user.id} className={s.userCard}>
                <div className={s.userInfo}>
                  <strong>{user.username}</strong>
                  <span>{user.email}</span>
                </div>
                <div className={s.userDetails}>
                  <span
                    className={user.is_verified ? s.verified : s.unverified}
                  >
                    {user.is_verified ? "Верифицирован" : "Не верифицирован"}
                  </span>
                  <span className={s.date}>
                    Регистрация: {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <h3>
              {modalAction === "approve"
                ? "Одобрить заявку"
                : "Отклонить заявку"}
            </h3>
            <p>
              Пользователь: <strong>{selectedRequest?.username}</strong>
            </p>
            <textarea
              className={s.commentInput}
              placeholder="Комментарий (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className={s.modalActions}>
              <button className={s.confirmBtn} onClick={confirmAction}>
                {modalAction === "approve" ? "Одобрить" : "Отклонить"}
              </button>
              <button
                className={s.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
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

export default function AdminPage() {
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

  return <AdminPageContent />;
}
