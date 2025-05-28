"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import api from "@/services/api";
import s from "@/styles/StatusChecker.module.scss";

export default function StatusChecker() {
  const [bidId, setBidId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    if (!bidId.trim()) {
      toast.error("Введите ID заявки");
      return;
    }

    setLoading(true);
    try {
      const result = await api.getStatus(bidId);

      if (result.success) {
        setStatus(result);
        toast.success("Статус получен");
      } else {
        toast.error(result.message || "Ошибка получения статуса");
        setStatus(null);
      }
    } catch (error) {
      toast.error(error.message || "Ошибка при проверке статуса");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "#2196F3",
      pending: "#FF9800",
      processing: "#FF9800",
      completed: "#4CAF50",
      cancelled: "#F44336",
      rejected: "#F44336",
    };
    return colors[status] || "#666";
  };

  return (
    <div className={s.container}>
      <h2 className={s.title}>Проверить статус заявки</h2>

      <div className={s.inputGroup}>
        <input
          type="text"
          placeholder="Введите ID заявки"
          value={bidId}
          onChange={(e) => setBidId(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && checkStatus()}
        />
        <button onClick={checkStatus} disabled={loading}>
          {loading ? "Проверка..." : "Проверить"}
        </button>
      </div>

      {status && (
        <div className={s.statusCard}>
          <div className={s.statusHeader}>
            <span>Статус заявки:</span>
            <span
              className={s.statusBadge}
              style={{ backgroundColor: getStatusColor(status.status) }}
            >
              {status.message}
            </span>
          </div>

          {status.data && (
            <div className={s.statusDetails}>
              {status.data.amount && (
                <div className={s.detailRow}>
                  <span>Сумма:</span>
                  <span>{status.data.amount}</span>
                </div>
              )}
              {status.data.created_at && (
                <div className={s.detailRow}>
                  <span>Создана:</span>
                  <span>
                    {new Date(status.data.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
