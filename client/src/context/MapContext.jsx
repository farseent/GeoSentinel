import React, { createContext, useContext, useState, useRef } from "react";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  // AOI and coordinates state
  const [aoi, setAoi] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  
  // Date range state
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  
  // AOI enabled state
  const [aoiEnabled, setAoiEnabled] = useState(false);

  // Store map instance
  const mapRef = useRef(null);

  // Called from MapContainer when map is created
  const handleMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  // Helper function to clear all AOI data
  const clearAOI = () => {
    setAoi(null);
    setCoordinates(null);
  };

  return (
    <MapContext.Provider
      value={{
        // AOI state
        aoi, 
        setAoi,
        
        // Coordinates state  
        coordinates, 
        setCoordinates,
        
        // Date range state
        dateRange, 
        setDateRange,
        
        // AOI enabled state
        aoiEnabled, 
        setAoiEnabled,
        
        // Map instance
        map: mapRef,
        onMapLoad: handleMapLoad,
        
        // Helper functions
        clearAOI
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => useContext(MapContext);