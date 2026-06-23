import axios from "axios";
import { API_AUTH_URL } from "../config/api";

// Axios instance for auth endpoints
const authClient = axios.create({
  baseURL: API_AUTH_URL,
  timeout: 15000,
});

/**
 * Login with username and password.
 * Returns { success, data: { token, user } }
 */
export const loginUser = async (username, password) => {
  try {
    const response = await authClient.post("/login", { username, password });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "Request timed out. Please try again."
        : "Unable to connect to the server. Please check your connection.");
    throw Object.assign(error, { userMessage: message });
  }
};

/**
 * Register a new user.
 * Returns { success, data: { token, user } }
 */
export const registerUser = async (userData) => {
  try {
    const response = await authClient.post("/register", userData);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Registration failed. Please try again.";
    throw Object.assign(error, { userMessage: message });
  }
};

/**
 * Fetch the currently authenticated user profile.
 * Returns { success, data: user }
 */
export const getCurrentUser = async (token) => {
  try {
    const response = await authClient.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Session validation failed. Please log in again.";
    throw Object.assign(error, { userMessage: message });
  }
};

/**
 * Logout the current user (server-side token invalidation if supported).
 * Safe to call even if the server doesn't have a logout endpoint.
 */
export const logoutUser = async (token) => {
  try {
    await authClient.post(
      "/logout",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch {
    // Logout failure is non-critical; local state will still be cleared
  }
};
