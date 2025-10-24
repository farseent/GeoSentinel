import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MapProvider } from "./context/MapContext";
import { RequestProvider } from "./context/RequestContext";

// import Navbar from "./components/common/Navbar";
// import Footer from "./components/common/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


import Profile from "./pages/Profile";
import UserLayout from "./components/Layout/UserLayout";


function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <RequestProvider>
          <Routes>
            <Route element={<UserLayout/>}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </RequestProvider>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;