import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // just reject, don’t force redirect
//       console.warn("401 Unauthorized - user not logged in");
//     }
//     return Promise.reject(error);
//   }
// );

// Authentication API endpoints
export const authAPI = {
  // User signup
  signup: (userData) => {
    return api.post('/auth/signup', userData);
  },

  // User login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // User logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Check authentication status
  checkAuth: () => {
    return api.get('/auth/me');
  },

  // Refresh token (if using JWT)
  refreshToken: () => {
    return api.post('/auth/refresh');
  },

  // Request password reset
  requestPasswordReset: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token, newPassword) => {
    return api.post('/auth/reset-password', { token, newPassword });
  },
};

// AOI Requests API endpoints
export const requestsAPI = {
  // Create new AOI request
  create: (requestData) => {
    return api.post('/requests', requestData);
  },

  // Get user's requests
  getUserRequests: (userId) => {
    return api.get(`/requests/user/${userId}`);
  },

  // Get all user's requests (for current user)
  getMyRequests: () => {
    return api.get('/requests/my');
  },

  // Get specific request
  getById: (requestId) => {
    return api.get(`/requests/${requestId}`);
  },

  // Update request status (admin only)
  updateStatus: (requestId, status) => {
    return api.patch(`/requests/${requestId}/status`, { status });
  },

  // Delete request
  delete: (requestId) => {
    return api.delete(`/requests/${requestId}`);
  },
};

// User profile API endpoints
export const userAPI = {
  // Get user profile
  getProfile: () => {
    return api.get('/users/profile');
  },

  // Update user profile
  updateProfile: (userData) => {
    return api.patch('/users/profile', userData);
  },

  // Change password
  changePassword: (passwordData) => {
    return api.patch('/users/change-password', passwordData);
  },

  // Delete account
  deleteAccount: () => {
    return api.delete('/users/account');
  },
};

// Admin API endpoints (if needed)
export const adminAPI = {
  // Get all users
  getAllUsers: () => {
    return api.get('/admin/users');
  },

  // Get all requests
  getAllRequests: () => {
    return api.get('/admin/requests');
  },

  // Update user status
  updateUserStatus: (userId, status) => {
    return api.patch(`/admin/users/${userId}/status`, { status });
  },

  // Delete user
  deleteUser: (userId) => {
    return api.delete(`/admin/users/${userId}`);
  },
};

// Map/GIS API endpoints
export const mapAPI = {
  // Get available satellite data sources
  getDataSources: () => {
    return api.get('/map/data-sources');
  },

  // Validate AOI coordinates
  validateAOI: (coordinates) => {
    return api.post('/map/validate-aoi', { coordinates });
  },

  // Get map tiles or data for preview
  getMapPreview: (bounds) => {
    return api.post('/map/preview', { bounds });
  },
};

export default api;