import { useRequestContext } from "../context/RequestContext";

// Hook for components to use all request actions/state
const useRequest = () => {
  const {
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
  } = useRequestContext();

  return {
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
  };
};

export default useRequest;