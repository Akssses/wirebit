import authApi from "./authApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class AdminApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          ...authApi.getAuthHeaders(),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          authApi.removeToken();
          window.location.href = "/login";
          return;
        }
        if (response.status === 403) {
          throw new Error("Доступ запрещен. Требуются права администратора.");
        }
        throw new Error(data.detail || "Ошибка сервера");
      }

      return data;
    } catch (error) {
      console.error("Admin API Error:", error);
      throw error;
    }
  }

  // Get all verification requests
  async getVerificationRequests(statusFilter = null) {
    let url = "/admin/verification-requests";
    if (statusFilter) {
      url += `?status_filter=${encodeURIComponent(statusFilter)}`;
    }
    return this.request(url);
  }

  // Get specific verification request
  async getVerificationRequest(requestId) {
    return this.request(`/admin/verification-requests/${requestId}`);
  }

  // Update verification request status
  async updateVerificationRequest(requestId, updateData) {
    return this.request(`/admin/verification-requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  // Get list of all users
  async getUsers() {
    return this.request("/admin/users");
  }

  // Approve verification request
  async approveVerification(requestId, adminNotes = "") {
    return this.updateVerificationRequest(requestId, {
      status: "approved",
      admin_notes: adminNotes,
    });
  }

  // Reject verification request
  async rejectVerification(requestId, adminNotes = "") {
    return this.updateVerificationRequest(requestId, {
      status: "rejected",
      admin_notes: adminNotes,
    });
  }
}

export default new AdminApiService();
