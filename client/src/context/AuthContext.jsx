import React, { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser, logout as apiLogout } from "../utils/auth";

// Create the context
const AuthContext = createContext();

// AuthProvider to wrap around the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // { name, email, ... }
  const [loading, setLoading] = useState(true);  // true while checking session

  // Check for existing session on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const currUser = await getCurrentUser();
      setUser(currUser);
      setLoading(false);
    })();
  }, []);

  // Login handler
  const login = (userData) => setUser(userData);

  // Logout handler
  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuthContext = () => useContext(AuthContext);