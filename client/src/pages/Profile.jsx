import React, { useState, useEffect } from 'react';
import  useAuth  from '../hooks/useAuth';
import  useRequests  from '../hooks/useRequests';
import ProfileHeader from '../components/profile/ProfileHeader';
import RequestsList from '../components/profile/RequestsList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { requests, loading, error, fetchMyRequests, getRequestStats, stats, loadingStats } = useRequests();
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch user requests and stats on component mount
    fetchMyRequests();
    getRequestStats()
  }, [getRequestStats]);

  const handleProfileUpdate = async (profileData) => {
    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !requests.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Messages */}
        {message.text && (
          <div className="mb-6">
            {message.type === 'success' ? (
              <SuccessMessage message={message.text} />
            ) : (
              <ErrorMessage message={message.text} />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="border-t">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-6 py-3 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`w-full text-left px-6 py-3 text-sm font-medium ${
                    activeTab === 'requests'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  My Requests
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-6 py-3 text-sm font-medium ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {loadingStats ? (
                    <div className="col-span-3 flex justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Requests</h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {stats?.totalRequests || 0}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Requests</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {stats?.recentRequests || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
                        <p className="text-3xl font-bold text-purple-600">
                          {stats?.statusBreakdown?.COMPLETED || 0}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Requests */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
                  </div>
                  <div className="p-6">
                    {requests.length > 0 ? (
                      <div className="space-y-4">
                        {requests.slice(0, 5).map((request) => (
                          <div key={request._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                AOI Request - {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(request.dateFrom).toLocaleDateString()} - {new Date(request.dateTo).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No requests found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Requests</h3>
                </div>
                <RequestsList 
                  requests={requests}
                  loading={loading}
                  error={error}
                  onRefresh={fetchMyRequests}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
                </div>
                <ProfileHeader 
                  user={user}
                  onUpdateProfile={handleProfileUpdate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;