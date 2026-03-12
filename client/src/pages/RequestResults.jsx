import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// All result image types the model produces
const RESULT_TABS = [
  { key: 'post_map',       label: 'Best Result',       description: 'Post-processed change map (recommended)' },
  { key: 'basic_map',      label: 'Basic Map',         description: 'Raw FresUNet model output' },
  { key: 'tta_map',        label: 'TTA Map',           description: 'Test-time augmentation result' },
  { key: 'hybrid_map',     label: 'Hybrid Map',        description: 'Deep learning + traditional CV combined' },
  { key: 'heatmap',        label: 'Heatmap',           description: 'Jet colormap intensity visualization' },
  { key: 'overlay_before', label: 'Overlay Before',    description: 'Changes highlighted on Date 1 (red)' },
  { key: 'overlay_after',  label: 'Overlay After',     description: 'Changes highlighted on Date 2 (green)' },
  { key: 'contour_before', label: 'Contour Before',    description: 'Contour lines on Date 1' },
  { key: 'contour_after',  label: 'Contour After',     description: 'Contour lines on Date 2' },
  { key: 'edges',          label: 'Edge Map',          description: 'Edge detection of changed areas' },
  { key: 'diff_map',       label: 'Difference Map',    description: 'Raw pixel-level difference' },
  { key: 'diff_heatmap',   label: 'Difference Heatmap',description: 'Difference map with hot colormap' },
];

const RequestResults = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState('post_map');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/requests/${requestId}`);
        setRequest(res.data.request || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load request.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  // Build image URL from a filename key
  const imageUrl = (filename) =>
    `${BASE_URL}/uploads/requests/${requestId}/${filename}.png`;

  const handleDownload = async (filename, label) => {
    try {
      const response = await fetch(imageUrl(filename));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${requestId}_${filename}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed.');
    }
  };

  const handleDownloadAll = async () => {
    for (const tab of RESULT_TABS) {
      await handleDownload(tab.key, tab.label);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 underline">
          Go Back
        </button>
      </div>
    );
  }

  const activeTabInfo = RESULT_TABS.find(t => t.key === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 shadow-sm text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Request Results
              </h1>
              <p className="text-sm text-gray-500">
                #{requestId.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-600 shadow-md text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download All
          </motion.button>
        </div>

        {/* ── Statistics ── */}
        {/* {request?.stats && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pixels',   value: request.stats.total_pixels?.toLocaleString() },
              { label: 'Changed Pixels', value: request.stats.changed_pixels?.toLocaleString() },
              { label: 'Change Area',    value: `${request.stats.change_percentage}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )} */}

        {/* ── Sentinel Images ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Satellite Images</h2>
            <span className="text-xs text-gray-400 ml-1">
              {request?.dateFrom && new Date(request.dateFrom).toLocaleDateString()} →{' '}
              {request?.dateTo && new Date(request.dateTo).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Date From */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Date 1 — {request?.dateFrom && new Date(request.dateFrom).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDownload('image_from', 'image_from')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ArrowDownTrayIcon className="h-3 w-3" /> Download
                </button>
              </div>
              <img
                src={`${BASE_URL}/uploads/requests/${requestId}/image_from.png`}
                alt="Satellite image Date 1"
                className="w-full h-64 rounded-xl border border-gray-200 object-contain bg-gray-50"
                onError={(e) => { e.target.src = ''; e.target.alt = 'Image not available'; }}
              />
            </div>

            {/* Date To */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Date 2 — {request?.dateTo && new Date(request.dateTo).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDownload('image_to', 'image_to')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ArrowDownTrayIcon className="h-3 w-3" /> Download
                </button>
              </div>
              <img
                src={`${BASE_URL}/uploads/requests/${requestId}/image_to.png`}
                alt="Satellite image Date 2"
                className="w-full h-64 rounded-xl border border-gray-200 object-contain bg-gray-50"
                onError={(e) => { e.target.src = ''; e.target.alt = 'Image not available'; }}
              />
            </div>
          </div>
        </div>

        {/* ── Change Detection Results ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900">Change Detection Maps</h2>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto border-b border-gray-100">
            <div className="flex min-w-max px-4">
              {RESULT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'post_map' && (
                    <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Best
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{activeTabInfo?.description}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDownload(activeTab, activeTabInfo?.label)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </motion.button>
            </div>

            <div className="flex justify-center bg-gray-50 rounded-xl p-4">
              <motion.img
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                src={imageUrl(activeTab)}
                alt={activeTabInfo?.label}
                className="max-h-[450px] w-auto rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.nextSibling.style.display = 'flex';
                }}
              />
              <div
                style={{ display: 'none' }}
                className="w-full h-64 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm"
              >
                Image not available
              </div>
            </div>
          </div>
        </div>

        {/* ── Request Info ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Request Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-medium text-green-600">{request?.status}</p>
            </div>
            <div>
              <p className="text-gray-400">Submitted</p>
              <p className="font-medium">{request?.createdAt && new Date(request.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Completed</p>
              <p className="font-medium">{request?.completedAt && new Date(request.completedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">AOI Area</p>
              <p className="font-medium">
                {request?.coordinates
                  ? `${Math.abs((request.coordinates.north - request.coordinates.south) * (request.coordinates.east - request.coordinates.west)).toFixed(2)} km²`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestResults;