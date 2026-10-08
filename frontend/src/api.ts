import axios from "axios";

const tokenStorageKey = "cultural-expense-auth-token";
const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(tokenStorageKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/login") &&
      !error.config?.url?.startsWith("/auth/register")
    ) {
      sessionStorage.removeItem(tokenStorageKey);
      window.dispatchEvent(new Event("cultural-expense-auth-expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
