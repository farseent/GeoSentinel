import ProtectedRoute from "./ProtectedRoute";
import { Outlet } from "react-router-dom";

const UserProtected = () => {
    return (
        <ProtectedRoute allowedRoles={['user']}>
            <Outlet />
        </ProtectedRoute>
    );
}

export default UserProtected;