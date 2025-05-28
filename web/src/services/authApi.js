const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class AuthApiService {
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
        throw new Error(data.detail || "Ошибка сервера");
      }

      return data;
    } catch (error) {
      console.error("Auth API Error:", error);
      throw error;
    }
  }

  // Регистрация пользователя
  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Авторизация пользователя
  async login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // Проверка токена и получение данных пользователя
  async getCurrentUser(token) {
    return this.request("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Сохранение токена в localStorage
  saveToken(token) {
    localStorage.setItem("authToken", token);
  }

  // Получение токена из localStorage
  getToken() {
    return localStorage.getItem("authToken");
  }

  // Удаление токена (выход)
  removeToken() {
    localStorage.removeItem("authToken");
  }

  // Проверка авторизации
  isAuthenticated() {
    return !!this.getToken();
  }

  // Получение заголовков с авторизацией
  getAuthHeaders() {
    const token = this.getToken();
    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
  }
}

export default new AuthApiService();
