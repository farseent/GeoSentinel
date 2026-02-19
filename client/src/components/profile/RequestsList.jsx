// RequestsList.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { ChevronDownIcon, ArrowPathIcon, MapIcon, DocumentArrowDownIcon, DocumentDuplicateIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const RequestsList = ({ requests, loading, error, onRefresh }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const statusColors = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
  };

  const calculateArea = (coordinates) => {
    if (!coordinates) return 0;
    const { north, south, east, west } = coordinates;
    const latDiff = Math.abs(north - south);
    const lonDiff = Math.abs(east - west);
    return (latDiff * lonDiff).toFixed(2);
  };

  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request._id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <ErrorMessage message={error} />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
        >
          Try Again
        </motion.button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-12 text-center"
      >
        <div className="h-32 w-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <MagnifyingGlassIcon className="h-16 w-16 text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No requests yet</h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Start by creating your first AOI request from the home page. Track all your requests here once created.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
        >
          Create your first request
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900">
            Request History <span className="text-sm font-normal text-gray-400 ml-2">({requests.length} total)</span>
          </h3>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
              <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Refresh */}
            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* Active filters */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-xs text-gray-400">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                Search: {searchTerm}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                Status: {statusFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Requests list */}
      <div className="p-6 space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No requests match your filters</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const colors = statusColors[request.status] || statusColors.PENDING;
            return (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all"
              >
                {/* Request header - always visible */}
                <div
                  className="p-4 bg-white cursor-pointer"
                  onClick={() => setSelectedRequest(selectedRequest === request._id ? null : request._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Status dot */}
                      <div className={`h-3 w-3 rounded-full ${colors.dot}`}></div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">
                            AOI Request #{request._id.slice(-6).toUpperCase()}
                          </h4>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {new Date(request.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <motion.div
                      animate={{ rotate: selectedRequest === request._id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {selectedRequest === request._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-100 bg-gray-50"
                    >
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Coordinates */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Coordinates</h5>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="grid grid-cols-2 gap-3">
                                {request.coordinates && (
                                  <>
                                    <div>
                                      <p className="text-xs text-gray-400">North</p>
                                      <p className="text-sm font-mono text-gray-900">{request.coordinates.north?.toFixed(6)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400">South</p>
                                      <p className="text-sm font-mono text-gray-900">{request.coordinates.south?.toFixed(6)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400">East</p>
                                      <p className="text-sm font-mono text-gray-900">{request.coordinates.east?.toFixed(6)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400">West</p>
                                      <p className="text-sm font-mono text-gray-900">{request.coordinates.west?.toFixed(6)}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Request Details</h5>
                            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                              <div>
                                <p className="text-xs text-gray-400">Request ID</p>
                                <p className="text-sm font-mono text-gray-900 break-all">{request._id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Date Range</p>
                                <p className="text-sm text-gray-900">
                                  {new Date(request.dateFrom).toLocaleDateString()} - {new Date(request.dateTo).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Area Size</p>
                                <p className="text-sm text-gray-900">{calculateArea(request.coordinates)} km²</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm text-sm"
                          >
                            <MapIcon className="h-4 w-4" />
                            <span>View on Map</span>
                          </motion.button>
                          
                          {request.status === 'COMPLETED' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm text-sm"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              <span>Download Results</span>
                            </motion.button>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            <span>Copy Coordinates</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredRequests.length >= 10 && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Previous
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm"
            >
              Next
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsList;