import { useAuth as useAuthFromContext } from "../context/AuthContext";

const useAuth = () => {
  const { user, loading, login, logout, isAuthenticated } = useAuthFromContext();

  return { user, loading, login, logout, isAuthenticated };
};

export default useAuth;
