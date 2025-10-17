import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MapProvider } from "./context/MapContext";
import { RequestProvider } from "./context/RequestContext";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";


import Profile from "./pages/Profile";


function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <RequestProvider>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/verify/:token" element={<VerifyEmail />} />
                <Route path="*" element={<NotFound />} />
                {/* Add other routes here */}
              </Routes>
            </main>
            <Footer />
          </div>
        </RequestProvider>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;