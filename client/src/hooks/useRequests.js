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
  const submitRequest = async ({ aoi, dateRange }) => {
    setLoading(true);
    try {
      const res = await api.post("/requests", { aoi, dateRange });
      setRequests(prev => [res.data, ...prev]); // Optimistically prepend
      setError(null);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
      return { success: false, error: err };
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