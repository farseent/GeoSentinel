import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const UserProtected = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  // Must be logged in AND role must be user
  if (!isAuthenticated || user?.role !== "user") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default UserProtected;
