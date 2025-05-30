import authApi from "./authApi";

const API_BASE_URL = "https://freedurov.lol";

class AdminApi {
  getHeaders() {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getVerificationRequests() {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/verification-requests`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch verification requests");
    }

    return response.json();
  }

  async getAllVerificationRequests() {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/verification-requests/all`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.detail || "Failed to fetch all verification requests"
      );
    }

    return response.json();
  }

  async approveVerification(requestId, comment = "") {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/verification-requests/${requestId}/approve`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to approve verification");
    }

    return response.json();
  }

  async rejectVerification(requestId, comment = "") {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/verification-requests/${requestId}/reject`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to reject verification");
    }

    return response.json();
  }

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch users");
    }

    return response.json();
  }

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch stats");
    }

    return response.json();
  }

  // Exchange management methods
  async getAllExchanges({ skip = 0, limit = 50, status_filter = "" } = {}) {
    const params = new URLSearchParams();
    if (skip) params.append("skip", skip);
    if (limit) params.append("limit", limit);
    if (status_filter) params.append("status_filter", status_filter);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/exchanges?${params.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch exchanges");
    }

    return response.json();
  }

  async getExchangeDetails(exchangeId) {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/exchanges/${exchangeId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch exchange details");
    }

    return response.json();
  }

  async updateExchangeStatus(exchangeId, statusData) {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/exchanges/${exchangeId}/status`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(statusData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update exchange status");
    }

    return response.json();
  }
}

export default new AdminApi();
