// Profile.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import useRequests from '../hooks/useRequests';
import ProfileHeader from '../components/profile/ProfileHeader';
import RequestsList from '../components/profile/RequestsList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import {  ClipboardDocumentListIcon,  Cog6ToothIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { requests, loading, error, fetchMyRequests, getRequestStats, stats, loadingStats } = useRequests();
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMyRequests();
    getRequestStats();
  }, [getRequestStats, fetchMyRequests]);

  const handleProfileUpdate = async (profileData) => {
    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: '✨ Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'requests', label: 'Requests', icon: ClipboardDocumentListIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const statsCards = [
    { 
      label: 'Total Requests', 
      value: stats?.totalRequests || 0, 
      color: 'from-blue-500 to-blue-600',
      icon: ClipboardDocumentListIcon,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Recent Requests', 
      value: stats?.recentRequests || 0, 
      subtext: 'Last 30 days',
      color: 'from-green-500 to-green-600',
      icon: ArrowPathIcon,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Completed', 
      value: stats?.statusBreakdown?.COMPLETED || 0, 
      color: 'from-purple-500 to-purple-600',
      icon: ChartBarIcon,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
  ];

  if (loading && !requests.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Animated Messages */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              {message.type === 'success' ? (
                <SuccessMessage message={message.text} />
              ) : (
                <ErrorMessage message={message.text} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Glassmorphism Effect */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden sticky top-8">
              {/* User Profile Summary */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <div className="h-16 w-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white font-bold text-2xl">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{user?.name}</h3>
                    <p className="text-sm text-blue-100 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${
                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        activeTab === tab.id ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {tab.label}
                      </span>
                      {tab.id === 'requests' && requests.length > 0 && (
                        <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {requests.length}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="p-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Quick Stats
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Account type</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      user?.isAdmin 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user?.isAdmin ? 'Admin' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingStats ? (
                      <div className="col-span-3 flex justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      statsCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                              </div>
                              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                            {stat.subtext && (
                              <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Recent Requests */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="p-6">
                      {requests.length > 0 ? (
                        <div className="space-y-4">
                          {requests.slice(0, 3).map((request, index) => (
                            <motion.div
                              key={request._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    AOI Request #{request._id.slice(-6).toUpperCase()}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  request.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                  request.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                                  request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="h-20 w-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="text-gray-500">No requests yet</p>
                          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Create your first request
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RequestsList 
                    requests={requests}
                    loading={loading}
                    error={error}
                    onRefresh={fetchMyRequests}
                  />
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <ProfileHeader 
                    user={user}
                    onUpdateProfile={handleProfileUpdate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;