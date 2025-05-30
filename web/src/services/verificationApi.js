import authApi from "./authApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://freedurov.lol/api";

class VerificationApiService {
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
        throw new Error(data.detail || "Ошибка сервера");
      }

      return data;
    } catch (error) {
      console.error("Verification API Error:", error);
      throw error;
    }
  }

  // Check if verification is required for exchange
  async checkVerificationRequired(fromCurrency, toCurrency) {
    const formData = new FormData();
    formData.append("from_currency", fromCurrency);
    formData.append("to_currency", toCurrency);

    return this.request("/verification/check-required", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        Authorization: authApi.getAuthHeaders().Authorization,
      },
    });
  }

  // Get user verification status
  async getVerificationStatus() {
    return this.request("/verification/status");
  }

  // Submit verification request with file
  async submitVerificationRequest(file) {
    const formData = new FormData();
    formData.append("file", file);

    return this.request("/verification/submit", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        Authorization: authApi.getAuthHeaders().Authorization,
      },
    });
  }
}

export default new VerificationApiService();
