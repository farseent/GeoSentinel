import { useRequestContext } from "../context/RequestContext";

// Hook for components to use all request actions/state
const useRequest = () => {
  const {
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
  } = useRequestContext();

  return {
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
  };
};

export default useRequest;