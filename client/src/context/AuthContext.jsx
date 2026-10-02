import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentUser } from "../services/authApi";
import { disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ecp_token"));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser(token);
        if (response.success) {
          setUser(response.data);
        } else {
          logoutInternal();
        }
      } catch (error) {
        logoutInternal();
      } finally {
        setLoading(false);
      }
    };

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const logoutInternal = () => {
    localStorage.removeItem("ecp_token");
    setToken(null);
    setUser(null);
  };

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem("ecp_token", tokenValue);
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    // Clean up any active socket connection on logout
    disconnectSocket();
    logoutInternal();
  }, []);

  const isAuthenticated = !!user && !!token;

  // Role-based redirect path
  const getDashboardPath = useCallback((role) => {
    switch (role) {
      case "police": return "/police";
      case "fire":   return "/fire";
      case "hospital": return "/hospital";
      case "admin":  return "/admin";
      default:       return "/login";
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    getDashboardPath,
  }), [user, token, loading, isAuthenticated, login, logout, getDashboardPath]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
