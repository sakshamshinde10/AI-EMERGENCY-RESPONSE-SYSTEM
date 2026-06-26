import axios from "axios";
import { API_EMERGENCY_URL } from "../config/api";

// Create axios instance for emergency endpoints
const apiClient = axios.create({
  baseURL: API_EMERGENCY_URL,
  timeout: 15000,
});

// Attach JWT token to every request automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ecp_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "Request timed out. Please try again."
        : error.code === "ERR_NETWORK"
        ? "Network error. Please check your connection."
        : "An unexpected error occurred.");
    return Promise.reject(Object.assign(error, { userMessage: message }));
  }
);

// ── Emergency API functions ────────────────────────────────────────────────

export const getPoliceEmergencies = async () => {
  const response = await apiClient.get("/police");
  return response.data;
};

export const getFireEmergencies = async () => {
  const response = await apiClient.get("/fire");
  return response.data;
};

export const getHospitalEmergencies = async () => {
  const response = await apiClient.get("/hospital");
  return response.data;
};

export const getAllEmergencies = async () => {
  const response = await apiClient.get("/all");
  return response.data;
};

export const updateEmergencyStatus = async (id, status, department) => {
  const payload = {};
  if (status !== undefined) payload.status = status;
  if (department !== undefined) payload.department = department;
  const response = await apiClient.patch(`/${id}/status`, payload);
  return response.data;
};

export const createEmergency = async (emergencyData) => {
  const response = await apiClient.post("/", emergencyData);
  return response.data;
};