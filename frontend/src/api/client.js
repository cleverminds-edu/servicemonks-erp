import axios from "axios";

// Use HTTPS backend URL directly to avoid proxy issues
const client = axios.create({
  baseURL: "https://servicemonks-erp-production.up.railway.app/api/",
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;
