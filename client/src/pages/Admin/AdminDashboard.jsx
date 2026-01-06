// FILE: client/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      if (err.response?.status === 403) {
        navigate('/unauthorized');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800',
      Failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const { summary, recentRequests, recentUsers } = stats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={summary.totalUsers}
          icon="👥"
          color="blue"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Total Requests"
          value={summary.totalRequests}
          icon="📊"
          color="green"
          onClick={() => navigate('/admin/requests')}
        />
        <StatCard
          title="Pending Requests"
          value={summary.pendingRequests}
          icon="⏳"
          color="yellow"
          onClick={() => navigate('/admin/requests?status=Pending')}
        />
        <StatCard
          title="Blocked Users"
          value={summary.blockedUsers}
          icon="🚫"
          color="red"
          onClick={() => navigate('/admin/users?status=blocked')}
        />
      </div>

      {/* Request Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Request Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {summary.pendingRequests}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {summary.processingRequests}
            </div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {summary.completedRequests}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {summary.failedRequests}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Requests</h2>
            <button
              onClick={() => navigate('/admin/requests')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentRequests.slice(0, 5).map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                onClick={() => navigate('/admin/requests')}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {request.user?.name || 'Unknown User'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Users</h2>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                onClick={() => navigate('/admin/users')}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]} rounded-full w-16 h-16 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;