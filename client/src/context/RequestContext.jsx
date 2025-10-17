import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { requestsAPI } from "../utils/api"; // ✅ import your axios API file

const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const clearErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // ✅ Fetch all requests for the current user
  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestsAPI.getMyRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Create a new AOI request
  const createRequest = async (payload) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await requestsAPI.create(payload);
      const newRequest = res.data.request;
      setRequests((prev) => [newRequest, ...prev]);      
      setSuccessMessage(res.data.message)
      return { success: true, request: newRequest };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setErrorMessage(msg);
      setSuccessMessage(null);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete a request
  const deleteRequest = async (requestId) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await requestsAPI.delete(requestId);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setErrorMessage(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };


const getRequestStats = useCallback(async () => {
  setLoadingStats(true);
  setErrorMessage(null);
  try {
    const res = await requestsAPI.getRequestStats(); // ✅ Axios returns res.data directly
    setStats(res.data);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    setErrorMessage(msg);
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
        stats,
        errorMessage,
        successMessage,
        loadingStats,
        getRequestStats,
        fetchMyRequests,
        createRequest,
        deleteRequest,
        setRequests,
        clearSuccessMessage, 
        clearErrorMessage,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

// ✅ Custom hook to use the context
export const useRequestContext = () => useContext(RequestContext);
