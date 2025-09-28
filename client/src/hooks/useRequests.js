import { useState, useEffect } from "react";
import api from "../utils/api";
import useAuth from "./useAuth";

// Custom hook for managing AOI/data requests (CRUD)
const useRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all user requests
  // const fetchRequests = async () => {
  //   if (!user) return;
  //   setLoading(true);
  //   try {
  //     const res = await api.get("/requests/my");
  //     setRequests(res.data || []);
  //     setError(null);
  //   } catch (err) {
  //     setError(err.response?.data?.message || "Failed to fetch requests");
  //     setRequests([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Submit a new request (AOI + dateRange)
  const submitRequest = async ({ coordinates, dateFrom, dateTo }) => {
  setLoading(true);
  try {
    const res = await api.post("/requests", { coordinates, dateFrom, dateTo });
    setRequests(prev => [res.data.request, ...prev]); // store new request
    setError(null);
    return { success: true, message: res.data.message, data: res.data.request };
  } catch (err) {
    const errMsg = err.response?.data?.message || "Failed to submit request";
    setError(errMsg);
    return { success: false, message: errMsg, error: err };
  } finally {
    setLoading(false);
  }
};


  // useEffect(() => {
  //   fetchRequests();
  //   // eslint-disable-next-line
  // }, [user]);

  return {
    requests,
    loading,
    error,
    // fetchRequests,
    submitRequest,
  };
};

export default useRequests;