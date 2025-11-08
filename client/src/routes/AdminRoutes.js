import { AdminDashboard } from "../pages/Admin/AdminDashboard";
import { UserManagment } from "../pages/Admin/UserManagment";
import { RequestManagment } from "../pages/Admin/RequestManagment";
import { AdminSettings } from "../pages/Admin/AdminSettings";

const AdminRoutes = [
    {path : '/admin/dashboard', element : <AdminDashboard/> },
    {path : '/admin/users', element : <UserManagment/> },
    {path : '/admin/requests', element : <RequestManagment/> },
    {path : '/admin/settings', element : <AdminSettings/> },
]
export default  AdminRoutes;