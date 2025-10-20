import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useMap from '../hooks/useMap';
import useRequests from '../hooks/useRequests';
import MapContainer from '../components/map/MapContainer';
import SearchBox from '../components/map/SearchBox';
import DateRangePicker from '../components/map/DateRangePicker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SuccessMessage from "../components/common/SuccessMessage";
import ErrorMessage from '../components/common/ErrorMessage';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { aoi, setAoi, coordinates, setCoordinates } = useMap();
  const { createRequest, isSubmitting, errorMessage, successMessage, clearErrorMessage, clearSuccessMessage } = useRequests();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleClearAOI = () => {
    setAoi(null);
    setCoordinates(null);
  };

  const getBoundsFromCoordinates = (coords) => {
  const lats = coords.map(c => c[1]); // latitude values
  const lngs = coords.map(c => c[0]); // longitude values
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
};

const handleSubmitRequest = async () => {
  if (!coordinates || !dateRange.startDate || !dateRange.endDate) {
    return;
  }
  const bounds = getBoundsFromCoordinates(coordinates);

  const requestData = {
    coordinates: bounds,
    dateFrom: dateRange.startDate,
    dateTo: dateRange.endDate,
  };

  const result = await createRequest(requestData);

  if (result.success) {
    setAoi(null);
    setDateRange({ startDate: "", endDate: "" });
    setCoordinates(null);
  } else {
    console.error("Request failed:", result.message);
  }
};

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => clearSuccessMessage(), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, clearSuccessMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => clearErrorMessage(), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearErrorMessage]);

const isSubmitDisabled = !aoi || !dateRange.startDate || !dateRange.endDate || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
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
        {successMessage && (
          <div className="mb-6 mx-auto max-w-md">
              <SuccessMessage message={successMessage} onClose={ clearSuccessMessage }/>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 mx-auto max-w-md">
            <ErrorMessage message={errorMessage} onClose={ clearErrorMessage }/>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Controls
              </h2>

              <SearchBox />

              {/* Authentication Status */}
              {!isAuthenticated && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-red-600">🔒</div>
                    <span className="text-sm font-medium text-red-800">Authentication Required</span>
                  </div>
                  <p className="text-xs text-red-700 mb-3">
                    Please log in to draw AOI rectangles and submit requests.
                  </p>
                  <div className="space-x-2">
                    <a
                      href="/login"
                      className="inline-block bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Log In
                    </a>
                    <a
                      href="/signup"
                      className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                    >
                      Sign Up
                    </a>
                  </div>
                </div>
              )}

              {/* AOI Drawing Instructions */}
              {isAuthenticated && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">
                    🎯 Drawing AOI Rectangle
                  </h3>
                  <div className="space-y-2 text-xs text-blue-700">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span>Use the tool on the map's top-right corner</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span>Click and drag to draw your area of interest</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span>Use the delete tool to remove shapes</span>
                    </div>
                  </div>
                  
                  {aoi && (
                    <button
                      onClick={handleClearAOI}
                      className="w-full mt-3 bg-red-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-red-600 transition-colors"
                    >
                      Clear AOI Selection
                    </button>
                  )}
                </div>
              )}

              {/* AOI Information Display */}
              {aoi && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                    <span className="mr-2">✅</span>
                    AOI Selected
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">Type:</span>
                      <span className="text-green-800 capitalize">{aoi.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">Area:</span>
                      <span className="text-green-800">{aoi.area ? aoi.area.toFixed(2) : 'N/A'} km²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">Points:</span>
                      <span className="text-green-800">{coordinates ? coordinates.length : 'N/A'}</span>
                    </div>
                    {aoi.bounds && (
                      <div className="mt-3 pt-2 border-t border-green-300">
                        <div className="text-green-700 font-medium mb-1">Coordinates:</div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-green-600">
                          <div>N: {aoi.bounds.north.toFixed(4)}°</div>
                          <div>S: {aoi.bounds.south.toFixed(4)}°</div>
                          <div>E: {aoi.bounds.east.toFixed(4)}°</div>
                          <div>W: {aoi.bounds.west.toFixed(4)}°</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Date Range Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Select Date Range
                </label>
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateChange}
                  disabled={!isAuthenticated}
                />
                {!isAuthenticated && (
                  <p className="text-xs text-gray-400 mt-1">
                    Login required to select dates
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitDisabled}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isSubmitDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Submitting Request...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Submit AOI Request</span>
                  </div>
                )}
              </button>

              {/* Submit Requirements */}
              <div className="mt-3 text-xs text-gray-500">
                {!isAuthenticated && (
                  <div className="text-center">Please log in to submit requests</div>
                )}
                {isAuthenticated && (
                  <div className="space-y-1">
                    <div className={aoi ? 'text-green-600' : 'text-gray-400'}>
                      {aoi ? '✅' : '⚪'} AOI rectangle drawn
                    </div>
                    <div className={dateRange.startDate && dateRange.endDate ? 'text-green-600' : 'text-gray-400'}>
                      {dateRange.startDate && dateRange.endDate ? '✅' : '⚪'} Date range selected
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Section */}
            {isAuthenticated && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">💡 Tips</h3>
                <ul className="space-y-1 text-xs text-gray-600">
                  {/* <li>• Use search to quickly navigate to locations</li> */}
                  <li>• Keep AOI size reasonable for faster processing</li>
                  <li>• Larger areas may take longer to analyze</li>
                  <li>• You can zoom in/out before drawing</li>
                  {/* <li>• Use satellite view for better reference</li> */}
                </ul>
              </div>
            )}
          </div>

          {/* Map Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-[600px] relative">
                <MapContainer />
                
                {/* Status Overlay */}
                {isAuthenticated && (
                  <div className="absolute top-4 left-4 bg-white bg-opacity-95 border border-gray-200 px-3 py-2 rounded-lg shadow-lg z-10">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${aoi ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
                      <span className="text-sm font-medium text-gray-800">
                        {aoi ? 'AOI Selected' : 'Ready to Draw AOI'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;