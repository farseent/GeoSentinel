// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useMap from '../hooks/useMap';
import useRequests from '../hooks/useRequests';
import MapContainer from '../components/map/MapContainer';
import AOISelector from '../components/map/AOISelector';
import DateRangePicker from '../components/map/DateRangePicker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { coordinates, setCoordinates } = useMap();
  const { submitRequest, isSubmitting, error } = useRequests();
  
  const [selectedAOI, setSelectedAOI] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [aoiSelectorEnabled, setAoiSelectorEnabled] = useState(false);

  useEffect(() => {
    setAoiSelectorEnabled(isAuthenticated);
  }, [isAuthenticated]);

  const handleAOISelect = (aoiData) => {
    setSelectedAOI(aoiData);
    setCoordinates(aoiData.coordinates);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleSubmitRequest = async () => {
    if (!selectedAOI || !dateRange.startDate || !dateRange.endDate) {
      return;
    }

    const requestData = {
      aoi: selectedAOI,
      dateRange: dateRange,
      coordinates: coordinates
    };

    try {
      await submitRequest(requestData);
      setShowSuccess(true);
      // Reset form
      setSelectedAOI(null);
      setDateRange({ startDate: '', endDate: '' });
      setCoordinates(null);
      
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit request:', err);
    }
  };

  const isSubmitDisabled = !selectedAOI || !dateRange.startDate || !dateRange.endDate || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🌍 GeoSentinal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor and analyze geographical changes over time with satellite imagery. 
            {!isAuthenticated && (
              <span className="block mt-2 text-sm text-blue-600">
                Please log in to start selecting areas of interest and submitting requests.
              </span>
            )}
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 mx-auto max-w-md">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">Request submitted successfully!</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setShowSuccess(false)}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Controls
              </h2>
              
              {/* AOI Selector Toggle */}
              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={aoiSelectorEnabled && isAuthenticated}
                    disabled={!isAuthenticated}
                    onChange={(e) => setAoiSelectorEnabled(e.target.checked)}
                    className="h-4 w-4 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm font-medium ${!isAuthenticated ? 'text-gray-400' : 'text-gray-700'}`}>
                    Enable AOI Selector
                  </span>
                </label>
                {!isAuthenticated && (
                  <p className="text-xs text-gray-400 mt-1">
                    Login required to enable
                  </p>
                )}
              </div>

              {/* AOI Information */}
              {selectedAOI && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Selected AOI
                  </h3>
                  <p className="text-xs text-blue-600">
                    Area: {selectedAOI.area ? selectedAOI.area.toFixed(2) : 'N/A'} km²
                  </p>
                  <p className="text-xs text-blue-600">
                    Coordinates: {coordinates ? `${coordinates.length} points` : 'N/A'}
                  </p>
                </div>
              )}

              {/* Date Range Picker */}
              <div className="mb-6">
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateChange}
                  disabled={!isAuthenticated}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitDisabled}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Please log in to submit requests
                </p>
              )}
            </div>

            {/* Instructions */}
            {/* <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                How to Use
              </h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">1</span>
                  <span>Log in to your account</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">2</span>
                  <span>Enable AOI selector</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">3</span>
                  <span>Draw a rectangle on the map</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">4</span>
                  <span>Select date range</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">5</span>
                  <span>Submit your request</span>
                </li>
              </ol>
            </div> */}
          </div>

          {/* Map Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-[600px] relative">
                <MapContainer>
                  {aoiSelectorEnabled && isAuthenticated && (
                    <AOISelector
                      onAOISelect={handleAOISelect}
                      selectedAOI={selectedAOI}
                    />
                  )}
                </MapContainer>

                {/* Floating info banner for unauthenticated users */}
                {!isAuthenticated && (
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 border border-gray-300 p-4 rounded-lg shadow-lg text-center max-w-xs z-20">
                    <div className="text-2xl mb-2">🔒</div>
                    <div className="text-base font-semibold text-gray-800 mb-1">
                      Authentication Required
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Log in to interact with the map and submit AOI requests.
                    </p>
                    <div className="space-x-2">
                      <a
                        href="/login"
                        className="inline-block bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Log In
                      </a>
                      <a
                        href="/signup"
                        className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
                      >
                        Sign Up
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl mb-3">🛰️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Satellite Imagery
            </h3>
            <p className="text-sm text-gray-600">
              Access high-resolution satellite imagery from multiple sources and time periods.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Change Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Analyze geographical changes over time with advanced image processing algorithms.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibent text-gray-800 mb-2">
              Fast Processing
            </h3>
            <p className="text-sm text-gray-600">
              Get your analysis results quickly with our optimized processing pipeline.
            </p>
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default Home;