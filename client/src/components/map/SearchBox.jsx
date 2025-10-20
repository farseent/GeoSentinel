// components/map/SearchBox.jsx (updated)
import React, { useState, useRef } from 'react';
import useMap from '../../hooks/useMap';

const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { onMapLoad } = useMap();
  const searchRef = useRef(null);

  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const results = await response.json();
      
      setSuggestions(results);
      setIsExpanded(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const handleSuggestionClick = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    
    // Zoom to the selected location using the map instance from useMap hook
    if (onMapLoad) {
      const map = onMapLoad();
      map.setView([lat, lon], 13);
    }
    
    setQuery(place.display_name);
    setSuggestions([]);
    setIsExpanded(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsExpanded(false);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        🔍 Search Location
      </label>
      
      <div className="relative">
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder="Enter city, landmark, or address..."
            className="w-full outline-none text-sm bg-transparent"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 ml-2 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10">
            <div className="px-3 py-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Searching...</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Suggestions */}
        {isExpanded && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {suggestions.map((place, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(place)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-800">
                  {place.display_name.split(',')[0]}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {place.display_name.split(',').slice(1).join(',').trim()}
                </div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span className="capitalize">{place.type}</span>
                  <span>📍 {parseFloat(place.lat).toFixed(4)}, {parseFloat(place.lon).toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {isExpanded && query && !isLoading && suggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10">
            <div className="px-3 py-2 text-sm text-gray-500">
              No places found. Try different keywords.
            </div>
          </div>
        )}
      </div>

      {/* Quick Search Tips */}
      {!query && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Try: <span className="text-blue-600">"Paris"</span>, <span className="text-blue-600">"Mount Everest"</span>, <span className="text-blue-600">"Tokyo Tower"</span></div>
        </div>
      )}

      {/* Selected Location Info */}
      {query && suggestions.length === 0 && !isLoading && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✅ Location selected: <span className="font-medium">{query}</span>
        </div>
      )}
    </div>
  );
};

export default SearchBox;