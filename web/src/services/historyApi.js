import authApi from "./authApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class HistoryApiService {
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
          // Token expired or invalid
          authApi.removeToken();
          window.location.href = "/login";
          return;
        }
        throw new Error(data.detail || "Ошибка сервера");
      }

      return data;
    } catch (error) {
      console.error("History API Error:", error);
      throw error;
    }
  }

  // Получить историю обменов пользователя
  async getHistory(page = 0, limit = 50, statusFilter = null) {
    let url = `/history/?skip=${page * limit}&limit=${limit}`;
    if (statusFilter) {
      url += `&status_filter=${encodeURIComponent(statusFilter)}`;
    }
    return this.request(url);
  }

  // Получить детали конкретного обмена
  async getExchangeDetails(exchangeId) {
    return this.request(`/history/${exchangeId}`);
  }

  // Создать запись в истории (обычно вызывается автоматически при создании обмена)
  async createExchangeRecord(exchangeData) {
    return this.request("/history/", {
      method: "POST",
      body: JSON.stringify(exchangeData),
    });
  }

  // Обновить статус обмена
  async updateExchangeStatus(exchangeId, updateData) {
    return this.request(`/history/${exchangeId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }
}

export default new HistoryApiService();
