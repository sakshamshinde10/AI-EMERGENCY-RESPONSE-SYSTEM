import axios from "axios";

const API = "http://localhost:5000/api/emergency";

// Create axios instance with auth header interceptor
const apiClient = axios.create({
  baseURL: API,
});

// Attach JWT token to every request if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ecp_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

export const updateEmergencyStatus = async (id, status) => {
  const response = await apiClient.patch(
    `/${id}/status`,
    { status }
  );

  return response.data;
};

export const createEmergency = async (emergencyData) => {
  const response = await apiClient.post("/", emergencyData);
  return response.data;
};