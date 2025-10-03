import React from "react";
import { FaMapMarkerAlt, FaHome, FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    // In your actual app, replace with navigate("/") or window.location.href = "/"
    console.log("Navigate to home");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Globe Icon */}
        <div className="mb-8 relative">
          <div className="inline-block relative">
            <FaMapMarkerAlt className="w-32 h-32 text-blue-600 animate-bounce" />
            <div className="absolute inset-0 bg-blue-500 opacity-10 blur-3xl rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-8xl md:text-9xl font-bold text-gray-900 mb-4 tracking-tight">
          404
        </h1>

        {/* Error Message */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
          Location Not Found
        </h2>
        
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          Oops! It seems you've wandered outside our mapped territory. 
          The page you're looking for doesn't exist in our database.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg w-full sm:w-auto"
          >
            <FaArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg w-full sm:w-auto"
          >
            <FaHome className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-sm text-gray-500">
          Error Code: <span className="text-blue-600 font-mono">404_LOCATION_NOT_MAPPED</span>
        </p>
      </div>

      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
    </div>
  );
}
