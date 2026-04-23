// ProfileHeader.jsx
import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { validateEmail } from '../../utils/validation';
import { PencilIcon,  CheckIcon,  XMarkIcon, EnvelopeIcon, UserIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../utils/api';
import { validatePassword, validatePasswordMatch, validateRequired } from '../../utils/validation';

const ProfileHeader = ({ user, onUpdateProfile }) => {
  // const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
  const newErrors = {};

  // Current password validation
  const currentCheck = validateRequired(passwordData.currentPassword, "Current password");
  if (!currentCheck.isValid) {
    newErrors.currentPassword = currentCheck.message;
  }

  // New password validation
  const passwordCheck = validatePassword(passwordData.newPassword);
  if (!passwordCheck.isValid) {
    newErrors.newPassword = passwordCheck.message;
  }

  // Confirm password validation
  const matchCheck = validatePasswordMatch(
    passwordData.newPassword,
    passwordData.confirmPassword
  );
  if (!matchCheck.isValid) {
    newErrors.confirmPassword = matchCheck.message;
  }

  setPasswordErrors(newErrors);

  if (Object.keys(newErrors).length > 0) return;

  try {
    setPasswordLoading(true);

    const res = await authAPI.changePassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    // ✅ Show success message
    setPasswordMessage({
      type: "success",
      text: res.data.message || "Password updated successfully"
    });

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    setShowPasswordForm(false);

  } catch (err) {
    setPasswordMessage({
      type: "error",
      text: err.response?.data?.message || "Failed to update password"
    });

    setPasswordErrors({
      general: err.response?.data?.message
    });

  } finally {
    setPasswordLoading(false);
  }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-400 rounded-full border-2 border-white"></div>
          </motion.div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            {user?.isAdmin && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                Administrator
              </span>
            )}
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex gap-3">
            {/* Edit Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit Profile</span>
            </motion.button>

            {/* Change Password */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Change Password</span>
            </motion.button>
          </div>
        )}
      </div>
        
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-2"
                  >
                    {errors.name}
                  </motion.p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-2"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Cancel</span>
              </motion.button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <InfoRow 
              icon={UserIcon}
              label="Full Name"
              value={user?.name}
            />
            <InfoRow 
              icon={EnvelopeIcon}
              label="Email Address"
              value={user?.email}
            />
            <InfoRow 
              icon={ShieldCheckIcon}
              label="Account Type"
              value={user?.isAdmin ? 'Administrator' : 'Standard User'}
            />
            <InfoRow 
              icon={CalendarIcon}
              label="Member Since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
            />
          </motion.div>
        )}
      </AnimatePresence>
          {passwordMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg text-sm font-medium border ${
                passwordMessage.type === "success"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              <span>{passwordMessage.text}</span>

              {/* ❌ Close Button */}
              <button
                onClick={() => setPasswordMessage(null)}
                className="ml-4 text-gray-400 hover:text-gray-600 transition"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </motion.div>
          )}
      <AnimatePresence>
        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Current Password */}
              <input
                type="password"
                placeholder="Current Password"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 ${
                  passwordErrors.currentPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
              />

              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {passwordErrors.currentPassword}
                </p>
              )}

              {/* New Password */}
              <input
                type="password"
                placeholder="New Password"
                className={`w-full px-4 py-3 border rounded-xl ${
                  passwordErrors.newPassword
                    ? 'border-red-300'
                    : 'border-gray-200'
                }`}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />

              {passwordErrors.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {passwordErrors.newPassword}
                </p>
              )}

              {/* Confirm Password */}
              <input
                type="password"
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 border rounded-xl ${
                  passwordErrors.confirmPassword
                    ? 'border-red-300'
                    : 'border-gray-200'
                }`}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                />

                {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {passwordErrors.confirmPassword}
                </p>
                )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>

              <button
                onClick={() => setShowPasswordForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl"
              >
                Cancel
              </button>
            </div>

            {/* <p className="text-xs text-gray-500 mt-2">
              Forgot your current password?{" "}
              <span
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Reset it here
              </span>
            </p> */}
        
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default ProfileHeader;