import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-gray-700 hover:bg-indigo-100"
    }`;

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-indigo-600">
          GeoSentinel Admin
        </h2>
      </div>

      <nav className="p-4 space-y-2">
        <NavLink to="/admin/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/admin/users" className={linkClass}>
          User Management
        </NavLink>

        <NavLink to="/admin/requests" className={linkClass}>
          Request Management
        </NavLink>

        <NavLink to="/admin/settings" className={linkClass}>
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100 transition"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
