import authApi from "./authApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://freedurov.lol/api";

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          // Add auth headers if user is logged in
          ...(authApi.isAuthenticated() ? authApi.getAuthHeaders() : {}),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Ошибка сервера");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Получить все направления обмена
  async getDirections() {
    try {
      const response = await this.request("/directions");
      // Backend returns the correct format directly
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Error loading directions:", error);
      return [];
    }
  }

  // Получить список валют для отправки
  async getCurrencies() {
    try {
      const response = await this.request("/currencies");
      // Backend returns array directly, no need to extract .data
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Error loading currencies:", error);
      return [];
    }
  }

  // Получить доступные валюты для получения
  async getAvailableTo(fromCurrency) {
    try {
      const response = await this.request(
        `/available-to?from=${encodeURIComponent(fromCurrency)}`
      );
      // Backend returns array directly, no need to extract .data
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Error loading available currencies:", error);
      return [];
    }
  }

  // Создать заявку на обмен (теперь поддерживает аутентификацию)
  async createExchange(data) {
    const response = await this.request("/create-exchange", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Backend returns the correct format, just return as-is
    return response;
  }

  // Получить статус заявки
  async getStatus(bidId) {
    return this.request(`/status?bid_id=${encodeURIComponent(bidId)}`);
  }
}

export default new ApiService();
