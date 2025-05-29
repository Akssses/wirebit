import authApi from "./authApi";

const API_BASE_URL = "http://localhost:8000";

class HistoryApi {
  getHeaders() {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getHistory({ skip = 0, limit = 50, status_filter = "" } = {}) {
    return this.getUserHistory({ skip, limit, status_filter });
  }

  async getUserHistory({ skip = 0, limit = 50, status_filter = "" } = {}) {
    const params = new URLSearchParams();
    if (skip) params.append("skip", skip);
    if (limit) params.append("limit", limit);
    if (status_filter) params.append("status_filter", status_filter);

    const response = await fetch(
      `${API_BASE_URL}/api/history?${params.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch exchange history");
    }

    return response.json();
  }

  async getExchangeDetails(exchangeId) {
    const response = await fetch(`${API_BASE_URL}/api/history/${exchangeId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch exchange details");
    }

    return response.json();
  }

  async createExchangeRecord(exchangeData) {
    const response = await fetch(`${API_BASE_URL}/api/history`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(exchangeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create exchange record");
    }

    return response.json();
  }
}

export default new HistoryApi();
