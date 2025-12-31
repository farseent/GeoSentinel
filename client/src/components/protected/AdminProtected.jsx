import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminProtected = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  // Must be logged in AND role must be admin
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminProtected;
