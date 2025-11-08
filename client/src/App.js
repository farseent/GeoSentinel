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

import UserLayout from "./components/Layout/UserLayout";

import AdminRoutes from "./routes/AdminRoutes";
import UserRoutes from "./routes/UserRoutes";

import UserProtected from "./components/protected/UserProtected";
import AdminProtected from "./components/protected/AdminProtected";
import UnauthorizedPage from "./pages/UnauthorizedPage";


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
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFound />} />
              <Route element={<UserProtected />}>
                {UserRoutes.map(({path, element}, idx) =>(
                  <Route key={idx} path={path} element={element} /> 
                ))}
              </Route>
            </Route>
            
            <Route element = {<AdminProtected />}>
              {AdminRoutes.map(({path, element}, idx) =>(
                <Route key={idx} path={path} element={element} /> 
              ))}
            </Route>
          </Routes>
        </RequestProvider>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;