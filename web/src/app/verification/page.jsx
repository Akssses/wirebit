"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import verificationApi from "@/services/verificationApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import s from "@/styles/VerificationPage.module.scss";
import ProtectedRoute from "@/components/ProtectedRoute";

function VerificationPageContent() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const status = await verificationApi.getVerificationStatus();
      setVerificationStatus(status);
    } catch (error) {
      console.error("Error loading verification status:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/gif", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Недопустимый тип файла. Разрешены: GIF, JPG, JPEG, PNG");
      setSelectedFile(null);
      return;
    }

    // Validate file size (128MB)
    const maxSize = 128 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Размер файла превышает 128МБ");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedFile) {
      setError("Пожалуйста, выберите файл");
      return;
    }

    setLoading(true);

    try {
      await verificationApi.submitVerificationRequest(selectedFile);
      toast.success(
        "Заявка на верификацию отправлена! Ожидайте рассмотрения администратором."
      );

      // Reload verification status
      await loadVerificationStatus();

      // Clear form
      setSelectedFile(null);
      e.target.reset();
    } catch (error) {
      console.error("Verification submission error:", error);
      setError(error.message || "Ошибка отправки заявки");
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!verificationStatus) return null;

    switch (verificationStatus.verification_status) {
      case "pending":
        return {
          type: "warning",
          text: "Ваша заявка на верификацию находится в обработке. Ожидайте рассмотрения администратором.",
        };
      case "approved":
        return {
          type: "success",
          text: "Ваш аккаунт успешно верифицирован! Теперь вы можете совершать все виды обменов.",
        };
      case "rejected":
        return {
          type: "error",
          text: "Ваша заявка на верификацию была отклонена. Обратитесь в службу поддержки для уточнения причин.",
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={s.container}>
      <div className={s.content}>
        <h1 className={s.title}>Верифицировать счет</h1>

        {statusMessage && (
          <div className={`${s.statusMessage} ${s[statusMessage.type]}`}>
            {statusMessage.text}
          </div>
        )}

        {verificationStatus?.verification_status === "approved" ? (
          <div className={s.successContent}>
            <div className={s.successIcon}>✓</div>
            <p>Ваш аккаунт верифицирован</p>
            <button
              onClick={() => router.push("/exchange")}
              className={s.continueBtn}
            >
              Перейти к обменам
            </button>
          </div>
        ) : verificationStatus?.verification_status === "pending" ? (
          <div className={s.pendingContent}>
            <div className={s.pendingIcon}>⏳</div>
            <p>Заявка в обработке</p>
            <button
              onClick={() => router.push("/profile")}
              className={s.continueBtn}
            >
              Вернуться в профиль
            </button>
          </div>
        ) : (
          <div className={s.verificationForm}>
            <div className={s.instructions}>
              <h2>Выберите подходящий вариант:</h2>

              <div className={s.option}>
                <h3>Первый вариант — обмен на компьютере.</h3>
                <p>
                  Загрузите фото лицевой стороны карты на фоне экрана сделки. На
                  фото должны быть хорошо видны фамилия и имя, цифры номера
                  карты можно прикрыть.
                </p>
              </div>

              <div className={s.option}>
                <h3>Второй вариант — обмен с телефона.</h3>
                <p>
                  Загрузите фото лицевой стороны карты на фоне листа бумаги,
                  указав номер заявки и дату. На фото должны быть хорошо видны
                  фамилия и имя, цифры номера карты можно прикрыть.
                </p>
              </div>

              <div className={s.fileInfo}>
                <p>
                  <strong>Требования к файлу:</strong>
                </p>
                <p>(.GIF, .JPG, .JPEG, .JPE, .PNG, макс. 128МБ)</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={s.form}>
              <div className={s.fileUpload}>
                <label htmlFor="verificationFile" className={s.fileLabel}>
                  {selectedFile ? selectedFile.name : "Выбрать файл"}
                </label>
                <input
                  type="file"
                  id="verificationFile"
                  accept=".gif,.jpg,.jpeg,.jpe,.png"
                  onChange={handleFileChange}
                  className={s.fileInput}
                  disabled={loading}
                />
              </div>

              {selectedFile && (
                <div className={s.fileInfo}>
                  <p>Выбран файл: {selectedFile.name}</p>
                  <p>
                    Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                  </p>
                </div>
              )}

              {error && <div className={s.error}>{error}</div>}

              <button
                type="submit"
                className={s.submitBtn}
                disabled={!selectedFile || loading}
              >
                {loading ? "Отправка..." : "Отправить запрос"}
              </button>
            </form>
          </div>
        )}
      </div>

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
    </div>
  );
}

export default function VerificationPage() {
  return (
    <ProtectedRoute>
      <VerificationPageContent />
    </ProtectedRoute>
  );
}
