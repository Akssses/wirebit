const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка сервера");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Получить все направления обмена
  async getDirections() {
    return this.request("/directions");
  }

  // Получить список валют для отправки
  async getCurrencies() {
    return this.request("/currencies");
  }

  // Получить доступные валюты для получения
  async getAvailableTo(fromCurrency) {
    return this.request(
      `/available-to?from=${encodeURIComponent(fromCurrency)}`
    );
  }

  // Создать заявку на обмен
  async createExchange(data) {
    const response = await this.request("/create-exchange", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  }

  // Получить статус заявки
  async getStatus(bidId) {
    return this.request(`/status?bid_id=${encodeURIComponent(bidId)}`);
  }
}

export default new ApiService();
