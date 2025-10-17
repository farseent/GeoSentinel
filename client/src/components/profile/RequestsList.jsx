import React, { useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const RequestsList = ({ requests, loading, error, onRefresh }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateArea = (coordinates) => {
    if (!coordinates) return 0;
    const { north, south, east, west } = coordinates;
    const latDiff = Math.abs(north - south);
    const lonDiff = Math.abs(east - west);
    // Approximate area calculation
    return (latDiff * lonDiff).toFixed(6);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-24 w-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
        <p className="text-gray-500">Start by creating your first AOI request from the home page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Request History ({requests.length} total)
        </h3>
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
            onClick={() => setSelectedRequest(selectedRequest === request._id ? null : request._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">
                    AOI Request #{request._id.slice(-6).toUpperCase()}
                  </h4>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${selectedRequest === request._id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedRequest === request._id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Coordinates</h5>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">North:</span> {request.coordinates?.north?.toFixed(6)}</div>
                        <div><span className="font-medium">South:</span> {request.coordinates?.south?.toFixed(6)}</div>
                        <div><span className="font-medium">East:</span> {request.coordinates?.east?.toFixed(6)}</div>
                        <div><span className="font-medium">West:</span> {request.coordinates?.west?.toFixed(6)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Request Details</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Request ID:</span>
                        <p className="font-mono text-gray-800">{request._id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <p className="text-gray-800">{request.status}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Last Updated:</span>
                        <p className="text-gray-800">
                          {new Date(request.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra Info */}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Date Range:</span>
                    <p>{new Date(request.dateFrom).toLocaleDateString()} - {new Date(request.dateTo).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p>{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Area:</span>
                    <p>{calculateArea(request.coordinates)} sq degrees</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    View on Map
                  </button>
                  {request.status === 'COMPLETED' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Download Results
                    </button>
                  )}
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Copy Coordinates
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {requests.length >= 10 && (
        <div className="mt-6 flex justify-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestsList;