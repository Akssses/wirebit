"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import verificationApi from "@/services/verificationApi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import s from "@/styles/VerificationPage.module.scss";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLanguage } from "@/contexts/LanguageContext";

function VerificationPageContent() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

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
      setError(t("verification.errors.invalidFileType"));
      setSelectedFile(null);
      return;
    }

    // Validate file size (128MB)
    const maxSize = 128 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t("verification.errors.fileTooLarge"));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedFile) {
      setError(t("verification.errors.fileRequired"));
      return;
    }

    setLoading(true);

    try {
      await verificationApi.submitVerificationRequest(selectedFile);
      toast.success(t("verification.submitSuccess"));

      // Reload verification status
      await loadVerificationStatus();

      // Clear form
      setSelectedFile(null);
      e.target.reset();
    } catch (error) {
      console.error("Verification submission error:", error);
      setError(error.message || t("verification.errors.submitFailed"));
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
          text: t("profile.verification.pendingDesc"),
        };
      case "approved":
        return {
          type: "success",
          text: t("verification.approvedMessage"),
        };
      case "rejected":
        return {
          type: "error",
          text: t("profile.verification.rejectedDesc"),
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={s.container}>
      <div className={s.content}>
        <h1 className={s.title}>{t("verification.title")}</h1>

        {statusMessage && (
          <div className={`${s.statusMessage} ${s[statusMessage.type]}`}>
            {statusMessage.text}
          </div>
        )}

        {verificationStatus?.verification_status === "approved" ? (
          <div className={s.successContent}>
            <div className={s.successIcon}>✓</div>
            <p>{t("profile.verification.verified")}</p>
            <button
              onClick={() => router.push("/exchange")}
              className={s.continueBtn}
            >
              {t("verification.goToExchange")}
            </button>
          </div>
        ) : verificationStatus?.verification_status === "pending" ? (
          <div className={s.pendingContent}>
            <div className={s.pendingIcon}>⏳</div>
            <p>{t("profile.verification.pending")}</p>
            <button
              onClick={() => router.push("/profile")}
              className={s.continueBtn}
            >
              {t("verification.backToProfile")}
            </button>
          </div>
        ) : (
          <div className={s.verificationForm}>
            <div className={s.instructions}>
              <h2>{t("verification.chooseOption")}</h2>

              <div className={s.option}>
                <h3>{t("verification.optionOne.title")}</h3>
                <p>{t("verification.optionOne.description")}</p>
              </div>

              <div className={s.option}>
                <h3>{t("verification.optionTwo.title")}</h3>
                <p>{t("verification.optionTwo.description")}</p>
              </div>

              <div className={s.fileInfo}>
                <p>
                  <strong>{t("verification.fileRequirements")}:</strong>
                </p>
                <p>{t("verification.fileFormats")}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={s.form}>
              <div className={s.fileUpload}>
                <label htmlFor="verificationFile" className={s.fileLabel}>
                  {selectedFile
                    ? selectedFile.name
                    : t("verification.selectFile")}
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
                  <p>
                    {t("verification.selectedFile")}: {selectedFile.name}
                  </p>
                  <p>
                    {t("verification.fileSize")}:{" "}
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              )}

              {error && <div className={s.error}>{error}</div>}

              <button
                type="submit"
                className={s.submitBtn}
                disabled={!selectedFile || loading}
              >
                {loading ? t("common.loading") : t("verification.submit")}
              </button>
            </form>
          </div>
        )}
      </div>

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

export default function VerificationPage() {
  return (
    <ProtectedRoute>
      <VerificationPageContent />
    </ProtectedRoute>
  );
}
