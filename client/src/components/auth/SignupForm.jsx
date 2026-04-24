import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validation';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();

  const countryCodes = [
    { code: '+91',  label: 'India (+91)',    minLen: 10, maxLen: 10, placeholder: '98765 43210' },
    { code: '+1',   label: 'USA (+1)',        minLen: 10, maxLen: 10, placeholder: '202 555 0147' },
    { code: '+44',  label: 'UK (+44)',        minLen: 10, maxLen: 10, placeholder: '7911 123456' },
    { code: '+971', label: 'UAE (+971)',      minLen: 9,  maxLen: 9,  placeholder: '50 123 4567' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '+91',
    phone: '',
    dob: '',
    address: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const getSelectedCountry = () =>
    countryCodes.find(c => c.code === formData.countryCode) || countryCodes[0];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset phone when country code changes
    if (name === 'countryCode') {
      setFormData(prev => ({ ...prev, countryCode: value, phone: '' }));
      setFormErrors(prev => ({ ...prev, phone: '' }));
      if (error) clearError();
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const validateForm = () => {
    const errors = {};
    const country = getSelectedCountry();

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone: digits only, exact length per country
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]+$/.test(formData.phone)) {
      errors.phone = 'Phone number must contain digits only';
    } else if (formData.phone.length < country.minLen || formData.phone.length > country.maxLen) {
      errors.phone =
        country.minLen === country.maxLen
          ? `Phone number must be exactly ${country.minLen} digits for ${country.label}`
          : `Phone number must be ${country.minLen}–${country.maxLen} digits for ${country.label}`;
    }

    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dob);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      if (dob > minAge) {
        errors.dob = 'You must be at least 18 years old to register';
      }
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fullPhone = `${formData.countryCode}${formData.phone}`;
    const payload = { ...formData, phone: fullPhone };
    const result = await signup(payload);

    if (result.success) {
      navigate('/login', { state: { message: result.message || 'Signup successful' } });
    }
  };

  const selectedCountry = getSelectedCountry();

  // Live digit count indicator color
  const phoneLen = formData.phone.length;
  const phoneOk = phoneLen >= selectedCountry.minLen && phoneLen <= selectedCountry.maxLen;
  const phoneCountColor =
    phoneLen === 0 ? 'text-gray-400'
    : phoneOk     ? 'text-green-600'
    :               'text-red-500';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join GeoSentinel to start monitoring</p>
        </div>

        {error && <ErrorMessage message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" id="name" name="name"
              value={formData.name} onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your full name" disabled={loading}
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your email" disabled={loading}
            />
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                disabled={loading}
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                type="tel" name="phone"
                value={formData.phone} onChange={handleChange}
                maxLength={selectedCountry.maxLen}
                className={`flex-1 px-3 py-2 border rounded-lg ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={selectedCountry.placeholder}
                disabled={loading}
              />
            </div>

            {/* Live digit counter */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">
                Required: {selectedCountry.minLen === selectedCountry.maxLen
                  ? `${selectedCountry.minLen} digits`
                  : `${selectedCountry.minLen}–${selectedCountry.maxLen} digits`}
              </span>
              <span className={`text-xs font-medium ${phoneCountColor}`}>
                {phoneLen}/{selectedCountry.maxLen}
              </span>
            </div>

            {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
          </div>

          {/* DOB */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date" id="dob" name="dob"
              value={formData.dob} onChange={handleChange}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}   // ← 18 years ago
              min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]} 
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.dob ? 'border-red-500' : 'border-gray-300'}`}
              disabled={loading}
            />
            {formErrors.dob && <p className="text-red-500 text-sm mt-1">{formErrors.dob}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text" id="address" name="address"
              value={formData.address} onChange={handleChange}
              maxLength={200}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.address ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your address (max 200 characters)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.address.length}/200 characters</p>
            {formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" id="password" name="password"
              value={formData.password} onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Create a password" disabled={loading}
            />
            {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password" id="confirmPassword" name="confirmPassword"
              value={formData.confirmPassword} onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Confirm your password" disabled={loading}
            />
            {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50 flex justify-center"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-medium">Sign in here</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default SignupForm;