import ProtectedRoute from "./ProtectedRoute";
import { Outlet } from "react-router-dom";

const AdminProtected = () => {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <Outlet />
        </ProtectedRoute>
    );
}

export default AdminProtected;