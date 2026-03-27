import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5001").trim();
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
export const API_URL = normalizedApiUrl.endsWith("/api") ? normalizedApiUrl : `${normalizedApiUrl}/api`;

export const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

export const setAuthToken = (token) => {
  if (token) {
    axiosClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common.Authorization;
  }
};

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("strumify:unauthorized"));
    }

    return Promise.reject(error);
  }
);
