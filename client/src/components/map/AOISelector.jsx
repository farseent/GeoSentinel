// src/components/map/AOISelector.jsx
import React, { useEffect, useState } from 'react';
import  useMap  from '../../hooks/useMap';

const AOISelector = ({ onAOISelect, selectedAOI }) => {
  const { mapInstance } = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState('rectangle'); // rectangle, polygon, circle

  useEffect(() => {
    if (!mapInstance) return;

    // Initialize drawing tools
    const initializeDrawingTools = () => {
      // This would integrate with your chosen mapping library (Leaflet, MapBox, etc.)
      // For now, we'll simulate the drawing functionality
      
      const handleMapClick = (event) => {
        if (!isDrawing) return;
        
        // Simulate rectangle drawing
        if (drawingMode === 'rectangle') {
          // In a real implementation, this would handle mouse events for drawing
          simulateRectangleSelection();
        }
      };

      // Add event listeners
      mapInstance.addEventListener('click', handleMapClick);

      return () => {
        mapInstance.removeEventListener('click', handleMapClick);
      };
    };

    const cleanup = initializeDrawingTools();
    return cleanup;
  }, [mapInstance, isDrawing, drawingMode]);

  const simulateRectangleSelection = () => {
    // Simulate AOI selection with dummy coordinates
    const dummyAOI = {
      type: 'rectangle',
      coordinates: [
        [77.0, 10.0], // Southwest corner
        [78.0, 10.0], // Southeast corner  
        [78.0, 11.0], // Northeast corner
        [77.0, 11.0], // Northwest corner
        [77.0, 10.0]  // Close the polygon
      ],
      bounds: {
        north: 11.0,
        south: 10.0,
        east: 78.0,
        west: 77.0
      },
      area: 12100 // Approximate area in km²
    };

    onAOISelect(dummyAOI);
    setIsDrawing(false);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    // Change cursor style
    if (mapInstance) {
      mapInstance.style.cursor = 'crosshair';
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (mapInstance) {
      mapInstance.style.cursor = 'grab';
    }
  };

  const clearSelection = () => {
    onAOISelect(null);
    // Clear drawn shapes from map
    // This would interact with your mapping library to remove drawn polygons
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        Area of Interest Selector
      </h3>

      {/* Drawing Mode Selection */}
      <div className="mb-4">
        <label className="text-xs text-gray-600 block mb-2">Drawing Mode:</label>
        <select
          value={drawingMode}
          onChange={(e) => setDrawingMode(e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isDrawing}
        >
          <option value="rectangle">Rectangle</option>
          <option value="polygon">Polygon</option>
          <option value="circle">Circle</option>
        </select>
      </div>

      {/* Control Buttons */}
      <div className="space-y-2">
        {!isDrawing ? (
          <button
            onClick={startDrawing}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start Drawing {drawingMode}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={stopDrawing}
              className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Cancel Drawing
            </button>
            <button
              onClick={simulateRectangleSelection}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Simulate Selection
            </button>
          </div>
        )}

        {selectedAOI && (
          <button
            onClick={clearSelection}
            className="w-full bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Drawing Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
        {isDrawing ? (
          <div className="text-blue-800">
            <div className="font-medium mb-1">Drawing Mode Active</div>
            {drawingMode === 'rectangle' && (
              <p>Click and drag to draw a rectangle on the map.</p>
            )}
            {drawingMode === 'polygon' && (
              <p>Click points on the map to create a polygon. Double-click to finish.</p>
            )}
            {drawingMode === 'circle' && (
              <p>Click center point and drag to set radius.</p>
            )}
          </div>
        ) : (
          <div className="text-blue-600">
            <div className="font-medium mb-1">Instructions</div>
            <p>Select a drawing mode and click "Start Drawing" to define your area of interest.</p>
          </div>
        )}
      </div>

      {/* Selected AOI Info */}
      {selectedAOI && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <div className="text-xs font-medium text-green-800 mb-2">
            Selected AOI Information
          </div>
          <div className="space-y-1 text-xs text-green-700">
            <div>Type: {selectedAOI.type}</div>
            <div>Area: {selectedAOI.area?.toFixed(2)} km²</div>
            {selectedAOI.bounds && (
              <div>
                Bounds: ({selectedAOI.bounds.south.toFixed(3)}, {selectedAOI.bounds.west.toFixed(3)}) 
                to ({selectedAOI.bounds.north.toFixed(3)}, {selectedAOI.bounds.east.toFixed(3)})
              </div>
            )}
            <div className="text-xs text-green-600 mt-2">
              Coordinates: {selectedAOI.coordinates?.length} points
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
        <div className="font-medium mb-1">💡 Tips</div>
        <ul className="space-y-1">
          <li>• Keep AOI size reasonable for faster processing</li>
          <li>• Rectangle mode is fastest for regular areas</li>
          <li>• Use polygon for irregular shapes</li>
        </ul>
      </div>
    </div>
  );
};

export default AOISelector;