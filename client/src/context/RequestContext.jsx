import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { requestsAPI } from "../utils/api"; // ✅ import your axios API file

const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);


  // ✅ Fetch all requests for the current user
  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestsAPI.getMyRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Create a new AOI request
  const createRequest = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestsAPI.create(payload);
      const newRequest = res.data.request;
      setRequests((prev) => [newRequest, ...prev]);
      return { success: true, request: newRequest };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete a request
  const deleteRequest = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      await requestsAPI.delete(requestId);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };


const getRequestStats = useCallback(async () => {
  setLoadingStats(true);
  setError(null);
  try {
    const res = await requestsAPI.getRequestStats(); // ✅ Axios returns res.data directly
    setStats(res.data);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    setError(msg);
    return null;
  } finally {
    setLoadingStats(false);
  }
}, []);


  // ✅ Fetch requests on mount
  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  return (
    <RequestContext.Provider
      value={{
        requests,
        loading,
        error,
        stats,
        loadingStats,
        getRequestStats,
        fetchMyRequests,
        createRequest,
        deleteRequest,
        setRequests,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

// ✅ Custom hook to use the context
export const useRequestContext = () => useContext(RequestContext);
