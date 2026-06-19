import axios from "axios";

// Use relative path through nginx proxy (same domain, no CORS issues)
// Fixed: 2026-06-19 Mixed Content error - ensuring /api/ relative path
const client = axios.create({
  baseURL: "/api/",
});

// Debug: Log the actual baseURL being used
console.log("AXIOSCLIENT-2026-06-19-v2:", client.defaults.baseURL);
console.log("LOCATION:", window.location.origin);

client.interceptors.request.use((config) => {
  console.log("=== AXIOS REQUEST DEBUG ===");
  console.log("baseURL:", config.baseURL);
  console.log("url:", config.url);
  console.log("method:", config.method);
  console.log("full path:", config.baseURL + config.url);
  console.log("client.defaults.baseURL:", client.defaults.baseURL);
  console.log("=========================");
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
