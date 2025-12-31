import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MapProvider } from "./context/MapContext";
import { RequestProvider } from "./context/RequestContext";


import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Profile from "./pages/Profile";

import  AdminDashboard  from "./pages/Admin/AdminDashboard";
import  UserManagment  from "./pages/Admin/UserManagment";
import  RequestManagment  from "./pages/Admin/RequestManagment";
import  AdminSettings  from "./pages/Admin/AdminSettings";

import UserLayout from "./components/Layout/UserLayout";
import AdminLayout from "./components/Layout/AdminLayout";

import UserProtected from "./components/protected/UserProtected";
import AdminProtected from "./components/protected/AdminProtected";


function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <RequestProvider>
          <Routes>
            <Route element={<UserLayout/>} >
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFound />} />

              <Route element={<UserProtected />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

            </Route>
            <Route element={<AdminProtected />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagment />} />
                  <Route path="requests" element={<RequestManagment />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
            </Route>
          </Routes>
        </RequestProvider>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;