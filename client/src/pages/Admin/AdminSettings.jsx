import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [allowedEmails, setAllowedEmails] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      
      const data = response.data.data;
      setSettings(data);
      setMaintenanceEnabled(data.maintenanceMode.enabled);
      setMaintenanceMessage(data.maintenanceMode.message);
      setAllowedEmails(data.maintenanceMode.allowedEmails.join(', '));
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to fetch settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const emailsArray = allowedEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      await adminAPI.updateSettings({
        maintenanceMode: {
          enabled: maintenanceEnabled,
          message: maintenanceMessage,
          allowedEmails: emailsArray
        }
      });

      setMessage({
        type: 'success',
        text: 'Settings updated successfully!'
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update settings'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Message Display */}
      {message.text && (
        <div className={`px-4 py-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Maintenance Mode Settings */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
          <p className="text-gray-600 text-sm mb-4">
            When enabled, regular users won't be able to access the system. Admin users will still have access.
          </p>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center space-x-3 mb-6">
            <button
              type="button"
              onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                maintenanceEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  maintenanceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {maintenanceEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Maintenance Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maintenance Message
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the message users will see during maintenance..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be displayed to users when they try to access the system.
            </p>
          </div>

          {/* Allowed Emails */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Emails (Optional)
            </label>
            <input
              type="text"
              value={allowedEmails}
              onChange={(e) => setAllowedEmails(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated list of emails that can access the system during maintenance (in addition to admins).
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Last Updated:</span>
            <span className="ml-2 font-medium">
              {settings?.updatedAt 
                ? new Date(settings.updatedAt).toLocaleString() 
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Maintenance Status:</span>
            <span className={`ml-2 font-medium ${
              maintenanceEnabled ? 'text-red-600' : 'text-green-600'
            }`}>
              {maintenanceEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;