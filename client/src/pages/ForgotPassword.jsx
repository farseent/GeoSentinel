import React from "react";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <ForgotPasswordModal onClose={() => window.history.back()} />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;