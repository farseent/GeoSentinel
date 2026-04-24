import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSearchParams } from 'react-router-dom';

// User Detail Modal Component
const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null;

  const fields = [
    { label: 'Full Name', value: user.name, icon: '👤' },
    { label: 'Email', value: user.email, icon: '✉️' },
    { label: 'Phone', value: user.phone, icon: '📞' },
    { label: 'Date of Birth', value: user.dob ? new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—', icon: '🎂' },
    { label: 'Address', value: user.address, icon: '📍' },
    { label: 'Role', value: user.role?.charAt(0).toUpperCase() + user.role?.slice(1), icon: '🔖' },
    { label: 'Status', value: user.isBlocked ? 'Blocked' : 'Active', icon: '🔒', isStatus: true, blocked: user.isBlocked },
    { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—', icon: '📅' },
    ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-2 border-white border-opacity-40">
                <span className="text-white text-2xl font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-white text-xl font-bold leading-tight">{user.name}</h2>
                <p className="text-blue-100 text-sm mt-0.5">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white text-opacity-80 hover:text-opacity-100 hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3">
            {fields.map(({ label, value, icon, isStatus, blocked }) => (
              <div key={label} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-lg mt-0.5 flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  {isStatus ? (
                    <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {value}
                    </span>
                  ) : (
                    <p className="text-sm text-gray-800 mt-0.5 break-words">{value || '—'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* User ID (subtle, at bottom) */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              <span className="font-semibold">User ID:</span>{' '}
              <span className="font-mono">{user._id}</span>
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null); // ← new state for detail modal

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, status: statusFilter };
      if (search) params.search = search;
      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.pages);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleUserBlock = async (userId, currentStatus) => {
    try {
      await adminAPI.toggleUserBlock(userId);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, isBlocked: !currentStatus } : user
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.deleteUser(selectedUser._id);
      setUsers(users.filter(user => user._id !== selectedUser._id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <div className="text-sm text-gray-600">
          Total: {users.length > 0 ? totalPages * 10 : 0} users
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearch} className="col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Search
              </button>
            </div>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSearchParams({ status: e.target.value }); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="blocked">Blocked Users</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setViewUser(user)} // ← click row to open detail modal
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleUserBlock(user._id, user.isBlocked); }} // ← stop row click
                      className={`mr-3 ${user.isBlocked ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}`}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowDeleteModal(true); }} // ← stop row click
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && !loading && (
          <div className="text-center py-12"><p className="text-gray-500">No users found</p></div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            Next
          </button>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
              This will also delete all their requests. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;