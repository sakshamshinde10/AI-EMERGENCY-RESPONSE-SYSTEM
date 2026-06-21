import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authApi";

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
          logout();
        }
      } catch (error) {
        console.log("Token validation failed:", error.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const login = (tokenValue, userData) => {
    localStorage.setItem("ecp_token", tokenValue);
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("ecp_token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user && !!token;

  // Role-based redirect path
  const getDashboardPath = (role) => {
    switch (role) {
      case "police":
        return "/police";
      case "fire":
        return "/fire";
      case "hospital":
        return "/hospital";
      case "admin":
        return "/admin";
      default:
        return "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
