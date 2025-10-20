import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 15000
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config.__retryCount >= 2) {
      return Promise.reject(error);
    }
    config.__retryCount = (config.__retryCount ?? 0) + 1;
    await new Promise((resolve) => setTimeout(resolve, 500 * config.__retryCount));
    return apiClient(config);
  }
);

export { apiClient };
