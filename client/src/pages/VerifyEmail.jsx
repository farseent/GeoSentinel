// frontend/src/pages/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../utils/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SuccessMessage from "../components/common/SuccessMessage";
import ErrorMessage from "../components/common/ErrorMessage";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await axios.get(`/auth/verify/${token}`);
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed or expired.");
      }
    };

    verify();
  }, [token]);

  if (status === "loading") return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full text-center">
        {status === "success" ? (
          <SuccessMessage message={message} />
        ) : (
          <ErrorMessage message={message} />
        )}

        {status === "success" ? (
          <a
            href="/login"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        ) : (
          <a
            href="/signup"
            className="mt-4 inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Try Again
          </a>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
