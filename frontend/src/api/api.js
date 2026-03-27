import axios from "axios";

const rawApiRoot = typeof import.meta !== "undefined" ? String(import.meta.env.VITE_API_URL || "").trim() : "";
const normalizedRoot = rawApiRoot.replace(/\/+$/, "").replace(/\/api$/i, "");

export const API_BASE_URL = normalizedRoot ? `${normalizedRoot}/api` : "/api";
const TOKEN_KEY = "strumify_token";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

export const readAuthToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
};

export const setAuthToken = (token) => {
  const normalizedToken = typeof token === "string" ? token.trim() : "";

  if (typeof window !== "undefined") {
    if (normalizedToken) {
      localStorage.setItem(TOKEN_KEY, normalizedToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  if (normalizedToken) {
    axiosClient.defaults.headers.common.Authorization = `Bearer ${normalizedToken}`;
  } else {
    delete axiosClient.defaults.headers.common.Authorization;
  }
};

axiosClient.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("strumify:unauthorized"));
    }

    return Promise.reject(error);
  }
);

setAuthToken(readAuthToken());

export const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) return responseMessage;

  const genericMessage = error?.message;
  if (typeof genericMessage === "string" && genericMessage.trim()) return genericMessage;

  return fallback;
};
