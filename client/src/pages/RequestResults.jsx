import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const RESULT_TABS = [
  { key: 'post_map',       label: 'Best Result',    description: 'Post-processed change map (recommended)' },
  { key: 'basic_map',      label: 'Basic Map',      description: 'Raw FresUNet model output' },
  { key: 'tta_map',        label: 'TTA Map',        description: 'Test-time augmentation result' },
  { key: 'hybrid_map',     label: 'Hybrid Map',     description: 'Deep learning + traditional CV combined' },
  { key: 'heatmap',        label: 'Heatmap',        description: 'Jet colormap intensity visualization' },
  { key: 'overlay_before', label: 'Overlay Before', description: 'Changes highlighted on Date 1 (red)' },
  { key: 'overlay_after',  label: 'Overlay After',  description: 'Changes highlighted on Date 2 (green)' },
  { key: 'edges',          label: 'Edge Map',       description: 'Edge detection of changed areas' },
];

const MAP_LEGENDS = {
  post_map:       ['⚪ White areas → Changes detected between the two dates', '⚫ Black areas → No change (area remained the same)'],
  basic_map:      ['⚪ White areas → Possible changes (raw model output)', '⚫ Black areas → No change', '⚠️ May contain noise or false detections'],
  tta_map:        ['⚪ White areas → More reliable changes (enhanced with multiple predictions)', '⚫ Black areas → No change'],
  hybrid_map:     ['⚪ White areas → Final detected changes using AI + image processing', '⚫ Black areas → No change', '✅ More accurate than basic map'],
  heatmap:        ['🔴 Red/Yellow → High change intensity', '🔵 Blue → Little or no change'],
  overlay_before: ['🔴 Red highlights → Changes shown on the first date image', '🖼️ Background → Original satellite image (Date 1)'],
  overlay_after:  ['🟢 Green highlights → Changes shown on the second date image', '🖼️ Background → Original satellite image (Date 2)'],
  edges:          ['⚪ White lines → Boundaries of changed areas', '⚫ Black areas → No edges detected'],
};

// ── Image with fallback ──────────────────────────────────────────────────────
const ImageWithFallback = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`${className} flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 text-gray-400 text-sm`}>
      Image not available
    </div>
  ) : (
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
};

// ── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ src, alt, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.92 }}
        className="relative max-w-5xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1 shadow-lg text-gray-700 hover:text-gray-900"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <img src={src} alt={alt} className="w-full max-h-[85vh] object-contain rounded-xl" />
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ── Main Component ────────────────────────────────────────────────────────────
const RequestResults = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState('post_map');
  const [lightboxSrc, setLightboxSrc] = useState(null);

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

  const imageUrl = (filename) =>
    `${BASE_URL}/uploads/requests/${requestId}/${filename}.png`;

  const handleDownload = async (filename) => {
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
      await handleDownload(tab.key);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      <p className="text-red-500 text-center">{error}</p>
      <button onClick={() => navigate(-1)} className="text-blue-600 underline">Go Back</button>
    </div>
  );

  const activeTabInfo = RESULT_TABS.find(t => t.key === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8">
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={activeTabInfo?.label}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Request Results
              </h1>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-600 shadow-md text-sm w-full sm:w-auto"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download All
          </motion.button>
        </div>

        {/* ── Statistics ── */}
        {request?.stats && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Total Pixels',   value: request.stats.total_pixels?.toLocaleString() },
              { label: 'Changed Pixels', value: request.stats.changed_pixels?.toLocaleString() },
              { label: 'Change Area',    value: `${request.stats.change_percentage}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 text-center border border-gray-100">
                <p className="text-lg sm:text-3xl font-bold text-blue-600 truncate">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Satellite Images ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-blue-500 shrink-0" />
            <h2 className="font-semibold text-gray-900">Satellite Images</h2>
            <span className="text-xs text-gray-400">
              {request?.dateFrom && new Date(request.dateFrom).toLocaleDateString()} →{' '}
              {request?.dateTo && new Date(request.dateTo).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            {[
              { key: 'image_from', label: 'Date 1', date: request?.dateFrom },
              { key: 'image_to',   label: 'Date 2', date: request?.dateTo   },
            ].map(({ key, label, date }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {label} — {date && new Date(date).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleDownload(key)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    <ArrowDownTrayIcon className="h-3 w-3" /> Download
                  </button>
                </div>
                <div
                  className="cursor-zoom-in"
                  onClick={() => setLightboxSrc(`${BASE_URL}/uploads/requests/${requestId}/${key}.png`)}
                >
                  <ImageWithFallback
                    src={`${BASE_URL}/uploads/requests/${requestId}/${key}.png`}
                    alt={`Satellite image ${label}`}
                    className="w-full h-52 sm:h-64 rounded-xl border border-gray-200 object-contain bg-gray-50 hover:opacity-90 transition-opacity"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Change Detection Results ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900">Change Detection Maps</h2>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto border-b border-gray-100">
            <div className="flex min-w-max px-2 sm:px-4">
              {RESULT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
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
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">{activeTabInfo?.description}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDownload(activeTab)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm w-full sm:w-auto"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </motion.button>
            </div>

            {MAP_LEGENDS[activeTab] && (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
                <ul className="space-y-1">
                  {MAP_LEGENDS[activeTab].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className="flex justify-center bg-gray-50 rounded-xl p-3 sm:p-4 cursor-zoom-in"
              onClick={() => setLightboxSrc(imageUrl(activeTab))}
            >
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ImageWithFallback
                  src={imageUrl(activeTab)}
                  alt={activeTabInfo?.label}
                  className="max-h-[280px] sm:max-h-[450px] w-auto rounded-lg hover:opacity-90 transition-opacity"
                />
              </motion.div>
            </div>
            <p className="text-center text-xs text-gray-400">Tap image to enlarge</p>
          </div>
        </div>

        {/* ── Request Info ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Request Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Status',    value: request?.status,         valueClass: 'text-green-600' },
              { label: 'Submitted', value: request?.createdAt   && new Date(request.createdAt).toLocaleString() },
              { label: 'Completed', value: request?.completedAt && new Date(request.completedAt).toLocaleString() },
              {
                label: 'AOI Area',
                value: request?.coordinates
                  ? `${Math.abs((request.coordinates.north - request.coordinates.south) * (request.coordinates.east - request.coordinates.west)).toFixed(2)} km²`
                  : 'N/A',
              },
            ].map(({ label, value, valueClass }) => (
              <div key={label} className="min-w-0">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className={`font-medium text-sm truncate ${valueClass || ''}`}>{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestResults;