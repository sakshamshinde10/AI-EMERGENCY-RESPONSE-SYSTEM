/**
 * Centralized API Configuration
 *
 * In production (Vercel), set the environment variable:
 *   VITE_API_URL=https://ai-emergency-response-system.onrender.com
 *
 * For local development, create a .env.local file in the /client directory:
 *   VITE_API_URL=http://localhost:5000
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const SOCKET_URL = API_BASE_URL;

export const API_AUTH_URL = `${API_BASE_URL}/api/auth`;
export const API_EMERGENCY_URL = `${API_BASE_URL}/api/emergency`;
