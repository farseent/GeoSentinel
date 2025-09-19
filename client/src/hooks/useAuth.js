import { useContext } from "react";
import { useAuthContext } from "../context/AuthContext";

// Custom hook for authentication
const useAuth = () => {
  const { user, loading, login, logout } = useAuthContext();

  // isAuthenticated = true if user object exists
  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
};

export default useAuth;