import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MapProvider } from "./context/MapContext";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import Home from "./pages/Home";

function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* Add other routes here */}
            </Routes>
          </main>
          <Footer />
        </div>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;